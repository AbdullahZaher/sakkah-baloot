import type { AIRoundObservation, AIAction } from "./index.js";
import { chooseBaselineAction, type BaselinePolicyConfig } from "./baseline-policy.js";
import { chooseISMCTSCard, type ISMCTSConfig } from "./is-mcts.js";
import { createBeliefState } from "./belief-state.js";

export type AIControllerMode = "BASELINE" | "IS_MCTS";

export interface AIControllerConfig {
  readonly mode: AIControllerMode;
  readonly baseline?: BaselinePolicyConfig;
  readonly mcts?: ISMCTSConfig;
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
