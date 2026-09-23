import test from "node:test";
import assert from "node:assert/strict";
import { solveEndgame } from "../dist/index.js";

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

test("endgame solver returns an authoritative legal card", () => {
  const decision = solveEndgame(state(), "NORTH", {
    maxRemainingCards: 4,
    maxNodes: 1000,
  });

  assert.ok(decision);
  assert.equal(decision.cardId, "CLUBS-A");
  assert.equal(decision.exact, true);
  assert.ok(decision.nodes > 0);
});

test("endgame solver defers when threshold is exceeded", () => {
  const decision = solveEndgame(state(), "NORTH", {
    maxRemainingCards: 3,
    maxNodes: 1000,
  });

  assert.equal(decision, null);
});
