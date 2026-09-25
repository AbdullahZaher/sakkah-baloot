import type { BiddingAction, Suit } from "@sakkah-baloot/game-engine";
import { evaluateHokumBid, type HokumBidEvaluation, type HokumSuitEvaluation } from "./hokum-evaluator.js";
import { evaluateSunBid, type SunBidEvaluation } from "./sun-evaluator.js";
import type { AIBiddingObservation } from "../index.js";

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
): ContractRanking {
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
      score: sun.strength,
      margin: sun.margin,
      confidence: sun.confidence,
      action: "BUY_SUN",
      suit: null,
      reasonCodes: sun.reasonCodes,
    });
  }

  if (hokum) {
    const action = observation.legalActions.includes("BUY_HOKUM")
      ? "BUY_HOKUM"
      : "BUY_HOKUM_EXPOSED";
    candidates.push({
      contract: "HOKUM",
      score: hokum.best.strength,
      margin: hokum.best.margin,
      confidence: hokum.best.confidence,
      action,
      suit: hokum.best.suit,
      reasonCodes: hokum.best.reasonCodes,
    });
  }

  const ordered = [...candidates].sort(compareRankedBid);
  const selected = ordered[0] ?? null;
  const next = ordered[1] ?? null;

  // PASS is deliberately not represented as a heuristic competitor. A bid
  // must clear its authoritative contract threshold; this keeps "highest
  // score" from turning a weak hand into an automatic purchase.
  const shouldPass = selected === null || selected.margin < 0;
  const selectedVsNextMargin =
    selected && next ? selected.score - next.score : selected ? selected.margin : 0;

  const reasons: string[] = [];
  if (selected === null) reasons.push("NO_LEGAL_PURCHASE");
  else if (shouldPass) reasons.push("NO_CONTRACT_CLEARS_THRESHOLD");
  else reasons.push("CONTRACT_CLEARS_THRESHOLD");
  if (next && selected) {
    if (selectedVsNextMargin > 0) reasons.push("CLEAR_CONTRACT_LEAD");
    else if (selectedVsNextMargin === 0) reasons.push("CONTRACT_TIE");
  }

  return {
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

function compareRankedBid(a: RankedBid, b: RankedBid): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.margin !== a.margin) return b.margin - a.margin;
  if (a.contract !== b.contract) return a.contract.localeCompare(b.contract);
  return (a.suit ?? "").localeCompare(b.suit ?? "");
}
