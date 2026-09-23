import type { MatchState, PlayerId, Seat } from "@sakkah-baloot/game-engine";
import { chooseAuthoritativeAIAction, type AIControllerConfig as MatchAIControllerConfig, type AIControllerDecision as MatchAIControllerDecision } from "./ai-match-controller.js";

export type AIControllerMode = "BASELINE" | "IS_MCTS";

export interface AIControllerConfig {
  readonly mode: AIControllerMode;
  readonly baseline?: {
    readonly difficulty?: "EASY" | "NORMAL" | "HARD";
  };
  readonly mcts?: {
    readonly iterations: number;
    readonly seed: string;
  };
  readonly seed: string;
}

export interface AIControllerDecision {
  readonly action: MatchAIControllerDecision["action"];
  readonly mode: AIControllerMode;
}

export function decideAIAction(
  match: MatchState,
  playerId: PlayerId,
  playerSeat: Seat,
  config: AIControllerConfig,
): AIControllerDecision {
  const result = chooseAuthoritativeAIAction(match, playerId, playerSeat, {
    mode: config.mode,
    seed: config.seed,
    difficulty: config.baseline?.difficulty,
    mctsIterations: config.mcts?.iterations,
  });

  return { action: result.action, mode: config.mode };
}
