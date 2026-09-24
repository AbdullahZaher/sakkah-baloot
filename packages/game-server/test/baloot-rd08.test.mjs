import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  ServerBoundaryError,
  ServerErrorCode,
} from "../src/index.ts";
import {
  canDeclareBaloot,
  declareBaloot,
  isBalootAbsorbedByHundred,
  DECK,
} from "@sakkah-baloot/game-engine";

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("RD-08 Baloot: canDeclareBaloot requires Hokum contract, trump K/Q, and second K/Q play", () => {
  const kingHearts = DECK.find((c) => c.suit === "HEARTS" && c.rank === "K");
  const queenHearts = DECK.find((c) => c.suit === "HEARTS" && c.rank === "Q");
  const kingSpades = DECK.find((c) => c.suit === "SPADES" && c.rank === "K");

  assert.ok(kingHearts);
  assert.ok(queenHearts);
  assert.ok(kingSpades);

  // 1. In Sun contract -> always false
  assert.equal(
    canDeclareBaloot("SUN", null, "WEST", queenHearts, [kingHearts], true),
    false,
  );

  // 2. In Hokum contract, but non-trump suit -> false
  assert.equal(
    canDeclareBaloot("HOKUM", "SPADES", "WEST", queenHearts, [kingHearts], true),
    false,
  );

  // 3. In Hokum contract with trump K/Q when King was already played and Queen is being played -> true
  assert.equal(
    canDeclareBaloot("HOKUM", "HEARTS", "WEST", queenHearts, [kingHearts], true),
    true,
  );

  // 4. In Hokum contract with trump K/Q when Queen was already played and King is being played -> true
  assert.equal(
    canDeclareBaloot("HOKUM", "HEARTS", "WEST", kingHearts, [queenHearts], true),
    true,
  );

  // 5. If neither K nor Q was already played by player -> false
  assert.equal(
    canDeclareBaloot("HOKUM", "HEARTS", "WEST", queenHearts, [], true),
    false,
  );

  // 6. If after card commit (beforeCommit = false) -> false
  assert.equal(
    canDeclareBaloot("HOKUM", "HEARTS", "WEST", queenHearts, [kingHearts], false),
    false,
  );
});

test("RD-08 Baloot: hundred absorption rule", () => {
  const king = DECK.find((c) => c.suit === "HEARTS" && c.rank === "K");
  const queen = DECK.find((c) => c.suit === "HEARTS" && c.rank === "Q");

  const baloot = declareBaloot("baloot-1", "WEST", "HEARTS", king, queen);

  // Hundred containing trump 10, J, Q, K, A absorbs the Baloot
  const hundredWithBoth = ["HEARTS-10", "HEARTS-J", "HEARTS-Q", "HEARTS-K", "HEARTS-A"];
  assert.equal(isBalootAbsorbedByHundred(baloot, hundredWithBoth), true);

  // Hundred in another suit or without both does NOT absorb
  const hundredOtherSuit = ["SPADES-10", "SPADES-J", "SPADES-Q", "SPADES-K", "SPADES-A"];
  assert.equal(isBalootAbsorbedByHundred(baloot, hundredOtherSuit), false);
});
