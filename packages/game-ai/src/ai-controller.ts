import type { AIRoundObservation, AIAction } from "./index.js";
import { chooseBaselineAction, type BaselinePolicyConfig } from "./baseline-policy.js";
import { chooseISMCTSCard, type ISMCTSConfig } from "./is-mcts.js";
import { solveEndgame, type EndgameSolverConfig } from "./endgame-solver.js";
import { createBeliefState } from "./belief-state.js";

export type AIControllerMode = "BASELINE" | "IS_MCTS" | "ENDGAME_FIRST";

export interface AIControllerConfig {
  readonly mode: AIControllerMode;
  readonly baseline?: BaselinePolicyConfig;
  readonly mcts?: ISMCTSConfig;
  readonly endgame?: EndgameSolverConfig;
  readonly seed: string;
}

export interface AIControllerDecision {
  readonly action: AIAction;
  readonly mode: AIControllerMode;
}

export function decideAIAction(
  observation: AIRoundObservation,
  config: AIControllerConfig,
): AIControllerDecision {
  if (config.mode === "BASELINE") {
    return {
      action: chooseBaselineAction(observation, config.baseline),
      mode: config.mode,
    };
  }

  if (observation.playing) {
    const belief = createBeliefState(
      {
        playerId: observation.playerId,
        ownHand: observation.playing.game.ownHand,
        game: {
          players: observation.playing.game.players,
          currentTrick: observation.playing.game.currentTrick,
          completedTricks: observation.playing.game.completedTricks,
        },
        contract: observation.playing.contract,
        trumpSuit: observation.playing.trumpSuit,
      },
      config.seed,
      { sampleCount: config.mcts?.iterations ?? 32 },
    );

    if (config.mode === "ENDGAME_FIRST" && config.endgame) {
      const exact = solveEndgame(
        {
          phase: "PLAYING",
          currentPlayerId: observation.playing.game.currentPlayerId,
          players: observation.playing.game.players,
          hands: {
            [observation.playerId]: observation.playing.game.ownHand,
          },
          contract: observation.playing.contract,
          trumpSuit: observation.playing.trumpSuit,
          hokumPlayMode: observation.playing.game.hokumPlayMode,
          dealerSeat: observation.playing.game.dealerSeat,
          trickNumber: observation.playing.game.trickNumber,
          currentTrick: observation.playing.game.currentTrick,
          completedTricks: observation.playing.game.completedTricks,
        },
        observation.playerId,
        config.endgame,
      );

      if (exact) {
        return {
          action: { type: "PLAY_CARD", cardId: exact.cardId },
          mode: config.mode,
        };
      }
    }

    const mcts = chooseISMCTSCard(
      observation,
      belief,
      config.mcts ?? { iterations: 64, seed: config.seed },
    );

    return {
      action: { type: "PLAY_CARD", cardId: mcts.cardId },
      mode: config.mode,
    };
  }

  return {
    action: chooseBaselineAction(observation, config.baseline),
    mode: config.mode,
  };
}
