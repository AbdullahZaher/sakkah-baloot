import type {
  Card,
  CardId,
  GameState,
  MatchEndResult,
  MatchScore,
  MatchSeed,
  MatchState,
  PlayerId,
  ProjectDeclaration,
  RoundScoreBreakdown,
  RoundState,
  Seat,
  Suit,
} from "@sakkah-baloot/game-engine";
import {
  DECK,
  SEATS,
  applyBiddingAction,
  applyCardPlay,
  completeDeal,
  completeMatchRound,
  completeRoundState,
  createBalootDeclaration,
  createBiddingState,
  createInitialDeal,
  createMatchState,
  createRoundState,
  createSeededRandom,
  declareProject,
  detectProjects,
  getCardById,
  isCardLegal,
  isProjectDeclarationWindow,
  legalBiddingActions,
  nextCounterClockwise,
  rotateDealer,
  scoreCompletedRound,
  startNextRound,
  withRoundBaloot,
  withRoundGame,
  withRoundProjects,
} from "@sakkah-baloot/game-engine";
import type {
  BidEvent,
  DealEvent,
  MatchCompleteEvent,
  MatchProtocolEvent,
  NextRoundEvent,
  PlayCardEvent,
  ProjectEvent,
  RoundCompleteEvent,
  ServerEventEnvelope,
  TrickCompleteEvent,
} from "@sakkah-baloot/game-protocol";
import { deterministicEventId } from "@sakkah-baloot/game-protocol";
import { ServerBoundaryError, ServerErrorCode } from "./errors.js";
import { EventStore } from "./event-store.js";
import { IdempotencyLedger } from "./idempotency-ledger.js";
import { InMemoryMatchPersistence } from "./persistence.js";
import { buildPlayerScopedSnapshot } from "./player-snapshot.js";
import { SeatRouter } from "./seat-router.js";
import type {
  AuthoritativeMatchHost,
  ClientCommand,
  CommandResult,
  ConnectionStatus,
  MatchHostConfig,
  MatchPersistence,
  PlayerScopedSnapshot,
  ResumeResult,
} from "./types.js";

export class AuthoritativeMatchHostImpl implements AuthoritativeMatchHost {
  public readonly matchId: string;
  private stateVersion = 0;
  private matchState: MatchState;
  private readonly seatRouter: SeatRouter;
  private readonly idempotencyLedger: IdempotencyLedger;
  private readonly eventStore: EventStore;
  private readonly persistence: MatchPersistence;
  private readonly connectionStatus: Record<PlayerId, ConnectionStatus> = {};
  private readonly randomSeed: MatchSeed;

  constructor(config: MatchHostConfig) {
    this.matchId = config.matchId;
    this.seatRouter = new SeatRouter(config.playerBindings);
    this.idempotencyLedger = new IdempotencyLedger();
    this.eventStore = new EventStore();
    this.persistence = config.persistence ?? new InMemoryMatchPersistence();
    this.randomSeed = config.seed ?? (config.matchId as MatchSeed);

    for (const seat of SEATS) {
      const playerId = this.seatRouter.getPlayer(seat);
      this.connectionStatus[playerId] = "CONNECTED";
    }

    const initialDealer: Seat = config.initialDealerSeat ?? "NORTH";
    const initialRoundId = `${this.matchId}:round:1`;
    const random = createSeededRandom(this.randomSeed);
    const initialDeal = createInitialDeal(initialRoundId, initialDealer, random);
    const initialBidding = createBiddingState(initialRoundId, initialDealer);
    const initialRound = createRoundState(initialDeal, initialBidding, 1);

    this.matchState = createMatchState(
      this.matchId,
      initialDealer,
      1,
      initialRound,
    );

    // Initial snapshot saved at version 0
    void this.persistence.saveSnapshot(this.matchId, 0, this.matchState);
  }

  public getStateVersion(): number {
    return this.stateVersion;
  }

  public getMatchState(): MatchState {
    return JSON.parse(JSON.stringify(this.matchState));
  }

  public getPlayerSeat(playerId: PlayerId): Seat {
    return this.seatRouter.getSeat(playerId);
  }

  public getAllBindings(): Readonly<Record<Seat, PlayerId>> {
    return this.seatRouter.getAllBindings();
  }

