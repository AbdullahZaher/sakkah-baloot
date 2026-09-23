import {
  applyCardPlay,
  getLegalMoves,
  type CardId,
  type GameState,
  type PlayerId,
} from "@sakkah-baloot/game-engine";

export interface SimulationPolicyContext {
  readonly state: GameState;
  readonly playerId: PlayerId;
  readonly legalCardIds: readonly CardId[];
  readonly random: () => number;
}

export type CardPolicy = (context: SimulationPolicyContext) => CardId;

export interface RoundSimulationResult {
  readonly initial: GameState;
  readonly final: GameState;
  readonly playedCardIds: readonly CardId[];
  readonly illegalActionCount: number;
}

export interface SimulationBatchResult {
  readonly games: number;
  readonly completed: number;
  readonly illegalActions: number;
  readonly deterministicDigest: string;
}

export interface SimulationConfig {
  readonly seed: string;
  readonly games: number;
  readonly policy: CardPolicy;
}

export function simulateCardPlayRound(
  initial: GameState,
  policy: CardPolicy,
  seed: string,
): RoundSimulationResult {
  let state = cloneGameState(initial);
  const initialSnapshot = cloneGameState(initial);
  const random = createSeededRng(seed);
  const playedCardIds: CardId[] = [];
  let illegalActionCount = 0;

  while (state.phase === "PLAYING") {
    const playerId = state.currentPlayerId;
    const legalCardIds = getLegalMoves(state, playerId).map((move) => move.cardId);
    if (legalCardIds.length === 0) break;

    const selected = policy({
      state,
      playerId,
      legalCardIds,
      random,
    });

    if (!legalCardIds.includes(selected)) {
      illegalActionCount += 1;
      throw new Error(`Policy selected illegal card ${selected} for ${playerId}`);
    }

    state = applyCardPlay(state, playerId, selected);
    playedCardIds.push(selected);
  }

  return {
    initial: initialSnapshot,
    final: state,
    playedCardIds,
    illegalActionCount,
  };
}

export function simulateBatch(
  initialFactory: (index: number) => GameState,
  config: SimulationConfig,
): SimulationBatchResult {
  const games = Math.max(0, Math.floor(config.games));
  let completed = 0;
  let illegalActions = 0;
  const digests: string[] = [];

  for (let i = 0; i < games; i += 1) {
    const result = simulateCardPlayRound(
      initialFactory(i),
      config.policy,
      `${config.seed}:game:${i}`,
    );

    if (result.final.phase === "ROUND_COMPLETE") completed += 1;
    illegalActions += result.illegalActionCount;
    digests.push(result.playedCardIds.join(","));
  }

  return {
    games,
    completed,
    illegalActions,
    deterministicDigest: hashDigest(digests.join("|")),
  };
}

function createSeededRng(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashDigest(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    hands: Object.fromEntries(
      Object.entries(state.hands).map(([playerId, hand]) => [
        playerId,
        hand.map((card) => ({ ...card })),
      ]),
    ),
    currentTrick: state.currentTrick.map((play) => ({
      ...play,
      card: { ...play.card },
    })),
    completedTricks: state.completedTricks.map((trick) => ({
      ...trick,
      plays: trick.plays.map((play) => ({
        ...play,
        card: { ...play.card },
      })),
    })),
  };
}
