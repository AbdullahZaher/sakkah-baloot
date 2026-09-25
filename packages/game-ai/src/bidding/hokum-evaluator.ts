import type { Suit } from "@sakkah-baloot/game-engine";
import { contractThreshold } from "@sakkah-baloot/game-engine";
import { extractBiddingFeatures, type BiddingFeatures } from "./bid-features.js";
import type { AIBiddingObservation } from "../index.js";

export interface HokumSuitEvaluation {
  readonly contract: "HOKUM";
  readonly suit: Suit;
  readonly strength: number;
  readonly threshold: number;
  readonly margin: number;
  readonly confidence: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  readonly recommended: boolean;
  readonly reasonCodes: readonly string[];
}

export interface HokumBidEvaluation {
  readonly contract: "HOKUM";
  readonly threshold: number;
  readonly best: HokumSuitEvaluation;
  readonly suits: readonly HokumSuitEvaluation[];
  readonly features: BiddingFeatures["hand"];
}

export function evaluateHokumBid(
  observation: AIBiddingObservation,
): HokumBidEvaluation {
  const features = extractBiddingFeatures(observation);
  const threshold = contractThreshold("HOKUM");
  const suits = features.hand.suits.map((suit) =>
    evaluateSuit(suit, threshold),
  );
  const ordered = [...suits].sort(compareSuitEvaluation);

  return {
    contract: "HOKUM",
    threshold,
    best: ordered[0]!,
    suits,
    features: features.hand,
  };
}

function evaluateSuit(
  feature: BiddingFeatures["hand"]["suits"][number],
  threshold: number,
): HokumSuitEvaluation {
  // Raw card points are the authoritative card-value basis. The additional
  // control signals reward the specific trump controls and side winners that
  // materially affect a Hokum contract without changing any game rule.
  let strength = feature.rawValue * 1.5;
  strength += feature.trumpControlCount * 7;
  strength += feature.sideAceCount * 8;
  strength += feature.sideTenCount * 3;
  if (feature.cardCount >= 4) strength += 6;
  if (feature.cardCount >= 5) strength += 5;
  if (feature.balootPotential) strength += 5;

  const margin = strength - threshold;
  const reasons: string[] = [];

  if (feature.cardCount >= 4) reasons.push("TRUMP_LENGTH");
  else if (feature.cardCount === 3) reasons.push("TRUMP_LENGTH_3");

  if (feature.jackPresent) reasons.push("TRUMP_J");
  if (feature.ninePresent) reasons.push("TRUMP_9");
  if (feature.acePresent) reasons.push("TRUMP_ACE");
  if (feature.balootPotential) reasons.push("BALOOT_POTENTIAL");
  if (feature.sideAceCount > 0) reasons.push("SIDE_ACE_CONTROL");
  if (feature.sideTenCount > 0) reasons.push("SIDE_TEN_VALUE");
  if (feature.voidSideSuits.length > 0) reasons.push("SIDE_VOID");

  if (strength >= threshold) reasons.push("HOKUM_THRESHOLD_MET");
  else reasons.push("HOKUM_BELOW_THRESHOLD");

  return {
    contract: "HOKUM",
    suit: feature.suit,
    strength,
    threshold,
    margin,
    confidence: confidenceFor(margin, feature),
    recommended: strength >= threshold,
    reasonCodes: reasons,
  };
}

function confidenceFor(
  margin: number,
  feature: BiddingFeatures["hand"]["suits"][number],
): HokumSuitEvaluation["confidence"] {
  if (margin >= 15 && feature.trumpControlCount >= 2 && feature.cardCount >= 4) return "VERY_HIGH";
  if (margin >= 8 || (margin >= 0 && feature.trumpControlCount >= 2)) return "HIGH";
  if (margin >= 0) return "MEDIUM";
  if (margin >= -10 && (feature.cardCount >= 3 || feature.trumpControlCount >= 1)) return "LOW";
  return "VERY_LOW";
}

function compareSuitEvaluation(
  a: HokumSuitEvaluation,
  b: HokumSuitEvaluation,
): number {
  if (b.strength !== a.strength) return b.strength - a.strength;
  return a.suit.localeCompare(b.suit);
}
