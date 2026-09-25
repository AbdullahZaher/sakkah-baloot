import {
  applyBiddingAction,
  applyCardPlay,
  completeDeal,
  createBiddingState,
  createInitialDeal,
  createMatchState,
  createRoundState,
  completeMatchRound,
  completeRoundState,
  createSeededRandom,
  createFreshRandom,
  type RandomSource,
  getCardById,
  detectProjects,
  declareProject,
  getLegalMoves,
  legalBiddingActions,
  nextCounterClockwise,
  scoreCompletedRound,
  startNextRound,
  teamOfSeat,
  withRoundBaloot,
  withRoundGame,
  withRoundProjects,
  canDeclareBaloot,
  type BiddingAction,
  type BiddingHands,
  type Card,
  type CardId,
  type CompletedTrick,
  type GameState,
  type MatchEndResult,
  type MatchScore,
  type MatchState,
  type PlayerId,
  type ProjectDeclaration,
  type RoundScoreBreakdown,
  type Seat,
  type Suit,
  type Rank,
} from "@sakkah-baloot/game-engine";
import {
  applyAuthoritativeBid,
  applyAuthoritativePlayCard,
  applyAuthoritativeProject,
  applyAuthoritativeRoundComplete,
  applyProtocolEvent,
  deterministicEventId,
  type MatchProtocolEvent,
  type MatchProtocolState,
} from "@sakkah-baloot/game-protocol";
import {
  chooseAuthoritativeAIAction,
  type AIDifficulty,
  type AIAction,
  type AIControllerMode,
} from "@sakkah-baloot/game-ai";
import { createAIObservation } from "@sakkah-baloot/game-ai";

const PLAYER_BY_SEAT: Readonly<Record<Seat, PlayerId>> = {
  NORTH: "NORTH_PLAYER",
  EAST: "EAST_PLAYER",
  SOUTH: "HUMAN_PLAYER",
  WEST: "WEST_PLAYER",
};

const PLAYERS: Readonly<Record<PlayerId, Seat>> = {
  NORTH_PLAYER: "NORTH",
  EAST_PLAYER: "EAST",
  HUMAN_PLAYER: "SOUTH",
  WEST_PLAYER: "WEST",
};

export interface LocalPlayablePreview {
  readonly dealerSeat: Seat;
  readonly roundNumber: number;
  readonly matchPhase: MatchState["phase"];
  readonly playerSeat: Seat;
  readonly playerHand: readonly Card[];
  readonly exposedCard: Card | null;
  readonly bidding: NonNullable<MatchState["round"]>["bidding"];
  readonly game: GameState | null;
  readonly legalActions: readonly BiddingAction["type"][];
  readonly legalCardIds: readonly CardId[];
  readonly actingSeat: Seat;
  readonly humanTurn: boolean;
  readonly roundScore: RoundScoreBreakdown | null;
  readonly matchScore: MatchScore;
  readonly matchEnd: MatchEndResult;
  readonly projects: readonly ProjectDeclaration[];
  readonly projectCandidates: readonly import("@sakkah-baloot/game-engine").ProjectCandidate[];
  readonly baloot: NonNullable<MatchState["round"]>["baloot"];
  readonly protocol: MatchProtocolState;
  readonly lastProtocolEvent: MatchProtocolEvent["type"] | null;
  readonly completedTrickPresentation: CompletedTrick | null;
  readonly actionFeedback: string | null;
}

export interface LocalPlayableSession {
  readonly getSnapshot: () => LocalPlayablePreview;
  readonly dispatchBiddingAction: (
    type: BiddingAction["type"],
    suit?: Suit,
  ) => LocalPlayablePreview;
  readonly dispatchCardPlay: (
    cardId: CardId,
    ikaDeclared?: boolean,
  ) => LocalPlayablePreview;
  readonly dispatchProject: (projectId: string) => LocalPlayablePreview;
  readonly advanceRound: () => LocalPlayablePreview;
  readonly acknowledgeCompletedTrick: () => LocalPlayablePreview;
}

