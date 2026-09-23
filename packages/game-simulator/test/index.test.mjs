import test from "node:test";
import assert from "node:assert/strict";
import {
  simulateCardPlayRound,
  simulateBatch,
  simulateMatch,
  simulateMatchBatch,
  replayCardPlayRound,
} from "../dist/index.js";

function card(id) {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
}

function state() {
  return {
    phase: "PLAYING",
    currentPlayerId: "NORTH",
    players: {
      NORTH: "NORTH",
      EAST: "EAST",
      SOUTH: "SOUTH",
      WEST: "WEST",
    },
    hands: {
      NORTH: [card("CLUBS-A")],
      EAST: [card("CLUBS-7")],
      SOUTH: [card("DIAMONDS-A")],
      WEST: [card("DIAMONDS-7")],
    },
    contract: "SUN",
    trumpSuit: null,
    hokumPlayMode: "OPEN",
    dealerSeat: "WEST",
    trickNumber: 8,
    currentTrick: [],
    completedTricks: [],
  };
}

const firstLegalPolicy = ({ legalCardIds }) => legalCardIds[0];

test("simulator completes a legal card-play round", () => {
  const result = simulateCardPlayRound(state(), firstLegalPolicy, "test");

  assert.equal(result.final.phase, "PLAYING");
  assert.equal(result.playedCardIds.length, 4);
  assert.equal(result.illegalActionCount, 0);
});

test("simulation batch is deterministic and has zero illegal actions", () => {
  const config = {
    seed: "batch-seed",
    games: 100,
    policy: firstLegalPolicy,
  };

  const a = simulateBatch(() => state(), config);
  const b = simulateBatch(() => state(), config);

  assert.deepEqual(a, b);
  assert.equal(a.games, 100);
  assert.equal(a.completed, 0);
  assert.equal(a.illegalActions, 0);
});

test("full-match simulator reaches a stable bounded result", () => {
  const result = simulateMatch("full-match", undefined, 50);

  assert.ok(result.rounds <= 50);
  assert.equal(result.illegalActions, 0);
  assert.ok(["ONGOING", "FINISHED", "EXTRA_DEAL"].includes(result.end.status));
  assert.ok(result.deterministicDigest.length > 0);
});

test("full-match batch is deterministic", () => {
  const config = {
    seed: "full-batch",
    games: 4,
    maxRoundsPerGame: 50,
  };

  const a = simulateMatchBatch(config);
  const b = simulateMatchBatch(config);

  assert.deepEqual(a, b);
  assert.equal(a.games, 4);
  assert.equal(a.illegalActions, 0);
});

test("1,000 full-match deterministic gate has zero illegal actions", () => {
  const config = {
    seed: "gate-1000",
    games: 1000,
    maxRoundsPerGame: 200,
  };

  const a = simulateMatchBatch(config);
  const b = simulateMatchBatch(config);

  assert.deepEqual(a, b);
  assert.equal(a.games, 1000);
  assert.equal(a.illegalActions, 0);
  assert.equal(a.finishedMatches + a.maxRoundTerminations, 1000);
});

test("card-play replay reproduces the simulator final state", () => {
  const initial = state();
  const result = simulateCardPlayRound(initial, firstLegalPolicy, "replay");
  const replayed = replayCardPlayRound(initial, result.playedCardIds);

  assert.deepEqual(replayed, result.final);
});


test("batch integrity gate", () => {
  const result = simulateMatchBatch({
    seed: "integrity-gate",
    games: 100,
    maxRoundsPerGame: 50,
  });

  assert.equal(result.games, 100);
  assert.equal(result.illegalActions, 0);
  assert.ok(result.deterministicDigest.length > 0);
});

test("1,000-match deterministic validation has zero illegal actions", () => {
  const result = simulateMatchBatch({
    seed: "validation-1000",
    games: 1000,
    maxRoundsPerGame: 30,
  });

  assert.equal(result.games, 1000);
  assert.equal(result.illegalActions, 0);
  assert.ok(result.deterministicDigest.length > 0);
});
