import type { ClientActionEnvelope } from "@sakkah-baloot/game-protocol";
import type { AIAction, AIRoundObservation } from "./index.js";

export type AIClientAction =
  | ClientActionEnvelope<{
      readonly type: "BID";
      readonly action: AIAction extends { type: "BID"; action: infer T } ? T : never;
    }>
  | ClientActionEnvelope<{
      readonly type: "PLAY_CARD";
      readonly cardId: string;
      readonly ikaDeclared: boolean;
      readonly balootDeclared: boolean;
    }>
  | ClientActionEnvelope<{
      readonly type: "PROJECT";
      readonly project: string;
      readonly declarationId: string;
    }>
  | ClientActionEnvelope<{
      readonly type: "BALOOT";
      readonly declarationId: string;
    }>;

export function toProtocolClientAction(
  observation: AIRoundObservation,
  action: AIAction,
): AIClientAction {
  switch (action.type) {
    case "BID":
      return envelope(observation, action.type, action.action);

    case "PLAY_CARD":
      return envelope(observation, "PLAY_CARD", {
        type: "PLAY_CARD",
        cardId: action.cardId,
        ikaDeclared: action.ikaDeclared ?? false,
        balootDeclared: false,
      });

    case "DECLARE_PROJECT":
      return envelope(observation, "PROJECT", {
        type: "PROJECT",
        project: action.projectType,
        declarationId: action.declarationId,
      });

    case "DECLARE_BALOOT":
      return envelope(observation, "BALOOT", {
        type: "BALOOT",
        declarationId: action.declarationId,
      });
  }
}

function envelope<TAction>(
  observation: AIRoundObservation,
  type: string,
  action: TAction,
): ClientActionEnvelope<TAction & { readonly type: string }> {
  return {
    matchId: observation.matchId,
    actionId: `ai:${observation.matchId}:${observation.roundId}:v${observation.stateVersion}:${type}`,
    playerId: observation.playerId,
    expectedStateVersion: observation.stateVersion,
    action: {
      type,
      ...action,
    },
  };
}
