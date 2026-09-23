import test from "node:test";
import assert from "node:assert/strict";
import {
  simulateCardPlayRound,
  simulateBatch,
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

  assert.equal(result.final.phase, "ROUND_COMPLETE");
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
  assert.equal(a.completed, 100);
  assert.equal(a.illegalActions, 0);
});
