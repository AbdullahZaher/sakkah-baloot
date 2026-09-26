import test from "node:test";
import assert from "node:assert/strict";
import { chooseBaselineAction, rankBiddingContracts } from "../dist/index.js";

const card = (id) => {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
};

function observation({ hand, phase = "FIRST_ROUND", legalActions = ["PASS", "BUY_SUN", "BUY_HOKUM"], passCount = 0, exposedCard = "HEARTS-8" }) {
  return {
    phase: "BIDDING",
    ownHand: hand.map(card),
    exposedCard: exposedCard ? card(exposedCard) : null,
    legalActions,
    bidding: {
      roundId: "r1",
      phase,
      actingSeat: "SOUTH",
      turnNumber: passCount,
      passCount,
      stateVersion: passCount,
      selectedContract: null,
      history: [],
      processedActionIds: [],
      cancellationReason: "NONE",
      nextDealerSeat: null,
    },
  };
}

const balancedStrongHand = [
  "HEARTS-A", "HEARTS-10",
  "CLUBS-A", "CLUBS-10",
  "DIAMONDS-K", "DIAMONDS-Q",
  "SPADES-K", "SPADES-Q",
];

test("difficulty changes ranking context without bypassing thresholds", () => {
  const input = observation({
    hand: balancedStrongHand,
    phase: "SECOND_ROUND",
    passCount: 2,
    legalActions: ["PASS", "BUY_SUN", "BUY_HOKUM"],
  });

  const easy = rankBiddingContracts(input, { difficulty: "EASY" });
  const normal = rankBiddingContracts(input, { difficulty: "NORMAL" });
  const hard = rankBiddingContracts(input, { difficulty: "HARD" });

  assert.equal(easy.difficulty, "EASY");
  assert.equal(normal.difficulty, "NORMAL");
  assert.equal(hard.difficulty, "HARD");

  for (const result of [easy, normal, hard]) {
    if (result.selected) assert.ok(result.selected.margin >= 0);
  }
});

test("first-round exposed Hokum evaluates the exposed suit, not an unrelated best suit", () => {
  const result = rankBiddingContracts(observation({
    hand: [
      "HEARTS-J", "HEARTS-9", "HEARTS-A", "HEARTS-K",
      "CLUBS-A", "DIAMONDS-A", "SPADES-10", "HEARTS-8",
    ],
    phase: "FIRST_ROUND",
    legalActions: ["PASS", "BUY_HOKUM_EXPOSED"],
    exposedCard: "HEARTS-8",
  }));

  assert.ok(result.hokum);
  assert.equal(result.selected?.action, "BUY_HOKUM_EXPOSED");
  assert.equal(result.selected?.suit, "HEARTS");
  assert.equal(result.selected?.margin, result.hokum?.suits.find((s) => s.suit === "HEARTS")?.margin);
});

test("second-round Hokum selects a legal non-exposed suit", () => {
  const result = rankBiddingContracts(observation({
    hand: [
      "CLUBS-J", "CLUBS-9", "CLUBS-A", "CLUBS-K",
      "HEARTS-7", "DIAMONDS-7", "SPADES-7", "HEARTS-8",
    ],
    phase: "SECOND_ROUND",
    legalActions: ["PASS", "BUY_HOKUM"],
    exposedCard: "HEARTS-8",
  }));

  assert.equal(result.selected?.action, "BUY_HOKUM");
  assert.notEqual(result.selected?.suit, "HEARTS");
});

test("chooseBaselineAction propagates difficulty configuration to bidding decision", () => {
  const biddingObs = observation({
    hand: balancedStrongHand,
    phase: "SECOND_ROUND",
    passCount: 2,
    legalActions: ["PASS", "BUY_SUN", "BUY_HOKUM"],
  });

  const roundObs = {
    matchId: "m1",
    roundId: "r1",
    roundNumber: 1,
    playerId: "SOUTH_PLAYER",
    seat: "SOUTH",
    teamId: "NORTH_SOUTH",
    phase: "BIDDING",
    score: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    bidding: biddingObs,
    playing: null,
    projects: [],
    baloot: null,
    stateVersion: 1,
  };

  const easyDecision = chooseBaselineAction(roundObs, { difficulty: "EASY" });
  const hardDecision = chooseBaselineAction(roundObs, { difficulty: "HARD" });

  assert.equal(easyDecision.action.type, "BID");
  assert.equal(hardDecision.action.type, "BID");
  assert.ok(easyDecision.trace.candidates.length > 0);
  assert.ok(hardDecision.trace.candidates.length > 0);
  assert.notEqual(
    easyDecision.trace.candidates[0].heuristicScore,
    hardDecision.trace.candidates[0].heuristicScore,
    "Difficulty must alter heuristicScore through contextScore rather than being dropped",
  );
});
