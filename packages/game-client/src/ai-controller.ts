import type { MatchState, PlayerId, Seat } from "@sakkah-baloot/game-engine";
import {
  chooseAuthoritativeAIAction,
  type AIControllerConfig,
  type AIControllerDecision,
} from "@sakkah-baloot/game-ai";

export interface AIClientActionEnvelope {
  readonly matchId: string;
  readonly playerId: PlayerId;
  readonly expectedStateVersion: number;
  readonly actionId: string;
  readonly action: AIControllerDecision["action"];
}

export function createAIClientAction(
  match: MatchState,
  playerId: PlayerId,
  playerSeat: Seat,
  config: AIControllerConfig,
): AIClientActionEnvelope {
  const decision = chooseAuthoritativeAIAction(match, playerId, playerSeat, config);

  return {
    matchId: match.matchId,
    playerId,
    expectedStateVersion: match.stateVersion,
    actionId:
      "ai:" +
      match.matchId +
      ":v" +
      match.stateVersion +
      ":" +
      playerId +
      ":" +
      config.seed,
    action: decision.action,
  };
}