export interface LocalPlayableConfig {
  /** Explicit seed string. When omitted, a fresh random deal is generated for each session.
   *  Pass a fixed string in tests/simulator to ensure deterministic, reproducible deals. */
  readonly seed?: string;
  readonly humanSeat?: Seat;
  readonly aiMode?: AIControllerMode;
  readonly aiDifficulty?: AIDifficulty;
  readonly mctsIterations?: number;
}

function playerIdForSeat(seat: Seat): PlayerId {
  return PLAYER_BY_SEAT[seat];
}

function seatForPlayer(playerId: PlayerId): Seat {
  return PLAYERS[playerId]!;
}

function buildGame(round: NonNullable<MatchState["round"]>): GameState {
  const selected = round.bidding.selectedContract;
  if (!selected) throw new Error("Contract must be selected before playing");

  const hands = Object.fromEntries(
    (Object.keys(PLAYER_BY_SEAT) as Seat[]).map((seat) => [
      playerIdForSeat(seat),
      round.deal.hands[seat].map((id) => getCardById(id)),
    ]),
  ) as Record<PlayerId, readonly Card[]>;

  return {
    phase: "PLAYING",
    currentPlayerId: playerIdForSeat(nextCounterClockwise(round.dealerSeat)),
    players: PLAYERS,
    hands,
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    hokumPlayMode: "OPEN",
    dealerSeat: round.dealerSeat,
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };
}

export function shouldDeclareBalootForCard(
  game: GameState,
  playerId: PlayerId,
  cardId: CardId,
): boolean {
  const card = game.hands[playerId]?.find((candidate) => candidate.id === cardId);
  if (!card) return false;
  const alreadyPlayedByPlayer = [
    ...game.completedTricks.flatMap((trick) => trick.plays),
    ...game.currentTrick,
  ]
    .filter((play) => play.playerId === playerId)
    .map((play) => play.card);

  return canDeclareBaloot(
    game.contract,
    game.trumpSuit,
    game.players[playerId]!,
    card,
    alreadyPlayedByPlayer,
    true,
  );
}

function calculateRoundScore(
  round: NonNullable<MatchState["round"]>,
): RoundScoreBreakdown {
  return scoreCompletedRound(round, "NORMAL");
}

function initialProtocol(match: MatchState): MatchProtocolState {
  return {
    matchId: match.matchId,
    stateVersion: 0,
    roundId: match.roundId,
    roundNumber: match.roundNumber,
    dealerSeat: match.dealerSeat,
    phase: "DEAL",
    score: match.score,
    escalation: "NORMAL",
  };
}

function applyProtocol(
  state: MatchProtocolState,
  event: MatchProtocolEvent,
): MatchProtocolState {
  const nextVersion = state.stateVersion + 1;
  const envelope = {
    matchId: state.matchId,
    eventId: deterministicEventId(state.matchId, nextVersion, event),
    stateVersion: nextVersion,
    event,
  };
  return applyProtocolEvent(state, envelope).state;
}

