import test from "node:test";
import assert from "node:assert/strict";
import { evaluateHokumBid } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function observation(hand) {
  return {
    phase: "BIDDING",
    ownHand: hand.map(card),
    exposedCard: card("HEARTS-8"),
    legalActions: ["PASS", "BUY_HOKUM"],
    bidding: {
      roundId: "r1",
      phase: "SECOND_ROUND",
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

test("Hokum evaluator ranks suits independently and favors trump controls", () => {
  const evaluation = evaluateHokumBid(observation([
    "HEARTS-J",
    "HEARTS-9",
    "HEARTS-A",
    "HEARTS-K",
    "CLUBS-A",
    "DIAMONDS-10",
    "SPADES-7",
    "CLUBS-7",
  ]));

  assert.equal(evaluation.best.suit, "HEARTS");
  assert.ok(evaluation.best.reasonCodes.includes("TRUMP_J"));
  assert.ok(evaluation.best.reasonCodes.includes("TRUMP_9"));
  assert.ok(evaluation.best.reasonCodes.includes("TRUMP_LENGTH"));
});

test("Hokum evaluator detects Baloot potential without making it a separate contract", () => {
  const evaluation = evaluateHokumBid(observation([
    "HEARTS-J",
    "HEARTS-9",
    "HEARTS-K",
    "HEARTS-Q",
    "CLUBS-A",
    "DIAMONDS-A",
    "SPADES-10",
    "CLUBS-7",
  ]));

  assert.equal(evaluation.best.suit, "HEARTS");
  assert.ok(evaluation.best.reasonCodes.includes("BALOOT_POTENTIAL"));
});

test("Hokum evaluator uses the authoritative Hokum threshold", () => {
  const evaluation = evaluateHokumBid(observation([
    "HEARTS-J",
    "HEARTS-9",
    "HEARTS-A",
    "CLUBS-7",
    "DIAMONDS-7",
    "SPADES-7",
    "CLUBS-8",
    "DIAMONDS-8",
  ]));

  assert.equal(evaluation.threshold, 81);
  assert.equal(evaluation.best.threshold, 81);
  assert.ok(Number.isFinite(evaluation.best.margin));
});

test("Hokum evaluator is deterministic and returns all four suit evaluations", () => {
  const input = observation([
    "HEARTS-A",
    "HEARTS-10",
    "CLUBS-J",
    "CLUBS-9",
    "DIAMONDS-K",
    "DIAMONDS-Q",
    "SPADES-7",
    "SPADES-8",
  ]);
  const first = evaluateHokumBid(input);
  const second = evaluateHokumBid(input);

  assert.deepEqual(first, second);
  assert.equal(first.suits.length, 4);
  assert.deepEqual(input.ownHand.map((c) => c.id), [
    "HEARTS-A", "HEARTS-10", "CLUBS-J", "CLUBS-9",
    "DIAMONDS-K", "DIAMONDS-Q", "SPADES-7", "SPADES-8",
  ]);
});
