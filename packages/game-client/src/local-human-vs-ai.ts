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
  detectProjects,
  declareProject,
  getLegalMoves,
  legalBiddingActions,
  nextCounterClockwise,
  resolveProjects,
  scoreRound,
  teamOfSeat,
  withRoundBaloot,
  withRoundGame,
  withRoundProjects,
  canDeclareBaloot,
  declareBaloot,
  type BiddingAction,
  type BiddingHands,
  type Card,
  type CardId,
  type GameState,
  type MatchEndResult,
  type MatchScore,
  type MatchState,
  type PlayerId,
  type ProjectDeclaration,
  type RoundScoreBreakdown,
  type Seat,
  type Suit,
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
  SOUTH: "SOUTH",
  WEST_PLAYER: "WEST",
};

export interface LocalPlayablePreview {
  readonly dealerSeat: Seat;
  readonly roundNumber: number;
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
  readonly baloot: NonNullable<MatchState["round"]>["baloot"];
  readonly protocol: MatchProtocolState;
  readonly lastProtocolEvent: MatchProtocolEvent["type"] | null;
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
  readonly advanceRound: () => LocalPlayablePreview;
}

export interface LocalPlayableConfig {
  readonly seed?: string;
  readonly humanSeat?: Seat;
  readonly aiMode?: AIControllerMode;
  readonly aiDifficulty?: AIDifficulty;
  readonly mctsIterations?: number;
}

const CARD_MAP: Readonly<Record<CardId, Card>> = Object.fromEntries(
  createDeck().map((card) => [card.id, card]),
) as Readonly<Record<CardId, Card>>;

