import type { Suit } from "@sakkah-baloot/game-engine";
import { contractThreshold } from "@sakkah-baloot/game-engine";
import { extractBiddingFeatures, type BiddingFeatures } from "./bid-features.js";

export type BidConfidence = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface SunBidEvaluation {
  readonly contract: "SUN";
  readonly strength: number;
  readonly threshold: number;
  readonly margin: number;
  readonly confidence: BidConfidence;
  readonly recommended: boolean;
  readonly reasonCodes: readonly string[];
  readonly features: BiddingFeatures["hand"];
}

export function evaluateSunBid(
  observation: Parameters<typeof extractBiddingFeatures>[0],
): SunBidEvaluation {
  const features = extractBiddingFeatures(observation);
  const { hand } = features;
  const threshold = contractThreshold("SUN");
  const strength = hand.rawSunValue;
  const margin = strength - threshold;

  const reasons: string[] = [];

  if (strength >= threshold) reasons.push("SUN_THRESHOLD_MET");
  else reasons.push("SUN_BELOW_THRESHOLD");

  if (hand.aceCount >= 2) reasons.push("MULTIPLE_ACES");
  else if (hand.aceCount === 1) reasons.push("ACE_CONTROL");

  if (hand.tenCount >= 2) reasons.push("MULTIPLE_TENS");
  if (hand.suitLengths[largestSuit(hand)] >= 3) reasons.push("SUIT_CONCENTRATION");
  if (hand.voidSuits.length >= 1) reasons.push("VOID_SUIT");
  if (hand.sunControlValue >= 40) reasons.push("HIGH_SUN_CONTROL");

  return {
    contract: "SUN",
    strength,
    threshold,
    margin,
    confidence: confidenceFor(margin, hand.aceCount, hand.sunControlValue),
    recommended: strength >= threshold,
    reasonCodes: reasons,
    features: hand,
  };
}

function confidenceFor(
  margin: number,
  aceCount: number,
  controlValue: number,
): BidConfidence {
  if (margin >= 10 && aceCount >= 2) return "VERY_HIGH";
  if (margin >= 5 || (margin >= 0 && controlValue >= 40)) return "HIGH";
  if (margin >= 0) return "MEDIUM";
  if (margin >= -8 && (aceCount >= 1 || controlValue >= 32)) return "LOW";
  return "VERY_LOW";
}

function largestSuit(hand: BiddingFeatures["hand"]): Suit {
  return (Object.entries(hand.suitLengths) as [Suit, number][])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0];
}
