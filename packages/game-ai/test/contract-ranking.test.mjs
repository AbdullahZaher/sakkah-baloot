import test from "node:test";
import assert from "node:assert/strict";
import { rankBiddingContracts } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function observation(hand, legalActions = ["PASS", "BUY_SUN", "BUY_HOKUM"]) {
  return {
    phase: "BIDDING",
    ownHand: hand.map(card),
    exposedCard: card("HEARTS-8"),
    legalActions,
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

test("contract ranking selects a contract only when at least one evaluator clears its threshold", () => {
  const ranking = rankBiddingContracts(observation([
    "HEARTS-7",
    "HEARTS-8",
    "CLUBS-7",
    "CLUBS-8",
    "DIAMONDS-7",
    "DIAMONDS-8",
    "SPADES-7",
    "SPADES-8",
  ]));

  assert.equal(ranking.selected, null);
  assert.equal(ranking.shouldPass, true);
  assert.ok(ranking.reasonCodes.includes("NO_CONTRACT_CLEARS_THRESHOLD"));
});

test("contract ranking can select Hokum and preserves the winning suit", () => {
  const ranking = rankBiddingContracts(observation([
    "HEARTS-J",
    "HEARTS-9",
    "HEARTS-A",
    "HEARTS-K",
    "HEARTS-Q",
    "CLUBS-A",
    "DIAMONDS-7",
    "SPADES-7",
  ]));

  assert.ok(ranking.selected);
  assert.equal(ranking.selected.contract, "HOKUM");
  assert.equal(ranking.selected.suit, "HEARTS");
  assert.equal(ranking.selected.action, "BUY_HOKUM");
  assert.equal(ranking.shouldPass, false);
});

test("contract ranking respects the authoritative legal action set", () => {
  const ranking = rankBiddingContracts(
    observation([
      "HEARTS-A",
      "HEARTS-10",
      "CLUBS-A",
      "CLUBS-10",
      "DIAMONDS-K",
      "DIAMONDS-Q",
      "SPADES-J",
      "SPADES-9",
    ], ["PASS", "BUY_SUN"]),
  );

  assert.ok(ranking.sun);
  assert.equal(ranking.hokum, null);
  assert.equal(ranking.candidates.length, 1);
});

test("contract ranking is deterministic on ties", () => {
  const input = observation([
    "HEARTS-A",
    "HEARTS-10",
    "CLUBS-A",
    "CLUBS-10",
    "DIAMONDS-K",
    "DIAMONDS-Q",
    "SPADES-K",
    "SPADES-Q",
  ]);
  assert.deepEqual(rankBiddingContracts(input), rankBiddingContracts(input));
});

test("contract ranking reports NO_LEGAL_PURCHASE when only PASS is in the legal action set", () => {
  const input = observation([
    "HEARTS-A",
    "HEARTS-10",
    "CLUBS-A",
    "CLUBS-10",
    "DIAMONDS-K",
    "DIAMONDS-Q",
    "SPADES-K",
    "SPADES-Q",
  ], ["PASS"]);

  const ranking = rankBiddingContracts(input);
  assert.equal(ranking.selected, null);
  assert.equal(ranking.shouldPass, true);
  assert.equal(ranking.candidates.length, 0);
  assert.ok(ranking.reasonCodes.includes("NO_LEGAL_PURCHASE"));
});
