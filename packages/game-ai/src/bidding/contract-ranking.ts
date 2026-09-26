import type { BiddingAction, Suit } from "@sakkah-baloot/game-engine";
import { evaluateHokumBid, type HokumBidEvaluation, type HokumSuitEvaluation } from "./hokum-evaluator.js";
import { evaluateSunBid, type SunBidEvaluation } from "./sun-evaluator.js";
import type { AIBiddingObservation } from "../index.js";

export type BiddingDifficulty = "EASY" | "NORMAL" | "HARD";

export interface BiddingPolicyConfig {
  readonly difficulty?: BiddingDifficulty;
}

export type RankedBid =
  | {
      readonly contract: "SUN";
      readonly score: number;
      readonly margin: number;
      readonly confidence: SunBidEvaluation["confidence"];
      readonly action: BiddingAction["type"];
      readonly suit: null;
      readonly reasonCodes: readonly string[];
    }
  | {
      readonly contract: "HOKUM";
      readonly score: number;
      readonly margin: number;
      readonly confidence: HokumSuitEvaluation["confidence"];
      readonly action: BiddingAction["type"];
      readonly suit: Suit;
      readonly reasonCodes: readonly string[];
    };

export interface ContractRanking {
  readonly difficulty: BiddingDifficulty;
  readonly sun: SunBidEvaluation | null;
  readonly hokum: HokumBidEvaluation | null;
  readonly candidates: readonly RankedBid[];
  readonly selected: RankedBid | null;
  readonly passScore: number;
  readonly selectedVsNextMargin: number;
  readonly shouldPass: boolean;
  readonly reasonCodes: readonly string[];
}

export function rankBiddingContracts(
  observation: AIBiddingObservation,
  config: BiddingPolicyConfig = {},
): ContractRanking {
  const difficulty = config.difficulty ?? "NORMAL";
  const sun = observation.legalActions.includes("BUY_SUN")
    ? evaluateSunBid(observation)
    : null;
  const hokum = observation.legalActions.includes("BUY_HOKUM") ||
    observation.legalActions.includes("BUY_HOKUM_EXPOSED")
    ? evaluateHokumBid(observation)
    : null;

  const candidates: RankedBid[] = [];

  if (sun && observation.legalActions.includes("BUY_SUN")) {
    candidates.push({
      contract: "SUN",
      score: contextScore("SUN", sun.strength, sun.margin, observation, difficulty),
      margin: sun.margin,
      confidence: sun.confidence,
      action: "BUY_SUN",
      suit: null,
      reasonCodes: [...sun.reasonCodes, ...contextReasons("SUN", observation, difficulty)],
    });
  }

  if (hokum) {
    const action = observation.legalActions.includes("BUY_HOKUM")
      ? "BUY_HOKUM"
      : "BUY_HOKUM_EXPOSED";

    const selectedSuit = action === "BUY_HOKUM_EXPOSED"
      ? observation.exposedCard?.suit
      : hokum.best.suit;
    const suitEvaluation = selectedSuit
      ? hokum.suits.find((candidate) => candidate.suit === selectedSuit) ?? hokum.best
      : hokum.best;

    candidates.push({
      contract: "HOKUM",
      score: contextScore("HOKUM", suitEvaluation.strength, suitEvaluation.margin, observation, difficulty),
      margin: suitEvaluation.margin,
      confidence: suitEvaluation.confidence,
      action,
      suit: suitEvaluation.suit,
      reasonCodes: [
        ...suitEvaluation.reasonCodes,
        ...contextReasons("HOKUM", observation, difficulty),
      ],
    });
  }

  const ordered = [...candidates].sort(compareRankedBid);
  // Keep below-threshold evaluations visible as candidates, but never expose
  // them as the selected contract. The selected contract must already clear
  // the authoritative evaluator threshold.
  const qualified = ordered.filter((candidate) => candidate.margin >= 0);
  const selected = qualified[0] ?? null;
  const next = qualified[1] ?? null;

  // Difficulty changes preference/risk among already-legal, threshold-clearing
  // contracts. It never bypasses the authoritative contract threshold.
  const shouldPass = selected === null || selected.margin < 0;
  const selectedVsNextMargin =
    selected && next ? selected.score - next.score : selected ? selected.margin : 0;

  const reasons: string[] = [];
  if (candidates.length === 0) reasons.push("NO_LEGAL_PURCHASE");
  else if (shouldPass) reasons.push("NO_CONTRACT_CLEARS_THRESHOLD");
  else reasons.push("CONTRACT_CLEARS_THRESHOLD");

  if (next && selected) {
    if (selectedVsNextMargin > 0) reasons.push("CLEAR_CONTRACT_LEAD");
    else if (selectedVsNextMargin === 0) reasons.push("CONTRACT_TIE");
  }

  return {
    difficulty,
    sun,
    hokum,
    candidates: ordered,
    selected,
    passScore: 0,
    selectedVsNextMargin,
    shouldPass,
    reasonCodes: reasons,
  };
}

function contextScore(
  contract: "SUN" | "HOKUM",
  strength: number,
  margin: number,
  observation: AIBiddingObservation,
  difficulty: BiddingDifficulty,
): number {
  let score = strength;

  // Context is a ranking signal, not a rules override.
  if (observation.bidding.phase === "SECOND_ROUND") {
    score += difficulty === "HARD" ? 3 : difficulty === "NORMAL" ? 1 : 0;
  }

  if (observation.bidding.passCount >= 2) {
    score += difficulty === "HARD" ? 2 : difficulty === "NORMAL" ? 1 : 0;
  }

  // HARD uses margin more strongly once a contract is already qualified.
  // EASY stays closer to the raw evaluator score.
  const marginWeight = difficulty === "HARD" ? 0.35 : difficulty === "NORMAL" ? 0.15 : 0.05;
  score += Math.max(0, margin) * marginWeight;

  // In first round, exposed Hokum is a concrete contract choice; keep its
  // ranking tied to its evaluated exposed suit rather than another suit.
  if (contract === "HOKUM" && observation.legalActions.includes("BUY_HOKUM_EXPOSED")) {
    score += 1;
  }

  return score;
}

function contextReasons(
  contract: "SUN" | "HOKUM",
  observation: AIBiddingObservation,
  difficulty: BiddingDifficulty,
): readonly string[] {
  const reasons: string[] = [];
  if (observation.bidding.phase === "SECOND_ROUND") reasons.push("SECOND_ROUND_CONTEXT");
  if (observation.bidding.passCount >= 2) reasons.push("MULTIPLE_PASSES");
  if (difficulty === "HARD") reasons.push("HARD_RISK_CONTEXT");
  else if (difficulty === "EASY") reasons.push("EASY_BASELINE_CONTEXT");
  if (contract === "HOKUM" && observation.legalActions.includes("BUY_HOKUM_EXPOSED")) {
    reasons.push("EXPOSED_HOKUM_CONTEXT");
  }
  return reasons;
}

function compareRankedBid(a: RankedBid, b: RankedBid): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.margin !== a.margin) return b.margin - a.margin;
  if (a.contract !== b.contract) return a.contract.localeCompare(b.contract);
  return (a.suit ?? "").localeCompare(b.suit ?? "");
}
