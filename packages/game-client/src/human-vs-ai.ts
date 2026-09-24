import type { MatchState, PlayerId, Seat } from "@sakkah-baloot/game-engine";
import {
  decideAIAction,
  type AIControllerConfig,
  type AIControllerDecision,
} from "@sakkah-baloot/game-ai";

export interface HumanVsAIConfig {
  readonly humanPlayerId: PlayerId;
  readonly aiPlayers: Readonly<Record<PlayerId, { readonly seat: Seat; readonly config: AIControllerConfig }>>;
}

export interface HumanVsAIDecision {
  readonly kind: "HUMAN" | "AI";
  readonly playerId: PlayerId;
  readonly action: AIControllerDecision["action"] | null;
  readonly expectedStateVersion: number;
}

export function createHumanVsAIController(config: HumanVsAIConfig) {
  const aiIds = new Set(Object.keys(config.aiPlayers));

  if (aiIds.has(config.humanPlayerId)) {
    throw new Error("Human player cannot also be configured as AI");
  }
  if (aiIds.size !== 3) {
    throw new Error("Human-vs-3-AI mode requires exactly three AI players");
  }

  return {
    decide(match: MatchState): HumanVsAIDecision {
      const playerId = match.round?.game?.currentPlayerId ?? null;
      if (playerId === null) {
        return {
          kind: "HUMAN",
          playerId: config.humanPlayerId,
          action: null,
          expectedStateVersion: match.stateVersion,
        };
      }

      if (playerId === config.humanPlayerId) {
        return {
          kind: "HUMAN",
          playerId,
          action: null,
          expectedStateVersion: match.stateVersion,
        };
      }

      const ai = config.aiPlayers[playerId];
      if (!ai) {
        throw new Error(`Current player ${playerId} is neither the configured human nor an AI player`);
      }

      const decision = decideAIAction(match, playerId, ai.seat, ai.config);
      return {
        kind: "AI",
        playerId,
        action: decision.action,
        expectedStateVersion: match.stateVersion,
      };
    },
  };
}
