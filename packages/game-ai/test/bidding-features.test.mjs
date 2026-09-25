import test from "node:test";
import assert from "node:assert/strict";
import { extractBiddingFeatures } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function biddingObservation({
  hand,
  phase = "FIRST_ROUND",
  legalActions = ["PASS", "BUY_SUN"],
  exposedCard = "HEARTS-8",
  history = [],
}) {
  return {
    phase: "BIDDING",
    ownHand: hand.map(card),
    exposedCard: exposedCard ? card(exposedCard) : null,
    legalActions,
    bidding: {
      roundId: "round-1",
      phase,
      actingSeat: "SOUTH",
      turnNumber: history.length,
      passCount: history.filter((entry) => entry.action === "PASS").length,
      stateVersion: history.length,
      selectedContract: null,
      history,
      processedActionIds: history.map((entry) => entry.actionId),
      cancellationReason: "NONE",
      nextDealerSeat: null,
    },
  };
}

test("bidding feature model separates Sun hand value from per-suit Hokum features", () => {
  const observation = biddingObservation({
    hand: [
      "HEARTS-A",
      "HEARTS-J",
      "HEARTS-9",
      "CLUBS-10",
      "DIAMONDS-7",
      "SPADES-8",
    ],
  });

  const features = extractBiddingFeatures(observation);

  assert.equal(features.hand.rawSunValue, 23);
  assert.equal(features.hand.aceCount, 1);
  assert.equal(features.hand.tenCount, 1);
  assert.equal(features.hand.suitLengths.HEARTS, 3);
  assert.equal(features.hand.suits.find((suit) => suit.suit === "HEARTS")?.rawValue, 45);
  assert.equal(features.hand.suits.find((suit) => suit.suit === "HEARTS")?.trumpControlCount, 2);
  assert.equal(features.hand.suits.find((suit) => suit.suit === "HEARTS")?.balootPotential, false);
});

test("bidding feature model detects void suits without changing the hand", () => {
  const hand = ["HEARTS-K", "HEARTS-Q", "HEARTS-7", "CLUBS-A"];
  const observation = biddingObservation({ hand });
  const features = extractBiddingFeatures(observation);

  assert.deepEqual(features.hand.voidSuits, ["DIAMONDS", "SPADES"]);
  assert.equal(features.hand.suits.find((suit) => suit.suit === "HEARTS")?.balootPotential, true);
  assert.equal(observation.ownHand.map((c) => c.id), hand);
});

test("bidding context exposes only public bidding history and legal actions", () => {
  const history = [
    {
      actionId: "a1",
      turnNumber: 0,
      seat: "NORTH",
      phase: "FIRST_ROUND",
      action: "PASS",
      stateVersion: 1,
    },
    {
      actionId: "a2",
      turnNumber: 1,
      seat: "EAST",
      phase: "FIRST_ROUND",
      action: "PASS",
      stateVersion: 2,
    },
  ];

  const features = extractBiddingFeatures(
    biddingObservation({
      hand: ["HEARTS-A", "CLUBS-7"],
      history,
      phase: "SECOND_ROUND",
      legalActions: ["PASS", "BUY_HOKUM"],
      exposedCard: "HEARTS-8",
    }),
  );

  assert.equal(features.context.phase, "SECOND_ROUND");
  assert.equal(features.context.priorPassCount, 2);
  assert.equal(features.context.priorPurchaseCount, 0);
  assert.deepEqual(features.context.legalActions, ["PASS", "BUY_HOKUM"]);
  assert.equal(features.context.exposedSuit, "HEARTS");
});
