import type { MatchState, PlayerId, Seat } from "@sakkah-baloot/game-engine";
import { chooseBaselineAction } from "./baseline-policy.js";
import type { AIRoundObservation } from "./index.js";
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
): AIControllerDecision;
export function decideAIAction(
  observation: AIRoundObservation,
  config: AIControllerConfig,
): AIControllerDecision;
export function decideAIAction(
  matchOrObservation: MatchState | AIRoundObservation,
  playerIdOrConfig: PlayerId | AIControllerConfig,
  playerSeat?: Seat,
  config?: AIControllerConfig,
): AIControllerDecision {
  if (isObservation(matchOrObservation)) {
    const observation = matchOrObservation;
    const controllerConfig = playerIdOrConfig as AIControllerConfig;
    if (controllerConfig.mode !== "BASELINE") {
      throw new Error("Observation-only AI controller supports BASELINE mode; use MatchState for IS_MCTS");
    }
    const decision = chooseBaselineAction(
      observation,
      controllerConfig.baseline?.difficulty === undefined
        ? {}
        : { difficulty: controllerConfig.baseline.difficulty },
    );
    return { action: decision.action, mode: controllerConfig.mode };
  }

  const match = matchOrObservation;
  const playerId = playerIdOrConfig as PlayerId;
  const controllerConfig = config!;
  const result = chooseAuthoritativeAIAction(match, playerId, playerSeat!, {
    mode: controllerConfig.mode,
    seed: controllerConfig.seed,
    ...(controllerConfig.baseline?.difficulty !== undefined ? { difficulty: controllerConfig.baseline.difficulty } : {}),
    ...(controllerConfig.mcts?.iterations !== undefined ? { mctsIterations: controllerConfig.mcts.iterations } : {}),
  });

  return { action: result.action, mode: controllerConfig.mode };
}

function isObservation(value: MatchState | AIRoundObservation): value is AIRoundObservation {
  return "playerId" in value && "roundId" in value && "stateVersion" in value && "score" in value;
}