export function createLocalHumanVsAISession(
  config: LocalPlayableConfig = {},
): LocalPlayableSession {
  // When an explicit seed is provided (tests / simulator), use it for deterministic deals.
  // When no seed is provided (production gameplay), use a fresh random source so every
  // match produces genuinely different cards.
  const seed = config.seed ?? null;
  const freshRandom: RandomSource | null = seed === null ? createFreshRandom() : null;
  const humanSeat = config.humanSeat ?? "SOUTH";
  const aiMode = config.aiMode ?? "BASELINE";
  const aiDifficulty = config.aiDifficulty ?? "NORMAL";
  const mctsIterations = config.mctsIterations ?? 32;

  const matchId = seed !== null ? `${seed}:match` : `fresh:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  let match = createMatchState(
    matchId,
    "NORTH",
    1,
    createRound(matchId, 1, "NORTH", seed, freshRandom),
  );
  let protocol = initialProtocol(match);
  let lastProtocolEvent: MatchProtocolEvent["type"] | null = null;
  let completedTrickPresentation: CompletedTrick | null = null;
  let pendingRoundComplete = false;
  let actionFeedback: string | null = null;

  protocol = applyProtocol(protocol, {
    type: "DEAL",
    roundId: match.roundId,
    roundNumber: match.roundNumber,
    dealerSeat: match.dealerSeat,
  });
  lastProtocolEvent = "DEAL";

  function snapshot(): LocalPlayablePreview {
    const round = match.round;
    if (!round) throw new Error("Match has no active round");

    const humanPlayerId = playerIdForSeat(humanSeat);
    const hand = round.game
      ? round.game.hands[humanPlayerId] ?? []
      : round.deal.hands[humanSeat].map((id) => getCardById(id));

    const exposedCard = round.deal.exposedCardId === null
      ? null
      : getCardById(round.deal.exposedCardId);

    const isTrickPresentationActive = completedTrickPresentation !== null;

    const legalActions = !isTrickPresentationActive && round.phase === "BIDDING"
      ? legalBiddingActions(
          round.bidding,
          round.dealerSeat,
          exposedCard?.suit ?? null,
          round.deal.hands,
        )
      : [];

    const actingSeat = completedTrickPresentation
      ? completedTrickPresentation.winnerSeat
      : round.game
        ? seatForPlayer(round.game.currentPlayerId)
        : round.bidding.actingSeat;

    const humanTurn = !isTrickPresentationActive && actingSeat === humanSeat;

    const legalCardIds = !isTrickPresentationActive &&
      round.game?.phase === "PLAYING" &&
      round.game.currentPlayerId === humanPlayerId
      ? getLegalMoves(round.game, humanPlayerId).map((move) => move.cardId)
      : [];

    const projectCandidates = !isTrickPresentationActive &&
      round.game?.phase === "PLAYING" &&
      round.game.currentPlayerId === humanPlayerId &&
      round.game.trickNumber === 1 &&
      round.game.currentTrick.length === 0 &&
      round.game.completedTricks.length === 0 &&
      round.bidding.selectedContract !== null
      ? detectProjects(
          round.game.hands[humanPlayerId] ?? [],
          round.bidding.selectedContract.contract,
          round.bidding.selectedContract.trumpSuit,
          humanSeat,
        )
      : [];

    return {
      dealerSeat: match.dealerSeat,
      roundNumber: match.roundNumber,
      matchPhase: match.phase,
      playerSeat: humanSeat,
      // sortHandForDisplay produces a sorted copy — presentation only.
      // The authoritative hand array (used for legality/scoring) is never mutated.
      playerHand: sortHandForDisplay(hand),
      exposedCard,
      bidding: round.bidding,
      game: round.game,
      legalActions,
      legalCardIds,
      actingSeat,
      humanTurn,
      roundScore: pendingRoundComplete
        ? null
        : match.lastRoundScore ?? round.score,
      matchScore: match.score,
      matchEnd: match.end,
      projects: round.projects,
      projectCandidates,
      baloot: round.baloot,
      protocol,
      lastProtocolEvent,
      completedTrickPresentation,
      actionFeedback,
    };
  }

  function commitBidding(
    playerId: PlayerId,
    action: BiddingAction,
  ): void {
    const round = match.round;
    if (!round || round.phase !== "BIDDING") {
      throw new Error("Bidding is not active");
    }

    const event: MatchProtocolEvent = {
      type: "BID",
      roundId: round.roundId,
      playerId,
      action,
    };

    const authoritative = applyAuthoritativeBid(
      round.bidding,
      round.deal,
      round.dealerSeat,
      event,
    );

    let nextRound = { ...round, bidding: authoritative.state };
    const followUpEvents: MatchProtocolEvent[] = [];

    if (authoritative.state.phase === "CONTRACT_SELECTED") {
      const deal = completeDeal(
        round.deal,
        authoritative.state.selectedContract!.exposedCardReceiverSeat,
      );
      nextRound = { ...nextRound, deal };
      nextRound = withRoundGame(nextRound, buildGame(nextRound));
      followUpEvents.push({
        type: "DEAL",
        roundId: round.roundId,
        roundNumber: match.roundNumber,
        dealerSeat: round.dealerSeat,
        dealType: "COMPLETION",
      });
    } else if (authoritative.state.phase === "CANCELLED") {
      const nextRoundNumber = match.roundNumber + 1;
      const nextDealer = nextCounterClockwise(round.dealerSeat);
      nextRound = createRound(matchId, nextRoundNumber, nextDealer, seed, freshRandom);
      match = {
        ...match,
        round: nextRound,
        roundId: nextRound.roundId,
        roundNumber: nextRoundNumber,
        dealerSeat: nextDealer,
        phase: "ROUND_ACTIVE",
        stateVersion: match.stateVersion + 1,
        lastRoundScore: null,
        end: { status: "ONGOING", score: match.score },
      };
      followUpEvents.push(
        {
          type: "NEXT_ROUND",
          roundId: nextRound.roundId,
          nextRoundNumber,
          dealerSeat: nextDealer,
        },
        {
          type: "DEAL",
          roundId: nextRound.roundId,
          roundNumber: nextRoundNumber,
          dealerSeat: nextDealer,
          dealType: "REDEAL",
        },
      );
    } else {
      match = { ...match, round: nextRound };
    }

    if (authoritative.state.phase === "CONTRACT_SELECTED") {
      match = { ...match, round: nextRound };
    }

    const events = [event, ...followUpEvents];
    for (const protocolEvent of events) {
      protocol = applyProtocol(protocol, protocolEvent);
      lastProtocolEvent = protocolEvent.type;
    }
    actionFeedback = `${seatForPlayer(playerId)}: ${action.type}`;
  }

  function commitProject(playerId: PlayerId, project: ProjectDeclaration): void {
    const round = match.round;
    if (!round?.game) throw new Error("Playing round is required");

    const event: MatchProtocolEvent = {
      type: "PROJECT",
      roundId: round.roundId,
      playerId,
      project: project.candidate.type,
      suit: null,
    };

    const authoritative = applyAuthoritativeProject(
      round.game,
      project.candidate,
      round.projects,
      event,
    );

    const nextRound = withRoundProjects(
      round,
      [...round.projects, authoritative.project],
    );
    match = { ...match, round: nextRound };
    protocol = applyProtocol(protocol, event);
    lastProtocolEvent = event.type;
    actionFeedback = `${seatForPlayer(playerId)} أعلن مشروعًا`;
  }

  function commitCard(
    playerId: PlayerId,
    cardId: CardId,
    ikaDeclared = false,
    balootDeclared = false,
  ): void {
    const round = match.round;
    if (!round?.game) throw new Error("Playing round is required");

    const prevCompletedCount = round.game.completedTricks.length;

    const event: MatchProtocolEvent = {
      type: "PLAY_CARD",
      roundId: round.roundId,
      playerId,
      cardId,
      ikaDeclared,
      balootDeclared,
    };

    const authoritative = applyAuthoritativePlayCard(
      round.game,
      event,
      round.baloot,
    );

    let nextRound: NonNullable<MatchState["round"]> = { ...round, game: authoritative.state };
    if (authoritative.baloot && round.baloot === null) {
      nextRound = withRoundBaloot(nextRound, authoritative.baloot);
    }

    match = { ...match, round: nextRound };
    if (authoritative.baloot && round.baloot === null) {
      const balootEvent: MatchProtocolEvent = {
        type: "BALOOT",
        roundId: round.roundId,
        playerId,
        cardId,
        trumpSuit: authoritative.baloot.trumpSuit,
      };
      protocol = applyProtocol(protocol, balootEvent);
      lastProtocolEvent = balootEvent.type;
    }

    protocol = applyProtocol(protocol, event);
    lastProtocolEvent = event.type;
    const playedCard = round.game.hands[playerId]?.find((card) => card.id === cardId);
    actionFeedback = playedCard
      ? `${seatForPlayer(playerId)} لعب ${playedCard.rank} ${playedCard.suit}`
      : `${seatForPlayer(playerId)} لعب ورقة`;

    if (authoritative.state.completedTricks.length > prevCompletedCount) {
      const completed = authoritative.state.completedTricks[authoritative.state.completedTricks.length - 1];
      if (!completed) throw new Error("Completed trick result is missing");
      completedTrickPresentation = completed;
      protocol = applyProtocol(protocol, {
        type: "TRICK_COMPLETE",
        roundId: round.roundId,
        trickNumber: completed.trickNumber,
        winnerSeat: completed.winnerSeat,
      });
      lastProtocolEvent = "TRICK_COMPLETE";
      if (authoritative.state.phase === "ROUND_COMPLETE") {
        pendingRoundComplete = true;
      }
    }
  }

  function acknowledgeCompletedTrick(): LocalPlayablePreview {
    if (completedTrickPresentation === null) return snapshot();

    completedTrickPresentation = null;

    if (pendingRoundComplete) {
      pendingRoundComplete = false;
      const round = match.round;
      if (!round) {
        throw new Error("Cannot complete a trick without an active round");
      }
      if (round.game?.phase !== "ROUND_COMPLETE") {
        throw new Error("Final trick presentation ended before the engine marked the round complete");
      }

      const score = calculateRoundScore(round);
      const completedRound = completeRoundState(round, score);
      const completedMatch = completeMatchRound(match, score, completedRound);

      const roundCompleteEvent: MatchProtocolEvent = {
        type: "ROUND_COMPLETE",
        roundId: round.roundId,
        score: completedMatch.score,
        matchEnd: completedMatch.end,
      };

      applyAuthoritativeRoundComplete(
        match,
        round,
        score,
        roundCompleteEvent,
      );

      match = completedMatch;
      protocol = applyProtocol(protocol, roundCompleteEvent);
      lastProtocolEvent = roundCompleteEvent.type;

      if (completedMatch.phase === "MATCH_COMPLETE" && completedMatch.end.status === "FINISHED") {
        const matchCompleteEvent: MatchProtocolEvent = {
          type: "MATCH_COMPLETE",
          score: completedMatch.score,
          winnerTeamId: completedMatch.end.winnerTeamId,
        };
        protocol = applyProtocol(protocol, matchCompleteEvent);
        lastProtocolEvent = matchCompleteEvent.type;
      }
    } else {
      if (
        match.round?.phase === "PLAYING" &&
        match.round.game?.phase === "PLAYING" &&
        match.end.status !== "FINISHED"
      ) {
        runAI();
      }
    }

    return snapshot();
  }

  function runAI(): void {
    let guard = 0;

    while (guard++ < 256) {
      if (completedTrickPresentation !== null) return;
      const round = match.round;
      if (!round || match.end.status === "FINISHED") return;
      if (
        round.phase !== "BIDDING" &&
        !(round.phase === "PLAYING" && round.game?.phase === "PLAYING")
      ) {
        return;
      }

      const actingSeat = round.game
        ? seatForPlayer(round.game.currentPlayerId)
        : round.bidding.actingSeat;

      if (actingSeat === humanSeat) return;

      const playerId = playerIdForSeat(actingSeat);
      const decision = chooseAuthoritativeAIAction(
        match,
        playerId,
        actingSeat,
        {
          mode: aiMode,
          seed: `${seed}:r${match.roundNumber}:p${protocol.stateVersion}`,
          difficulty: aiDifficulty,
          mctsIterations,
        },
      );

      const action = decision.action;
      if (round.phase === "BIDDING" && action.type === "BID") {
        commitBidding(playerId, action.action);
        continue;
      }

      if (round.game && action.type === "DECLARE_PROJECT") {
        const candidates = detectProjects(
          round.game.hands[playerId] ?? [],
          round.game.contract,
          round.game.trumpSuit,
          actingSeat,
        );
        const candidate = candidates.find((item) =>
          `project:${match.roundId}:${playerId}:${item.id}` === action.declarationId,
        );
        if (candidate) {
          try {
            commitProject(
              playerId,
              declareProject(
                candidate,
                action.declarationId,
                "PLAYING",
                1,
                0,
                round.projects,
              ),
            );
            continue;
          } catch {
            const fallback = getLegalMoves(round.game, playerId)[0];
            if (!fallback) throw new Error("AI has no legal fallback card");
            commitCard(playerId, fallback.cardId, false, false);
            if (completedTrickPresentation !== null) return;
            continue;
          }
        }
      }

      if (round.game && action.type === "PLAY_CARD") {
        const selectedCard = round.game.hands[playerId]?.find(
          (card) => card.id === action.cardId,
        );
        const priorPlayed = [
          ...round.game.completedTricks.flatMap((trick) => trick.plays),
          ...round.game.currentTrick,
        ]
          .filter((play) => play.playerId === playerId)
          .map((play) => play.card);

        const actualBaloot =
          action.balootDeclared === true &&
          selectedCard !== undefined &&
          canDeclareBaloot(
            round.game.contract,
            round.game.trumpSuit,
            actingSeat,
            selectedCard,
            priorPlayed,
            true,
          );

        commitCard(
          playerId,
          action.cardId,
          action.ikaDeclared ?? false,
          actualBaloot,
        );
        if (completedTrickPresentation !== null) {
          return;
        }
        continue;
      }

      throw new Error(`AI produced an unsupported action in ${round.phase}`);
    }

    throw new Error("AI turn loop exceeded safety limit");
  }

  function dispatchBiddingAction(
    type: BiddingAction["type"],
    suit?: Suit,
  ): LocalPlayablePreview {
    if (completedTrickPresentation !== null) {
      throw new Error("Cannot bid while completed trick presentation is active");
    }
    const round = match.round;
    if (!round || round.phase !== "BIDDING") {
      throw new Error("Bidding is not active");
    }

    const playerId = playerIdForSeat(humanSeat);
    if (playerIdForSeat(round.bidding.actingSeat) !== playerId) {
      throw new Error("It is not the human player's bidding turn");
    }

    const action: BiddingAction = type === "BUY_HOKUM"
      ? {
          type,
          actionId: `human:${match.roundNumber}:${round.bidding.turnNumber}:${type}`,
          suit: suit ?? "CLUBS",
        }
      : {
          type,
          actionId: `human:${match.roundNumber}:${round.bidding.turnNumber}:${type}`,
        };

    const legal = legalBiddingActions(
      round.bidding,
      round.dealerSeat,
      round.deal.exposedCardId ? getCardById(round.deal.exposedCardId).suit : null,
      round.deal.hands,
    );

    if (!legal.includes(type)) {
      throw new Error(`Illegal bidding action: ${type}`);
    }

    commitBidding(playerId, action);
    runAI();
    return snapshot();
  }

  function dispatchCardPlay(
    cardId: CardId,
    ikaDeclared = false,
  ): LocalPlayablePreview {
    if (completedTrickPresentation !== null) {
      throw new Error("Cannot play card while completed trick presentation is active");
    }
    const round = match.round;
    if (!round?.game) throw new Error("Playing is not active");

    const playerId = playerIdForSeat(humanSeat);
    if (round.game.currentPlayerId !== playerId) {
      throw new Error("It is not the human player's turn");
    }

    const legal = getLegalMoves(round.game, playerId).map((move) => move.cardId);
    if (!legal.includes(cardId)) {
      throw new Error("Card is not legal");
    }

    const balootDeclared = shouldDeclareBalootForCard(
      round.game,
      playerId,
      cardId,
    );

    commitCard(playerId, cardId, ikaDeclared, balootDeclared);
    if (
      completedTrickPresentation === null &&
      match.round?.phase === "PLAYING" &&
      match.round.game?.phase === "PLAYING" &&
      match.end.status !== "FINISHED"
    ) {
      runAI();
    }

    const afterAI = match.round?.game;
    if (
      completedTrickPresentation === null &&
      afterAI?.phase === "PLAYING" &&
      afterAI.currentPlayerId === playerId
    ) {
      const legalAfterAI = getLegalMoves(afterAI, playerId);
      if (legalAfterAI.length === 0) {
        throw new Error(
          `AI dispatch returned control to human with no legal card: ${JSON.stringify({
            currentPlayerId: afterAI.currentPlayerId,
            handLength: afterAI.hands[playerId]?.length ?? 0,
            trickNumber: afterAI.trickNumber,
            currentTrickLength: afterAI.currentTrick.length,
            completedTricks: afterAI.completedTricks.length,
            currentTrickPlayers: afterAI.currentTrick.map((play) => play.playerId),
          })}`,
        );
      }
    }

    return snapshot();
  }

  function dispatchProject(projectId: string): LocalPlayablePreview {
    if (completedTrickPresentation !== null) {
      throw new Error("Cannot declare project while completed trick presentation is active");
    }
    const round = match.round;
    const humanPlayerId = playerIdForSeat(humanSeat);
    if (!round?.game || round.game.phase !== "PLAYING") {
      throw new Error("Projects require an active playing round");
    }
    if (round.game.currentPlayerId !== humanPlayerId) {
      throw new Error("It is not the human player's turn");
    }
    if (round.game.trickNumber !== 1 || round.game.currentTrick.length !== 0) {
      throw new Error("Project declaration window is closed");
    }

    const selected = round.bidding.selectedContract;
    if (!selected) throw new Error("Cannot declare project without a contract");

    const candidate = detectProjects(
      round.game.hands[humanPlayerId] ?? [],
      selected.contract,
      selected.trumpSuit,
      humanSeat,
    ).find((item) => item.id === projectId);
    if (!candidate) throw new Error("Unknown project candidate");

    const declaration = declareProject(
      candidate,
      "project:" + round.roundId + ":" + humanPlayerId + ":" + candidate.id,
      "PLAYING",
      1,
      0,
      round.projects,
    );
    commitProject(humanPlayerId, declaration);
    return snapshot();
  }

  function advanceRound(): LocalPlayablePreview {
    if (match.end.status === "FINISHED") return snapshot();
    if (match.phase !== "ROUND_COMPLETE") {
      throw new Error("Round is not complete");
    }

    const nextRoundNumber = match.roundNumber + 1;
    const nextDealer = nextCounterClockwise(match.dealerSeat);
    const nextRound = createRound(matchId, nextRoundNumber, nextDealer, seed, freshRandom);

    const event: MatchProtocolEvent = {
      type: "NEXT_ROUND",
      roundId: nextRound.roundId,
      nextRoundNumber,
      dealerSeat: nextDealer,
    };

    match = startNextRound(match, nextRound);

    protocol = applyProtocol(protocol, event);
    lastProtocolEvent = event.type;

    const dealEvent: MatchProtocolEvent = {
      type: "DEAL",
      roundId: nextRound.roundId,
      roundNumber: nextRoundNumber,
      dealerSeat: nextDealer,
    };
    protocol = applyProtocol(protocol, dealEvent);
    lastProtocolEvent = dealEvent.type;

    runAI();
    return snapshot();
  }

  runAI();

  return {
    getSnapshot: snapshot,
    dispatchBiddingAction,
    dispatchCardPlay,
    dispatchProject,
    advanceRound,
    acknowledgeCompletedTrick,
  };
}

function createRound(
  matchId: string,
  roundNumber: number,
  dealerSeat: Seat,
  seed: string | null,
  freshRandom: RandomSource | null = null,
) {
  const roundId = `${matchId}:round:${roundNumber}`;
  // Use the pre-created freshRandom source in production (seed === null),
  // or create a deterministic seeded RNG for tests/simulator.
  const rng = seed !== null
    ? createSeededRandom(`${seed}:round:${roundNumber}`)
    : (freshRandom ?? createFreshRandom());
  const deal = createInitialDeal(roundId, dealerSeat, rng);
  return createRoundState(
    deal,
    createBiddingState(roundId, dealerSeat),
    roundNumber,
  );
}

// ── Presentation-only hand sorter ─────────────────────────────────────────────
//
// This function must NEVER be used for game-rule decisions (legality, scoring,
// project/Baloot detection, trick winner). It is purely visual.
//
// Suit order: SPADES → HEARTS → CLUBS → DIAMONDS (♠ ♥ ♣ ♦)
// Rank order within each suit: A → K → Q → J → 10 → 9 → 8 → 7 (high-to-low)

const DISPLAY_SUIT_ORDER: readonly Suit[] = ["SPADES", "HEARTS", "CLUBS", "DIAMONDS"];
const DISPLAY_RANK_ORDER: readonly Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7"];

export function sortHandForDisplay(hand: readonly Card[]): readonly Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = DISPLAY_SUIT_ORDER.indexOf(a.suit) - DISPLAY_SUIT_ORDER.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return DISPLAY_RANK_ORDER.indexOf(a.rank) - DISPLAY_RANK_ORDER.indexOf(b.rank);
  });
}