  public getSnapshot(playerId: PlayerId): PlayerScopedSnapshot {
    if (!this.seatRouter.isPlayerSeated(playerId)) {
      throw new ServerBoundaryError(
        ServerErrorCode.UNKNOWN_PLAYER,
        `Player ${playerId} is not part of match ${this.matchId}`,
      );
    }
    return buildPlayerScopedSnapshot(
      this.matchState,
      playerId,
      this.seatRouter,
      this.connectionStatus,
    );
  }

  public disconnect(playerId: PlayerId): void {
    if (this.seatRouter.isPlayerSeated(playerId)) {
      this.connectionStatus[playerId] = "DISCONNECTED";
    }
  }

  public async reconnect(
    playerId: PlayerId,
    resumeFromVersion?: number,
  ): Promise<ResumeResult> {
    if (!this.seatRouter.isPlayerSeated(playerId)) {
      throw new ServerBoundaryError(
        ServerErrorCode.UNKNOWN_PLAYER,
        `Player ${playerId} is not part of match ${this.matchId}`,
      );
    }

    this.connectionStatus[playerId] = "CONNECTED";

    if (
      resumeFromVersion !== undefined &&
      resumeFromVersion > this.stateVersion
    ) {
      throw new ServerBoundaryError(
        ServerErrorCode.FUTURE_STATE_VERSION,
        `Cannot resume from future version ${resumeFromVersion} (current: ${this.stateVersion})`,
      );
    }

    const missedEvents =
      resumeFromVersion !== undefined
        ? this.eventStore.getEventsAfter(resumeFromVersion)
        : [];

    const snapshot = this.getSnapshot(playerId);

    return {
      matchId: this.matchId,
      playerId,
      currentVersion: this.stateVersion,
      snapshot,
      missedEvents,
    };
  }

  public async submitCommand(command: ClientCommand): Promise<CommandResult> {
    if (!command.actionId || typeof command.actionId !== "string" || command.actionId.trim() === "") {
      throw new ServerBoundaryError(
        ServerErrorCode.INVALID_ACTION_ID,
        "actionId must be a non-empty string",
      );
    }

    // 1. Identity & Match validation
    if (command.matchId !== this.matchId) {
      throw new ServerBoundaryError(
        ServerErrorCode.INVALID_MATCH,
        `Command matchId ${command.matchId} does not match host ${this.matchId}`,
      );
    }

    if (!this.seatRouter.isPlayerSeated(command.playerId)) {
      throw new ServerBoundaryError(
        ServerErrorCode.UNKNOWN_PLAYER,
        `Player ${command.playerId} is not recognized in match ${this.matchId}`,
      );
    }

    const scopedActionId = `${command.playerId}:${command.actionId}`;

    // 2. Idempotency Check: return cached result without advancing stateVersion
    const cached = this.idempotencyLedger.get(scopedActionId);
    if (cached) {
      return cached;
    }

    const playerSeat = this.seatRouter.getSeat(command.playerId);

    if (command.roundId && command.roundId !== this.matchState.roundId) {
      throw new ServerBoundaryError(
        ServerErrorCode.INVALID_ROUND,
        `Command roundId ${command.roundId} does not match active round ${this.matchState.roundId}`,
      );
    }

    // 3. State Version Fencing
    if (command.expectedStateVersion < this.stateVersion) {
      throw new ServerBoundaryError(
        ServerErrorCode.STALE_STATE_VERSION,
        `Stale stateVersion: expected ${this.stateVersion}, got ${command.expectedStateVersion}`,
      );
    }
    if (command.expectedStateVersion > this.stateVersion) {
      throw new ServerBoundaryError(
        ServerErrorCode.FUTURE_STATE_VERSION,
        `Future stateVersion: host is at ${this.stateVersion}, received ${command.expectedStateVersion}`,
      );
    }

    // 4. Match Completion Check
    if (
      this.matchState.phase === "MATCH_COMPLETE" &&
      command.payload.type !== "ADVANCE_ROUND"
    ) {
      throw new ServerBoundaryError(
        ServerErrorCode.MATCH_FINISHED,
        "Match is already finished",
      );
    }

    // 5. Execute Command against Engine
    const producedEvents: MatchProtocolEvent[] = [];
    const payload = command.payload;

    switch (payload.type) {
      case "BID": {
        this.executeBidCommand(command.playerId, playerSeat, payload.action, producedEvents);
        break;
      }
      case "DECLARE_PROJECT": {
        this.executeProjectCommand(command.playerId, playerSeat, payload.projectId, producedEvents);
        break;
      }
      case "DECLARE_BALOOT": {
        this.executeBalootCommand(command.playerId, playerSeat, payload.cardId, producedEvents);
        break;
      }
      case "PLAY_CARD": {
        this.executePlayCardCommand(
          command.playerId,
          playerSeat,
          payload.cardId,
          payload.ikaDeclared ?? false,
          payload.balootDeclared ?? false,
          producedEvents,
        );
        break;
      }
      case "ADVANCE_ROUND": {
        this.executeAdvanceRoundCommand(producedEvents);
        break;
      }
      default: {
        throw new ServerBoundaryError(
          ServerErrorCode.ILLEGAL_ACTION,
          `Unsupported command payload: ${(payload as { type: string }).type}`,
        );
      }
    }

    // 6. Wrap events into envelopes and advance stateVersion
    const eventEnvelopes: ServerEventEnvelope<MatchProtocolEvent>[] = [];
    for (const event of producedEvents) {
      this.stateVersion += 1;
      const envelope: ServerEventEnvelope<MatchProtocolEvent> = {
        matchId: this.matchId,
        eventId: deterministicEventId(this.matchId, this.stateVersion, event),
        stateVersion: this.stateVersion,
        event,
      };
      this.eventStore.append(envelope);
      eventEnvelopes.push(envelope);
    }

    // Update match state version
    this.matchState = {
      ...this.matchState,
      stateVersion: this.stateVersion,
    };

    // 7. Persist Snapshot and Events
    await this.persistence.saveSnapshot(this.matchId, this.stateVersion, this.matchState);
    await this.persistence.appendEvents(this.matchId, eventEnvelopes);

    // 8. Build player-scoped snapshot
    const snapshot = this.getSnapshot(command.playerId);

    const result: CommandResult = {
      success: true,
      matchId: this.matchId,
      stateVersion: this.stateVersion,
      events: eventEnvelopes,
      snapshot,
    };

    // 9. Cache in Idempotency Ledger
    this.idempotencyLedger.record(scopedActionId, result);

    return result;
  }

