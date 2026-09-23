import type { MatchState, PlayerId, Seat } from "@sakkah-baloot/game-engine";
import { createAIObservation, createAuthoritativeActionSpace, type AIAction, type AIRoundObservation } from "./index.js";
import { chooseBaselineAction, type BaselinePolicyConfig } from "./baseline-policy.js";
import { createBeliefState } from "./belief-state.js";
import { chooseISMCTSCard } from "./is-mcts.js";
export type AIControllerMode = "BASELINE" | "IS_MCTS";
export interface AIControllerConfig { readonly mode?: AIControllerMode; readonly seed: string; readonly difficulty?: BaselinePolicyConfig["difficulty"]; readonly mctsIterations?: number; readonly enableProjects?: boolean; }
export interface AIControllerDecision { readonly observation: AIRoundObservation; readonly action: AIAction; readonly reason: "BID" | "PROJECT" | "BALOOT_PLAY" | "CARD"; }
export function chooseAuthoritativeAIAction(match: MatchState, playerId: PlayerId, playerSeat: Seat, config: AIControllerConfig): AIControllerDecision {
  const actionSpace = createAuthoritativeActionSpace(match, playerId, playerSeat);
  const observation = createAIObservation({ match, playerId, playerSeat, legalBiddingActions: actionSpace.bidding, legalCardIds: actionSpace.cards });
  if (observation.phase === "BIDDING") { const decision = chooseBaselineAction(observation, config.difficulty === undefined ? {} : { difficulty: config.difficulty }); return { observation, action: decision.action, reason: "BID" }; }
  if (observation.phase !== "PLAYING" || !observation.playing) throw new Error("AI controller requires an active bidding or playing phase");
  const undeclaredProjects = actionSpace.projects.filter((candidate) => !observation.projects.some((project) => project.candidate.id === candidate.id));
  if (config.enableProjects !== false && undeclaredProjects.length > 0 && observation.playing.game.currentTrick.length === 0) { const candidate = [...undeclaredProjects].sort((a, b) => b.qaydValue - a.qaydValue || b.rawValue - a.rawValue || a.id.localeCompare(b.id))[0]!; return { observation, action: { type: "DECLARE_PROJECT", projectType: candidate.type, declarationId: "project:" + match.roundId + ":" + playerId + ":" + candidate.id }, reason: "PROJECT" }; }
  if (config.mode === "IS_MCTS") { const input = { playerId, ownHand: observation.playing.game.ownHand, game: { players: observation.playing.game.players, currentTrick: observation.playing.game.currentTrick, completedTricks: observation.playing.game.completedTricks }, contract: observation.playing.contract, trumpSuit: observation.playing.trumpSuit }; const belief = createBeliefState(input, config.seed, { sampleCount: Math.max(1, Math.floor(config.mctsIterations ?? 32)) }); const decision = chooseISMCTSCard(observation, belief, { iterations: Math.max(1, Math.floor(config.mctsIterations ?? 32)), seed: config.seed }); const action: AIAction = { type: "PLAY_CARD", cardId: decision.cardId }; return actionSpace.baloot ? { observation, action: { ...action, balootDeclared: true }, reason: "BALOOT_PLAY" } : { observation, action, reason: "CARD" }; }
  const decision = chooseBaselineAction(observation, config.difficulty === undefined ? {} : { difficulty: config.difficulty }); if (decision.action.type !== "PLAY_CARD") throw new Error("Baseline controller returned a non-card action during PLAYING"); return actionSpace.baloot ? { observation, action: { ...decision.action, balootDeclared: true }, reason: "BALOOT_PLAY" } : { observation, action: decision.action, reason: "CARD" };
}
