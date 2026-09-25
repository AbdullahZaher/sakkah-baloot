import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSunBid } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function observation(hand) {
  return {
    phase: "BIDDING",
    ownHand: hand.map(card),
    exposedCard: card("HEARTS-8"),
    legalActions: ["PASS", "BUY_SUN"],
    bidding: {
      roundId: "r1",
      phase: "FIRST_ROUND",
      actingSeat: "SOUTH",
      turnNumber: 0,
      passCount: 0,
      stateVersion: 0,
      selectedContract: null,
      history: [],
      processedActionIds: [],
      cancellationReason: "NONE",
      nextDealerSeat: null,
    },
  };
}

test("Sun evaluator uses the authoritative Sun contract threshold", () => {
  const evaluation = evaluateSunBid(observation([
    "HEARTS-A",
    "CLUBS-A",
    "DIAMONDS-10",
    "SPADES-10",
    "HEARTS-K",
    "CLUBS-Q",
    "DIAMONDS-J",
    "SPADES-9",
  ]));

  assert.equal(evaluation.threshold, 65);
  assert.equal(evaluation.strength, 51);
  assert.equal(evaluation.recommended, false);
  assert.equal(evaluation.margin, -14);
  assert.ok(evaluation.reasonCodes.includes("SUN_BELOW_THRESHOLD"));
});

test("Sun evaluator recommends a clearly strong Sun hand", () => {
  const evaluation = evaluateSunBid(observation([
    "HEARTS-A",
    "CLUBS-A",
    "DIAMONDS-A",
    "SPADES-A",
    "HEARTS-10",
    "CLUBS-10",
    "DIAMONDS-10",
    "SPADES-K",
  ]));

  assert.equal(evaluation.strength, 78);
  assert.equal(evaluation.margin, 13);
  assert.equal(evaluation.recommended, true);
  assert.ok(evaluation.reasonCodes.includes("SUN_THRESHOLD_MET"));
  assert.ok(evaluation.reasonCodes.includes("MULTIPLE_ACES"));
});

test("Sun evaluator exposes confidence separately from the buy recommendation", () => {
  const borderline = evaluateSunBid(observation([
    "HEARTS-A",
    "CLUBS-A",
    "DIAMONDS-10",
    "SPADES-10",
    "HEARTS-K",
    "CLUBS-K",
    "DIAMONDS-Q",
    "SPADES-Q",
  ]));

  assert.equal(borderline.strength, 56);
  assert.equal(borderline.recommended, false);
  assert.notEqual(borderline.confidence, "VERY_HIGH");
});

test("Sun evaluator is deterministic and does not mutate the observed hand", () => {
  const hand = [
    "HEARTS-A",
    "HEARTS-10",
    "CLUBS-A",
    "CLUBS-10",
    "DIAMONDS-K",
    "DIAMONDS-Q",
    "SPADES-J",
    "SPADES-9",
  ];
  const observationValue = observation(hand);
  const first = evaluateSunBid(observationValue);
  const second = evaluateSunBid(observationValue);

  assert.deepEqual(first, second);
  assert.deepEqual(observationValue.ownHand.map((c) => c.id), hand);
});
