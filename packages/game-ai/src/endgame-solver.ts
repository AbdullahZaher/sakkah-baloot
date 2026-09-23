import {
  applyCardPlay,
  cardRawValue,
  getLegalMoves,
  teamOfSeat,
  type CardId,
  type GameState,
  type PlayerId,
} from "@sakkah-baloot/game-engine";

export interface EndgameSolverConfig {
  readonly maxRemainingCards: number;
  readonly maxNodes: number;
}

export interface EndgameDecision {
  readonly cardId: CardId;
  readonly value: number;
  readonly nodes: number;
  readonly exact: boolean;
}

interface SearchContext {
  readonly rootTeam: ReturnType<typeof teamOfSeat>;
  readonly config: EndgameSolverConfig;
  nodes: number;
  readonly memo: Map<string, number>;
}

export function solveEndgame(
  state: GameState,
  rootPlayerId: PlayerId,
  config: EndgameSolverConfig,
): EndgameDecision | null {
  const legal = getLegalMoves(state, state.currentPlayerId);
  if (legal.length === 0) return null;

  const remainingCards = Object.values(state.hands).reduce((sum, hand) => sum + hand.length, 0)
    + state.currentTrick.length;
  if (remainingCards > config.maxRemainingCards) return null;

  const context: SearchContext = {
    rootTeam: teamOfSeat(state.players[rootPlayerId]!),
    config,
    nodes: 0,
    memo: new Map(),
  };

  let bestCard = legal[0]!.cardId;
  let bestValue = Number.NEGATIVE_INFINITY;
  let exact = true;

  for (const move of legal) {
    if (context.nodes >= config.maxNodes) {
      exact = false;
      break;
    }

    const next = applyCardPlay(state, state.currentPlayerId, move.cardId);
    const value = minimax(next, context);
    if (value > bestValue || (value === bestValue && move.cardId.localeCompare(bestCard) < 0)) {
      bestValue = value;
      bestCard = move.cardId;
    }
  }

  return {
    cardId: bestCard,
    value: bestValue,
    nodes: context.nodes,
    exact,
  };
}

function minimax(state: GameState, context: SearchContext): number {
  if (context.nodes >= context.config.maxNodes) {
    return heuristicValue(state, context.rootTeam);
  }

  const key = stateKey(state);
  const cached = context.memo.get(key);
  if (cached !== undefined) return cached;

  context.nodes += 1;

  if (state.phase !== "PLAYING") {
    const value = completedValue(state, context.rootTeam);
    context.memo.set(key, value);
    return value;
  }

  const legal = getLegalMoves(state, state.currentPlayerId);
  if (legal.length === 0) {
    const value = completedValue(state, context.rootTeam);
    context.memo.set(key, value);
    return value;
  }

  const maximizing = teamOfSeat(state.players[state.currentPlayerId]!) === context.rootTeam;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of legal) {
    if (context.nodes >= context.config.maxNodes) break;
    const next = applyCardPlay(state, state.currentPlayerId, move.cardId);
    const value = minimax(next, context);
    best = maximizing ? Math.max(best, value) : Math.min(best, value);
  }

  if (best === Number.NEGATIVE_INFINITY || best === Number.POSITIVE_INFINITY) {
    best = heuristicValue(state, context.rootTeam);
  }

  context.memo.set(key, best);
  return best;
}

function completedValue(
  state: GameState,
  rootTeam: ReturnType<typeof teamOfSeat>,
): number {
  return state.completedTricks.reduce((score, trick) => {
    const points = trick.plays.reduce(
      (sum, play) => sum + cardRawValue(play.card, state.contract, state.trumpSuit),
      0,
    );
    return score + (teamOfSeat(trick.winnerSeat) === rootTeam ? points : -points);
  }, 0);
}

function heuristicValue(
  state: GameState,
  rootTeam: ReturnType<typeof teamOfSeat>,
): number {
  return completedValue(state, rootTeam) +
    state.currentTrick.reduce((score, play) => {
      const value = cardRawValue(play.card, state.contract, state.trumpSuit);
      return score + value;
    }, 0) * 0.25;
}

function stateKey(state: GameState): string {
  const hands = Object.entries(state.hands)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([playerId, hand]) => `${playerId}:${hand.map((card) => card.id).sort().join(",")}`)
    .join("|");

  return [
    state.currentPlayerId,
    state.trickNumber,
    hands,
    state.currentTrick.map((play) => `${play.playerId}:${play.card.id}`).join(","),
    state.completedTricks.map((trick) => `${trick.winnerSeat}:${trick.plays.map((play) => play.card.id).join(",")}`).join("|"),
  ].join(";");
}
