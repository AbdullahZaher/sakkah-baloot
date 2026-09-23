import test from "node:test";
import assert from "node:assert/strict";
import {
  simulateMatch,
  simulateMatchBatch,
} from "../src/index.ts";

const aiPlayers = [
  {
    playerId: "EAST_PLAYER",
    seat: "EAST",
    config: { mode: "BASELINE", difficulty: "EASY", seed: "east" },
  },
  {
    playerId: "SOUTH_PLAYER",
    seat: "SOUTH",
    config: { mode: "BASELINE", difficulty: "NORMAL", seed: "south" },
  },
  {
    playerId: "WEST_PLAYER",
    seat: "WEST",
    config: { mode: "BASELINE", difficulty: "HARD", seed: "west" },
  },
];

test("human slot plus three authoritative AI seats completes a legal match", () => {
  const result = simulateMatch(
    "human-vs-three-ai",
    undefined,
    40,
    undefined,
    aiPlayers,
  );

  assert.equal(result.illegalActions, 0);
  assert.ok(result.rounds <= 40);
  assert.ok(result.deterministicDigest.length > 0);
});

test("three-AI match integration is deterministic", () => {
  const a = simulateMatch(
    "three-ai-determinism",
    undefined,
    30,
    undefined,
    aiPlayers,
  );
  const b = simulateMatch(
    "three-ai-determinism",
    undefined,
    30,
    undefined,
    aiPlayers,
  );

  assert.deepEqual(a, b);
});

test("1000-match deterministic simulation gate has zero illegal actions", () => {
  const result = simulateMatchBatch({
    seed: "gate-1000",
    games: 1000,
    maxRoundsPerGame: 40,
  });

  assert.equal(result.games, 1000);
  assert.equal(result.illegalActions, 0);
  assert.equal(result.maxRoundTerminations, 0);
  assert.equal(result.finishedMatches, 1000);
});
