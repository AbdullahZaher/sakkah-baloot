import test from "node:test";
import assert from "node:assert/strict";
import { createAuthoritativeMatch } from "../dist/index.js";

test("server room redacts opponent hands", () => {
  const room = createAuthoritativeMatch("server-test", "NORTH");
  const snapshot = room.getSnapshot("NORTH_PLAYER");

  assert.equal(snapshot.player.hand.length, 5);
  assert.equal(snapshot.player.seat, "NORTH");
  assert.equal(JSON.stringify(snapshot).includes("initialHands"), false);
  assert.equal(JSON.stringify(snapshot).includes("completionHands"), false);
  assert.equal(snapshot.player.legalCardIds.length, 0);
});

test("server room enforces optimistic state version", () => {
  const room = createAuthoritativeMatch("version-test", "NORTH");
  const snapshot = room.getSnapshot("NORTH_PLAYER");

  assert.throws(
    () => room.submitBid("NORTH_PLAYER", snapshot.stateVersion + 1, { type: "PASS", actionId: "stale" }),
    /STALE_STATE_VERSION/,
  );
});

test("server room exposes only authoritative legal bidding actions", () => {
  const room = createAuthoritativeMatch("bid-test", "NORTH");
  const snapshot = room.getSnapshot("NORTH_PLAYER");

  assert.ok(snapshot.player.legalBiddingActions.length > 0);
  assert.equal(snapshot.player.legalCardIds.length, 0);
});
