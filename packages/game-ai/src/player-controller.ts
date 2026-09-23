import type { BiddingAction } from "@sakkah-baloot/game-engine";
import {
  chooseBaselineAction,
  createBeliefState,
  chooseISMCTSCard,
  type AIDifficulty,
  type AIAction,
  type AIRoundObservation,
} from "./index.js";

export interface AIPlayerControllerConfig {
  readonly difficulty: AIDifficulty;
  readonly searchIterations?: number;
}

export interface AIPlayerController {
  decide(observation: AIRoundObservation, seed: string): AIAction;
}

export function createAIPlayerController(
  config: AIPlayerControllerConfig,
): AIPlayerController {
  return {
    decide(observation, seed) {
      if (observation.phase === "BIDDING") {
        return chooseBaselineAction(observation, {
          difficulty: config.difficulty,
        }).action;
      }

      if (observation.phase !== "PLAYING" || !observation.playing) {
        throw new Error(`AI cannot decide during phase ${observation.phase}`);
      }

      const informationSet = {
        playerId: observation.playerId,
        ownHand: observation.playing.game.ownHand,
        game: {
          players: observation.playing.game.players,
          currentTrick: observation.playing.game.currentTrick,
          completedTricks: observation.playing.game.completedTricks,
        },
        contract: observation.playing.contract,
        trumpSuit: observation.playing.trumpSuit,
      };

      if (config.difficulty === "HARD") {
        const belief = createBeliefState(informationSet);
        const decision = chooseISMCTSCard(
          observation,
          belief,
          {
            iterations: Math.max(1, Math.floor(config.searchIterations ?? 128)),
            seed,
          },
        );
        return {
          type: "PLAY_CARD",
          cardId: decision.cardId,
        };
      }

      return chooseBaselineAction(observation, {
        difficulty: config.difficulty,
      }).action;
    },
  };
}

export function isAIActionCardLegal(
  observation: AIRoundObservation,
  action: AIAction,
): boolean {
  if (action.type !== "PLAY_CARD") return true;
  return observation.playing?.game.legalCardIds.includes(action.cardId) ?? false;
}

export function isAIActionBiddingLegal(
  observation: AIRoundObservation,
  action: AIAction,
): boolean {
  if (action.type !== "BID") return true;
  return observation.bidding?.legalActions.includes(action.action.type) ?? false;
}

void (null as unknown as BiddingAction);
