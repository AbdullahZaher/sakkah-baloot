import type { BiddingAction, Card, Suit } from "@sakkah-baloot/game-engine";
import { cardRawValue, cardStrength } from "@sakkah-baloot/game-engine";
import type { AIBiddingObservation } from "../index.js";

export interface SuitBidFeatures {
  readonly suit: Suit;
  readonly cardCount: number;
  readonly rawValue: number;
  readonly controlValue: number;
  readonly acePresent: boolean;
  readonly kingPresent: boolean;
  readonly queenPresent: boolean;
  readonly jackPresent: boolean;
  readonly ninePresent: boolean;
  readonly trumpControlCount: number;
  readonly sideAceCount: number;
  readonly sideTenCount: number;
  readonly voidSideSuits: readonly Suit[];
  readonly balootPotential: boolean;
}

export interface BidHandFeatures {
  readonly cardCount: number;
  readonly rawSunValue: number;
  readonly sunControlValue: number;
  readonly aceCount: number;
  readonly tenCount: number;
  readonly kingCount: number;
  readonly queenCount: number;
  readonly jackCount: number;
  readonly nineCount: number;
  readonly suitLengths: Readonly<Record<Suit, number>>;
  readonly voidSuits: readonly Suit[];
  readonly suits: readonly SuitBidFeatures[];
}

export interface BidContextFeatures {
  readonly phase: "FIRST_ROUND" | "SECOND_ROUND";
  readonly actingSeat: AIBiddingObservation["bidding"]["actingSeat"];
  readonly turnNumber: number;
  readonly passCount: number;
  readonly exposedSuit: Suit | null;
  readonly legalActions: readonly BiddingAction["type"][];
  readonly priorPassCount: number;
  readonly priorPurchaseCount: number;
}

export interface BiddingFeatures {
  readonly hand: BidHandFeatures;
  readonly context: BidContextFeatures;
}

const SUITS: readonly Suit[] = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const;
const RANKS = ["A", "10", "K", "Q", "J", "9", "8", "7"] as const;

export function extractBiddingFeatures(
  observation: AIBiddingObservation,
): BiddingFeatures {
  const hand = observation.ownHand;

  const suits = SUITS.map((suit) => buildSuitFeatures(hand, suit));
  const suitLengths = Object.fromEntries(
    suits.map((feature) => [feature.suit, feature.cardCount]),
  ) as Record<Suit, number>;

  const history = observation.bidding.history;

  return {
    hand: {
      cardCount: hand.length,
      rawSunValue: hand.reduce(
        (sum, card) => sum + cardRawValue(card, "SUN", null),
        0,
      ),
      sunControlValue: hand.reduce(
        (sum, card) => sum + cardStrength(card, "SUN", null),
        0,
      ),
      aceCount: countRank(hand, "A"),
      tenCount: countRank(hand, "10"),
      kingCount: countRank(hand, "K"),
      queenCount: countRank(hand, "Q"),
      jackCount: countRank(hand, "J"),
      nineCount: countRank(hand, "9"),
      suitLengths,
      voidSuits: SUITS.filter((suit) => suitLengths[suit] === 0),
      suits,
    },
    context: {
      phase: observation.bidding.phase as "FIRST_ROUND" | "SECOND_ROUND",
      actingSeat: observation.bidding.actingSeat,
      turnNumber: observation.bidding.turnNumber,
      passCount: observation.bidding.passCount,
      exposedSuit: observation.exposedCard?.suit ?? null,
      legalActions: observation.legalActions,
      priorPassCount: history.filter((entry) => entry.action === "PASS").length,
      priorPurchaseCount: history.filter((entry) =>
        entry.action !== "PASS" && entry.action !== "DECLARE_KASHO"
      ).length,
    },
  };
}

function buildSuitFeatures(
  hand: readonly Card[],
  suit: Suit,
): SuitBidFeatures {
  const suitCards = hand.filter((card) => card.suit === suit);
  const sideCards = hand.filter((card) => card.suit !== suit);

  return {
    suit,
    cardCount: suitCards.length,
    rawValue: suitCards.reduce(
      (sum, card) => sum + cardRawValue(card, "HOKUM", suit),
      0,
    ),
    controlValue: suitCards.reduce(
      (sum, card) => sum + cardStrength(card, "HOKUM", suit),
      0,
    ),
    acePresent: suitCards.some((card) => card.rank === "A"),
    kingPresent: suitCards.some((card) => card.rank === "K"),
    queenPresent: suitCards.some((card) => card.rank === "Q"),
    jackPresent: suitCards.some((card) => card.rank === "J"),
    ninePresent: suitCards.some((card) => card.rank === "9"),
    trumpControlCount: suitCards.filter(
      (card) => card.rank === "J" || card.rank === "9",
    ).length,
    sideAceCount: sideCards.filter((card) => card.rank === "A").length,
    sideTenCount: sideCards.filter((card) => card.rank === "10").length,
    voidSideSuits: SUITS.filter(
      (sideSuit) =>
        sideSuit !== suit &&
        hand.every((card) => card.suit !== sideSuit),
    ),
    balootPotential:
      suitCards.some((card) => card.rank === "K") &&
      suitCards.some((card) => card.rank === "Q"),
  };
}

function countRank(
  hand: readonly Card[],
  rank: (typeof RANKS)[number],
): number {
  return hand.filter((card) => card.rank === rank).length;
}
