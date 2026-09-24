import test from "node:test";
import assert from "node:assert/strict";
import { createAuthoritativeMatchHost, ServerBoundaryError, ServerErrorCode } from "../src/index.ts";

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("match creation initializes stateVersion at 0 with deterministic initial deal", () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-match-1",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "fixed-seed-123",
  });

  assert.equal(host.matchId, "test-match-1");
  assert.equal(host.getStateVersion(), 0);

  const matchState = host.getMatchState();
  assert.equal(matchState.stateVersion, 0);
  assert.equal(matchState.roundNumber, 1);
  assert.equal(matchState.dealerSeat, "NORTH");
  assert.equal(matchState.phase, "ROUND_ACTIVE");
  assert.deepEqual(matchState.score, { NORTH_SOUTH: 0, EAST_WEST: 0 });

  assert.ok(matchState.round);
  assert.equal(matchState.round.phase, "BIDDING");
  assert.equal(matchState.round.bidding.actingSeat, "WEST"); // dealer is NORTH, CCW order is NORTH -> WEST -> SOUTH -> EAST

  // All players have 5 cards in bidding phase
  for (const seat of ["NORTH", "EAST", "SOUTH", "WEST"]) {
    assert.equal(matchState.round.deal.hands[seat].length, 5);
  }
  assert.ok(matchState.round.deal.exposedCardId);
});

test("seat router maps players to seats and prevents duplicates or unknown players", () => {
  const host = createAuthoritativeMatchHost({
    matchId: "test-match-2",
    playerBindings: PLAYER_BINDINGS,
  });

  assert.equal(host.getPlayerSeat("player-north"), "NORTH");
  assert.equal(host.getPlayerSeat("player-east"), "EAST");
  assert.equal(host.getPlayerSeat("player-south"), "SOUTH");
  assert.equal(host.getPlayerSeat("player-west"), "WEST");

  assert.throws(
    () => host.getPlayerSeat("unknown-player"),
    (err) => err instanceof ServerBoundaryError && err.code === ServerErrorCode.UNKNOWN_PLAYER,
  );

  // Duplicate player seated at multiple seats is rejected
  assert.throws(
    () =>
      createAuthoritativeMatchHost({
        matchId: "test-dup",
        playerBindings: {
          NORTH: "player-1",
          EAST: "player-1",
          SOUTH: "player-2",
          WEST: "player-3",
        },
      }),
    (err) => err instanceof ServerBoundaryError && err.code === ServerErrorCode.PLAYER_ALREADY_SEATED,
  );
});
