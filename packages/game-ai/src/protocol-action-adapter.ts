import type { BiddingAction } from "@sakkah-baloot/game-engine";
import type { ClientActionEnvelope } from "@sakkah-baloot/game-protocol";
import type { AIAction, AIRoundObservation } from "./index.js";

export type AIClientAction =
  | ClientActionEnvelope<{ readonly type: "BID"; readonly action: BiddingAction }>
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
      return envelope(observation, "BID", action.action);

    case "PLAY_CARD":
      return envelope(observation, "PLAY_CARD", {
        cardId: action.cardId,
        ikaDeclared: action.ikaDeclared ?? false,
        balootDeclared: false,
      });

    case "DECLARE_PROJECT":
      return envelope(observation, "PROJECT", {
        project: action.projectType,
        declarationId: action.declarationId,
      });

    case "DECLARE_BALOOT":
      return envelope(observation, "BALOOT", {
        declarationId: action.declarationId,
      });
  }
}

function envelope<TType extends string, TAction>(
  observation: AIRoundObservation,
  type: TType,
  action: TAction,
): ClientActionEnvelope<TAction & { readonly type: TType }> {
  return {
    matchId: observation.matchId,
    actionId: `ai:${observation.matchId}:${observation.roundId}:v${observation.stateVersion}:${type}`,
    playerId: observation.playerId,
    expectedStateVersion: observation.stateVersion,
    action: {
      type,
      ...(typeof action === "object" && action !== null ? action : { value: action }),
    } as TAction & { readonly type: TType },
  };
}
