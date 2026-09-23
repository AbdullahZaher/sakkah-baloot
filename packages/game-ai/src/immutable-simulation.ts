import {
  applyCardPlay,
  type GameState,
  type CardId,
  type PlayerId,
} from "@sakkah-baloot/game-engine";

export interface SimulationState {
  readonly game: GameState;
}

export interface SimulationAction {
  readonly playerId: PlayerId;
  readonly cardId: CardId;
  readonly ikaDeclared?: boolean;
}

export interface ImmutableSimulation {
  readonly initial: SimulationState;
  readonly apply: (
    state: SimulationState,
    action: SimulationAction,
  ) => SimulationState;
}

export function createImmutableSimulation(
  initialGame: GameState,
): ImmutableSimulation {
  const initial: SimulationState = { game: cloneGameState(initialGame) };

  return {
    initial,
    apply(state, action) {
      return {
        game: applyCardPlay(
          cloneGameState(state.game),
          action.playerId,
          action.cardId,
          action.ikaDeclared ?? false,
        ),
      };
    },
  };
}

export function cloneGameState(state: GameState): GameState {
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