function createDeck(): readonly Card[] {
  return (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).flatMap((suit) =>
    (["7", "8", "9", "10", "J", "Q", "K", "A"] as const).map((rank) => ({
      id: `${suit}-${rank}`,
      suit,
      rank,
    })),
  );
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
      round.deal.hands[seat].map((id) => CARD_MAP[id]!),
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

function buyerOriginallyHeldAce(round: NonNullable<MatchState["round"]>): boolean {
  const selected = round.bidding.selectedContract;
  return selected !== null &&
    round.deal.transcript.initialHands[selected.purchaserSeat].some((id) =>
      id.endsWith("-A"),
    );
}

function calculateRoundScore(
  round: NonNullable<MatchState["round"]>,
): RoundScoreBreakdown {
  if (!round.game || round.game.phase !== "ROUND_COMPLETE") {
    throw new Error("Round is not ready for scoring");
  }

  const selected = round.bidding.selectedContract;
  if (!selected) throw new Error("Cannot score without a contract");

  const projects = resolveProjects(round.projects, round.dealerSeat);
  const balootAbsorbed = round.baloot !== null &&
    projects.awardedProjectIds.some((id) => {
      const declaration = round.projects.find((item) => item.candidate.id === id);
      return declaration?.candidate.type === "HUNDRED" &&
        round.baloot!.cards.every((cardId) =>
          declaration.candidate.cards.includes(cardId),
        );
    });

  const balootQaid = round.baloot && !balootAbsorbed
    ? {
        NORTH_SOUTH: round.baloot.teamId === "NORTH_SOUTH" ? 2 : 0,
        EAST_WEST: round.baloot.teamId === "EAST_WEST" ? 2 : 0,
      }
    : { NORTH_SOUTH: 0, EAST_WEST: 0 };

  return scoreRound({
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    purchaserSeat: selected.purchaserSeat,
    dealerSeat: round.dealerSeat,
    buyerOriginallyHeldAce: buyerOriginallyHeldAce(round),
    escalation: "NORMAL",
    tricks: round.game.completedTricks,
    projectRaw: projects.projectRaw,
    projectQaid: projects.projectQaid,
    balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootQaid,
  });
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
  const seed = config.seed ?? "sakkah-local";
  const humanSeat = config.humanSeat ?? "SOUTH";
  const aiMode = config.aiMode ?? "BASELINE";
  const aiDifficulty = config.aiDifficulty ?? "NORMAL";
  const mctsIterations = config.mctsIterations ?? 32;

  const matchId = `${seed}:match`;
  let match = createMatchState(
    matchId,
    "NORTH",
    1,
    createRound(matchId, 1, "NORTH", seed),
  );
  let protocol = initialProtocol(match);
  let lastProtocolEvent: MatchProtocolEvent["type"] | null = null;

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
      : round.deal.hands[humanSeat].map((id) => CARD_MAP[id]!);

    const exposedCard = round.deal.exposedCardId === null
      ? null
      : CARD_MAP[round.deal.exposedCardId] ?? null;

    const legalActions = round.phase === "BIDDING"
      ? legalBiddingActions(
          round.bidding,
          round.dealerSeat,
          exposedCard?.suit ?? null,
          round.deal.hands,
        )
      : [];

    const actingSeat = round.game
      ? seatForPlayer(round.game.currentPlayerId)
      : round.bidding.actingSeat;

    const legalCardIds = round.game?.phase === "PLAYING" &&
      round.game.currentPlayerId === humanPlayerId
      ? getLegalMoves(round.game, humanPlayerId).map((move) => move.cardId)
      : [];

    return {
      dealerSeat: match.dealerSeat,
      roundNumber: match.roundNumber,
      playerSeat: humanSeat,
      playerHand: hand,
      exposedCard,
      bidding: round.bidding,
      game: round.game,
      legalActions,
      legalCardIds,
      actingSeat,
      humanTurn: actingSeat === humanSeat,
      roundScore: round.score,
      matchScore: match.score,
      matchEnd: match.end,
      projects: round.projects,
      baloot: round.baloot,
      protocol,
      lastProtocolEvent,
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

    if (authoritative.state.phase === "CONTRACT_SELECTED") {
      const deal = completeDeal(
        round.deal,
        authoritative.state.selectedContract!.exposedCardReceiverSeat,
      );
      nextRound = { ...nextRound, deal };
      nextRound = withRoundGame(nextRound, buildGame(nextRound));
    }

    match = { ...match, round: nextRound };
    protocol = applyProtocol(protocol, event);
    lastProtocolEvent = event.type;
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
  }

  function commitCard(
    playerId: PlayerId,
    cardId: CardId,
    ikaDeclared = false,
    balootDeclared = false,
  ): void {
    const round = match.round;
    if (!round?.game) throw new Error("Playing round is required");

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
    protocol = applyProtocol(protocol, event);
    lastProtocolEvent = event.type;

    if (authoritative.state.phase === "ROUND_COMPLETE") {
      const score = calculateRoundScore(nextRound);
      const completedRound = completeRoundState(nextRound, score);
      const completedMatch = completeMatchRound(match, score, completedRound);

      const roundCompleteEvent: MatchProtocolEvent = {
        type: "ROUND_COMPLETE",
        roundId: round.roundId,
        score: completedMatch.score,
        matchEnd: completedMatch.end,
      };

      applyAuthoritativeRoundComplete(
        match,
        completedRound,
        score,
        roundCompleteEvent,
      );

      match = completedMatch;
      protocol = applyProtocol(protocol, roundCompleteEvent);
      lastProtocolEvent = roundCompleteEvent.type;
    }
  }

  function runAI(): void {
    let guard = 0;

    while (guard++ < 256) {
      const round = match.round;
      if (!round || match.end.status === "FINISHED") return;

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
        }
      }

      if (round.game && action.type === "PLAY_CARD") {
        commitCard(
          playerId,
          action.cardId,
          action.ikaDeclared ?? false,
          action.balootDeclared ?? false,
        );
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
      round.deal.exposedCardId === null
        ? null
        : CARD_MAP[round.deal.exposedCardId]!.suit,
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

    commitCard(playerId, cardId, ikaDeclared, false);
    runAI();
    return snapshot();
  }

  function advanceRound(): LocalPlayablePreview {
    if (match.phase !== "ROUND_COMPLETE") {
      throw new Error("Round is not complete");
    }
    if (match.end.status === "FINISHED") return snapshot();

    const nextRoundNumber = match.roundNumber + 1;
    const nextDealer = nextCounterClockwise(match.dealerSeat);
    const nextRound = createRound(matchId, nextRoundNumber, nextDealer, seed);

    const event: MatchProtocolEvent = {
      type: "NEXT_ROUND",
      roundId: nextRound.roundId,
      nextRoundNumber,
      dealerSeat: nextDealer,
    };

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
    advanceRound,
  };
}

function createRound(
  matchId: string,
  roundNumber: number,
  dealerSeat: Seat,
  seed: string,
) {
  const roundId = `${matchId}:round:${roundNumber}`;
  const deal = createInitialDeal(
    roundId,
    dealerSeat,
    createSeededRandom(`${seed}:round:${roundNumber}`),
  );
  return createRoundState(
    deal,
    createBiddingState(roundId, dealerSeat),
    roundNumber,
  );
}
