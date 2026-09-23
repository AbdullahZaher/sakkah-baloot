import type {
  BalootDeclaration,
  BiddingAction,
  BiddingState,
  Card,
  CardId,
  Contract,
  GameState,
  MatchScore,
  MatchState,
  PlayerId,
  ProjectDeclaration,
  ProjectType,
  Seat,
  Suit,
  TeamId,
} from "@sakkah-baloot/game-engine";

export type AIObservationPhase = "BIDDING" | "PLAYING" | "ROUND_COMPLETE" | "MATCH_COMPLETE";

export interface AIBiddingObservation {
  readonly phase: "BIDDING";
  readonly bidding: BiddingState;
  readonly ownHand: readonly Card[];
  readonly exposedCard: Card | null;
  readonly legalActions: readonly BiddingAction["type"][];
}

export interface AIPlayingObservation {
  readonly phase: "PLAYING";
  readonly game: Omit<GameState, "hands"> & {
    readonly ownHand: readonly Card[];
    readonly knownPlayedCards: readonly Card[];
    readonly legalCardIds: readonly CardId[];
  };
  readonly contract: Contract;
  readonly trumpSuit: Suit | null;
}

export interface AIRoundObservation {
  readonly matchId: string;
  readonly roundId: string;
  readonly roundNumber: number;
  readonly playerId: PlayerId;
  readonly seat: Seat;
  readonly teamId: TeamId;
  readonly phase: AIObservationPhase;
  readonly score: MatchScore;
  readonly bidding: AIBiddingObservation | null;
  readonly playing: AIPlayingObservation | null;
  readonly projects: readonly ProjectDeclaration[];
  readonly baloot: BalootDeclaration | null;
  readonly stateVersion: number;
}

export type AIAction =
  | { readonly type: "BID"; readonly action: BiddingAction }
  | { readonly type: "PLAY_CARD"; readonly cardId: CardId; readonly ikaDeclared?: boolean }
  | { readonly type: "DECLARE_PROJECT"; readonly projectType: ProjectType; readonly declarationId: string }
  | { readonly type: "DECLARE_BALOOT"; readonly declarationId: string };

export interface AIDecisionContext {
  readonly observation: AIRoundObservation;
  readonly randomSeed: string;
}

export interface AIDecisionTrace {
  readonly selectedAction: AIAction;
  readonly candidates: readonly {
    readonly action: AIAction;
    readonly heuristicScore: number;
    readonly searchValue?: number;
    readonly simulations?: number;
  }[];
  readonly reasonCodes: readonly string[];
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(
    ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"].flatMap((suit) =>
      ["7", "8", "9", "10", "J", "Q", "K", "A"].map((rank) => {
        const id = `${suit}-${rank}` as CardId;
        return [id, { id, suit, rank }] as const;
      }),
    ),
  ) as Readonly<Record<CardId, Card>>;
}

const CARDS = cardMap();

function cardsFromIds(ids: readonly CardId[]): readonly Card[] {
  return ids.map((id) => {
    const card = CARDS[id];
    if (!card) throw new Error(`Unknown card: ${id}`);
    return card;
  });
}

function teamForSeat(seat: Seat): TeamId {
  return seat === "NORTH" || seat === "SOUTH" ? "NORTH_SOUTH" : "EAST_WEST";
}

export interface AIObservationInput {
  readonly match: MatchState;
  readonly playerId: PlayerId;
  readonly playerSeat: Seat;
  readonly legalBiddingActions?: readonly BiddingAction["type"][];
  readonly legalCardIds?: readonly CardId[];
}

export function createAIObservation(input: AIObservationInput): AIRoundObservation {
  const { match, playerId, playerSeat } = input;
  const round = match.round;
  if (!round) throw new Error("Match has no active round");

  if (round.phase === "BIDDING") {
    return {
      matchId: match.matchId,
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      playerId,
      seat: playerSeat,
      teamId: teamForSeat(playerSeat),
      phase: "BIDDING",
      score: match.score,
      bidding: {
        phase: "BIDDING",
        bidding: round.bidding,
        ownHand: cardsFromIds(round.deal.hands[playerSeat] ?? []),
        exposedCard: round.deal.exposedCardId ? CARDS[round.deal.exposedCardId] ?? null : null,
        legalActions: input.legalBiddingActions ?? [],
      },
      playing: null,
      projects: round.projects,
      baloot: round.baloot,
      stateVersion: match.stateVersion,
    };
  }

  if (!round.game) throw new Error("Match round has no game state");

  const game = round.game;
  if (game.players[playerId] !== playerSeat) {
    throw new Error("Player-to-seat mapping does not match game state");
  }

  const ownHand = game.hands[playerId] ?? [];
  const knownPlayedCards = [
    ...game.completedTricks.flatMap((trick) => trick.plays.map((play) => play.card)),
    ...game.currentTrick.map((play) => play.card),
  ];

  const { hands: _hiddenHands, ...gameWithoutHands } = game;
  void _hiddenHands;

  const publicGame: Omit<GameState, "hands"> & {
    readonly ownHand: readonly Card[];
    readonly knownPlayedCards: readonly Card[];
    readonly legalCardIds: readonly CardId[];
  } = {
    ...gameWithoutHands,
    ownHand,
    knownPlayedCards,
    legalCardIds: input.legalCardIds ?? [],
  };

  return {
    matchId: match.matchId,
    roundId: round.roundId,
    roundNumber: round.roundNumber,
    playerId,
    seat: playerSeat,
    teamId: teamForSeat(playerSeat),
    phase: round.phase === "ROUND_COMPLETE"
      ? "ROUND_COMPLETE"
      : match.phase === "MATCH_COMPLETE"
        ? "MATCH_COMPLETE"
        : "PLAYING",
    score: match.score,
    bidding: null,
    playing: round.phase === "ROUND_COMPLETE" ? null : {
      phase: "PLAYING",
      game: publicGame,
      contract: game.contract,
      trumpSuit: game.trumpSuit,
    },
    projects: round.projects,
    baloot: round.baloot,
    stateVersion: match.stateVersion,
  };
}

export function legalCardActions(observation: AIRoundObservation): readonly AIAction[] {
  const ids = observation.playing?.game.legalCardIds ?? [];
  return ids.map((cardId) => ({ type: "PLAY_CARD", cardId }));
}

export { createAuthoritativeActionSpace } from "./authoritative-action-space.js";
export type { AuthoritativeActionSpace } from "./authoritative-action-space.js";
export {
  createCardMemory,
  highImpactCards,
  cardStrategicValue,
} from "./card-memory.js";
export type { CardMemory, CardMemoryInput } from "./card-memory.js";
export { extractStrategyFeatures } from "./strategy-features.js";
export type { StrategyFeatures } from "./strategy-features.js";
export { chooseBaselineAction } from "./baseline-policy.js";
export type { BaselineDecision, BaselinePolicyConfig } from "./baseline-policy.js";

export { createImmutableSimulation, cloneGameState } from "./immutable-simulation.js";
export type { ImmutableSimulation, SimulationAction, SimulationState } from "./immutable-simulation.js";

export { createSeededRng, sampleHiddenWorld } from "./information-set-sampler.js";
export type { HiddenWorld, InformationSetInput, SeededRng } from "./information-set-sampler.js";

export { createBeliefState, sampleBeliefWorlds } from "./belief-state.js";
export type { BeliefState, BeliefObservation, BeliefWorldSample } from "./belief-state.js";
export { chooseISMCTSCard } from "./is-mcts.js";
export type { ISMCTSConfig, ISMCTSDecision } from "./is-mcts.js";
