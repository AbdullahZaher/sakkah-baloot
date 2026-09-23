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

test("endgame solver marks exact false when budget is cut off", () => {
  const multiCardState = {
    ...state(),
    hands: {
      NORTH: [card("CLUBS-A"), card("HEARTS-K")],
      EAST: [card("CLUBS-7"), card("HEARTS-7")],
      SOUTH: [card("DIAMONDS-A"), card("SPADES-A")],
      WEST: [card("DIAMONDS-7"), card("SPADES-7")],
    },
  };

  const decision = solveEndgame(multiCardState, "NORTH", {
    maxRemainingCards: 8,
    maxNodes: 1, // artificially tight node limit
  });

  assert.ok(decision);
  assert.equal(decision.exact, false);
});

test("endgame solver solves 4, 6, 8 card states and agrees with exhaustive search", async () => {
  const { teamOfSeat, cardRawValue, applyCardPlay, getLegalMoves } = await import("@sakkah-baloot/game-engine");

  function exhaustiveOracle(st, rootPlayerId) {
    const rootTeam = teamOfSeat(st.players[rootPlayerId]);
    const memo = new Map();

    function minimaxOracle(s) {
      if (s.phase !== "PLAYING") {
        return s.completedTricks.reduce((score, trick) => {
          const points = trick.plays.reduce(
            (sum, play) => sum + cardRawValue(play.card, s.contract, s.trumpSuit),
            0,
          );
          return score + (teamOfSeat(trick.winnerSeat) === rootTeam ? points : -points);
        }, 0);
      }

      const legal = getLegalMoves(s, s.currentPlayerId);
      if (legal.length === 0) return 0;

      const key = JSON.stringify({
        cp: s.currentPlayerId,
        h: Object.entries(s.hands).map(([k, v]) => [k, v.map(c => c.id).sort()]),
        ct: s.currentTrick.map(p => p.card.id),
      });
      if (memo.has(key)) return memo.get(key);

      const maximizing = teamOfSeat(s.players[s.currentPlayerId]) === rootTeam;
      let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

      for (const move of legal) {
        const next = applyCardPlay(s, s.currentPlayerId, move.cardId);
        const val = minimaxOracle(next);
        best = maximizing ? Math.max(best, val) : Math.min(best, val);
      }

      memo.set(key, best);
      return best;
    }

    const legal = getLegalMoves(st, st.currentPlayerId);
    let bestCard = legal[0]?.cardId;
    let bestVal = Number.NEGATIVE_INFINITY;
    for (const move of legal) {
      const next = applyCardPlay(st, st.currentPlayerId, move.cardId);
      const val = minimaxOracle(next);
      if (val > bestVal || (val === bestVal && move.cardId.localeCompare(bestCard) < 0)) {
        bestVal = val;
        bestCard = move.cardId;
      }
    }
    return { cardId: bestCard, value: bestVal };
  }

  const testStates = [
    // 4-card state
    state(),
    // 6-card state (2 in trick, 4 in hand)
    {
      ...state(),
      hands: {
        NORTH: [card("CLUBS-A")],
        EAST: [card("CLUBS-K")],
        SOUTH: [card("DIAMONDS-A")],
        WEST: [card("DIAMONDS-K")],
      },
      currentTrick: [
        { playerId: "NORTH", seat: "NORTH", card: card("HEARTS-A"), ikaDeclared: false, sequence: 1 },
        { playerId: "EAST", seat: "EAST", card: card("HEARTS-7"), ikaDeclared: false, sequence: 2 },
      ],
    },
    // 8-card state
    {
      ...state(),
      hands: {
        NORTH: [card("CLUBS-A"), card("HEARTS-A")],
        EAST: [card("CLUBS-K"), card("HEARTS-K")],
        SOUTH: [card("DIAMONDS-A"), card("SPADES-A")],
        WEST: [card("DIAMONDS-K"), card("SPADES-K")],
      },
      currentTrick: [],
    },
  ];

  for (const st of testStates) {
    const totalRemaining = Object.values(st.hands).reduce((s, h) => s + h.length, 0) + st.currentTrick.length;
    const decision = solveEndgame(st, "NORTH", {
      maxRemainingCards: totalRemaining,
      maxNodes: 2000,
    });
    const oracle = exhaustiveOracle(st, "NORTH");

    assert.ok(decision);
    assert.equal(decision.exact, true);
    assert.ok(decision.cardId === oracle.cardId || decision.value === oracle.value);
  }
});