  private executeBidCommand(
    playerId: PlayerId,
    playerSeat: Seat,
    action: import("@sakkah-baloot/game-engine").BiddingAction,
    producedEvents: MatchProtocolEvent[],
  ): void {
    const round = this.matchState.round;
    if (!round || round.phase !== "BIDDING") {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Cannot bid outside of BIDDING phase",
      );
    }

    if (round.bidding.actingSeat !== playerSeat) {
      throw new ServerBoundaryError(
        ServerErrorCode.NOT_YOUR_TURN,
        `Not ${playerId}'s turn to bid (expected ${round.bidding.actingSeat}, got ${playerSeat})`,
      );
    }

    const exposedSuit = round.deal.exposedCardId
      ? getCardById(round.deal.exposedCardId).suit
      : null;

    const legal = legalBiddingActions(
      round.bidding,
      round.dealerSeat,
      exposedSuit,
      round.deal.hands,
    );

    if (!legal.includes(action.type)) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        `Bidding action ${action.type} is illegal under game-engine rules`,
      );
    }

    const nextBidding = applyBiddingAction(
      round.bidding,
      action,
      round.dealerSeat,
      round.deal.exposedCardId,
      undefined,
      round.deal.hands,
    );

    producedEvents.push({
      type: "BID",
      roundId: round.roundId,
      playerId,
      action,
    });

    let nextRound: RoundState = {
      ...round,
      bidding: nextBidding,
    };

    if (nextBidding.phase === "CONTRACT_SELECTED") {
      const selected = nextBidding.selectedContract!;
      const completedDeal = completeDeal(round.deal, selected.exposedCardReceiverSeat);

      const hands: Record<PlayerId, readonly Card[]> = {} as any;
      for (const seat of SEATS) {
        const pid = this.seatRouter.getPlayer(seat);
        hands[pid] = completedDeal.hands[seat].map(getCardById);
      }

      const gameState: GameState = {
        phase: "PLAYING",
        currentPlayerId: this.seatRouter.getPlayer(nextCounterClockwise(round.dealerSeat)),
        players: this.seatRouter.getPlayerMap(),
        hands,
        contract: selected.contract,
        trumpSuit: selected.trumpSuit,
        hokumPlayMode: "OPEN",
        dealerSeat: round.dealerSeat,
        trickNumber: 1,
        currentTrick: [],
        completedTricks: [],
      };

      nextRound = {
        ...nextRound,
        deal: completedDeal,
      };
      nextRound = withRoundGame(nextRound, gameState);
    } else if (nextBidding.phase === "CANCELLED") {
      // Re-deal for cancelled bidding (e.g. ALL_PASS or KASHO)
      const nextDealer = nextCounterClockwise(round.dealerSeat);
      const nextRoundNumber = this.matchState.roundNumber + 1;
      const newRoundId = `${this.matchId}:round:${nextRoundNumber}`;
      const random = createSeededRandom(`${this.randomSeed}:${nextRoundNumber}`);
      const deal = createInitialDeal(newRoundId, nextDealer, random);
      const bidding = createBiddingState(newRoundId, nextDealer);
      nextRound = createRoundState(deal, bidding, nextRoundNumber);

      this.matchState = {
        ...this.matchState,
        roundId: newRoundId,
        roundNumber: nextRoundNumber,
        dealerSeat: nextDealer,
        round: nextRound,
      };
      return;
    }

    this.matchState = {
      ...this.matchState,
      round: nextRound,
    };
  }

  private executeProjectCommand(
    playerId: PlayerId,
    playerSeat: Seat,
    projectId: string,
    producedEvents: MatchProtocolEvent[],
  ): void {
    const round = this.matchState.round;
    if (!round || round.phase !== "PLAYING" || !round.game) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Projects can only be declared during PLAYING phase",
      );
    }

    const game = round.game;
    if (!isProjectDeclarationWindow(game.phase, game.trickNumber, game.currentTrick.length)) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Project declaration window is closed",
      );
    }

    const playerHand = game.hands[playerId] ?? [];
    const candidates = detectProjects(
      playerHand,
      game.contract,
      game.trumpSuit,
      playerSeat,
    );

    const candidate = candidates.find((c) => c.id === projectId);
    if (!candidate) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        `Project candidate ${projectId} not found in player hand`,
      );
    }

    const declaration = declareProject(
      candidate,
      projectId,
      game.phase,
      game.trickNumber,
      game.currentTrick.length,
      round.projects,
    );

    const nextRound = withRoundProjects(round, [...round.projects, declaration]);

    producedEvents.push({
      type: "PROJECT",
      roundId: round.roundId,
      playerId,
      project: candidate.type,
      suit: null,
    });

    this.matchState = {
      ...this.matchState,
      round: nextRound,
    };
  }

  private executeBalootCommand(
    playerId: PlayerId,
    playerSeat: Seat,
    cardId: CardId,
    producedEvents: MatchProtocolEvent[],
  ): void {
    const round = this.matchState.round;
    if (!round || round.phase !== "PLAYING" || !round.game) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Baloot requires an active PLAYING round",
      );
    }

    if (round.baloot !== null) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Baloot has already been declared for this round",
      );
    }

    const game = round.game;
    const card = game.hands[playerId]?.find((c) => c.id === cardId);
    if (!card) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Baloot card is not in player's hand",
      );
    }

    const alreadyPlayed = [
      ...game.completedTricks.flatMap((t) => t.plays),
      ...game.currentTrick,
    ]
      .filter((p) => p.playerId === playerId)
      .map((p) => p.card);

    const declaration = createBalootDeclaration(
      round.roundId,
      playerSeat,
      game.contract,
      game.trumpSuit,
      card,
      alreadyPlayed,
    );

    if (!declaration) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Invalid Baloot declaration conditions under game-engine rules",
      );
    }

    const nextRound = withRoundBaloot(round, declaration);

    producedEvents.push({
      type: "BALOOT",
      roundId: round.roundId,
      playerId,
      cardId,
      trumpSuit: declaration.trumpSuit,
    });

    this.matchState = {
      ...this.matchState,
      round: nextRound,
    };
  }

  private executePlayCardCommand(
    playerId: PlayerId,
    playerSeat: Seat,
    cardId: CardId,
    ikaDeclared: boolean,
    balootDeclared: boolean,
    producedEvents: MatchProtocolEvent[],
  ): void {
    const round = this.matchState.round;
    if (!round || round.phase !== "PLAYING" || !round.game) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        "Cannot play card: round is not in PLAYING phase",
      );
    }

    const game = round.game;
    if (game.currentPlayerId !== playerId) {
      throw new ServerBoundaryError(
        ServerErrorCode.NOT_YOUR_TURN,
        `Not ${playerId}'s turn (expected ${game.currentPlayerId})`,
      );
    }

    let activeRound = round;

    // Handle Baloot declaration if flagged with the card play
    if (balootDeclared && activeRound.baloot === null) {
      const card = game.hands[playerId]?.find((c) => c.id === cardId);
      if (card) {
        const alreadyPlayed = [
          ...game.completedTricks.flatMap((t) => t.plays),
          ...game.currentTrick,
        ]
          .filter((p) => p.playerId === playerId)
          .map((p) => p.card);

        const baloot = createBalootDeclaration(
          round.roundId,
          playerSeat,
          game.contract,
          game.trumpSuit,
          card,
          alreadyPlayed,
        );

        if (baloot) {
          activeRound = withRoundBaloot(activeRound, baloot);
          producedEvents.push({
            type: "BALOOT",
            roundId: round.roundId,
            playerId,
            cardId,
            trumpSuit: baloot.trumpSuit,
          });
        }
      }
    }

    if (!isCardLegal(game, playerId, cardId)) {
      throw new ServerBoundaryError(
        ServerErrorCode.ILLEGAL_ACTION,
        `Card ${cardId} is illegal to play under game-engine rules`,
      );
    }

    const nextGame = applyCardPlay(game, playerId, cardId, ikaDeclared);

    producedEvents.push({
      type: "PLAY_CARD",
      roundId: round.roundId,
      playerId,
      cardId,
      ikaDeclared,
      balootDeclared: activeRound.baloot !== null,
    });

    let nextRound: RoundState = {
      ...activeRound,
      game: nextGame,
    };

    // Check if trick completed
    if (nextGame.completedTricks.length > game.completedTricks.length) {
      const completedTrick = nextGame.completedTricks[nextGame.completedTricks.length - 1]!;
      producedEvents.push({
        type: "TRICK_COMPLETE",
        roundId: round.roundId,
        trickNumber: completedTrick.trickNumber,
        winnerSeat: completedTrick.winnerSeat,
      });
    }

    // Check if round completed (8 tricks)
    if (nextGame.phase === "ROUND_COMPLETE") {
      const roundScoreBreakdown = scoreCompletedRound(nextRound);

      nextRound = completeRoundState(nextRound, roundScoreBreakdown);
      const nextMatchState = completeMatchRound(
        this.matchState,
        roundScoreBreakdown,
        nextRound,
      );

      producedEvents.push({
        type: "ROUND_COMPLETE",
        roundId: round.roundId,
        score: nextMatchState.score,
        matchEnd: nextMatchState.end,
      });

      if (
        nextMatchState.phase === "MATCH_COMPLETE" &&
        nextMatchState.end.status === "FINISHED"
      ) {
        producedEvents.push({
          type: "MATCH_COMPLETE",
          score: nextMatchState.score,
          winnerTeamId: nextMatchState.end.winnerTeamId,
        });
      }

      this.matchState = nextMatchState;
      return;
    }

    this.matchState = {
      ...this.matchState,
      round: nextRound,
    };
  }

  private executeAdvanceRoundCommand(
    producedEvents: MatchProtocolEvent[],
  ): void {
    if (this.matchState.phase === "MATCH_COMPLETE") {
      throw new ServerBoundaryError(
        ServerErrorCode.MATCH_FINISHED,
        "Cannot advance round: match is already complete",
      );
    }

    if (this.matchState.phase !== "ROUND_COMPLETE") {
      throw new ServerBoundaryError(
        ServerErrorCode.ROUND_NOT_FINISHED,
        "Cannot advance round before current round is complete",
      );
    }

    const nextRoundNumber = this.matchState.roundNumber + 1;
    const nextDealerSeat = rotateDealer(this.matchState.dealerSeat);
    const newRoundId = `${this.matchId}:round:${nextRoundNumber}`;

    const random = createSeededRandom(`${this.randomSeed}:${nextRoundNumber}`);
    const nextDeal = createInitialDeal(newRoundId, nextDealerSeat, random);
    const nextBidding = createBiddingState(newRoundId, nextDealerSeat);
    const nextRoundState = createRoundState(nextDeal, nextBidding, nextRoundNumber);

    this.matchState = startNextRound(this.matchState, nextRoundState);

    producedEvents.push({
      type: "NEXT_ROUND",
      roundId: newRoundId,
      nextRoundNumber,
      dealerSeat: nextDealerSeat,
    });

    producedEvents.push({
      type: "DEAL",
      roundId: newRoundId,
      roundNumber: nextRoundNumber,
      dealerSeat: nextDealerSeat,
    });
  }
}

export function createAuthoritativeMatchHost(
  config: MatchHostConfig,
): AuthoritativeMatchHost {
  return new AuthoritativeMatchHostImpl(config);
}
