import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  ServerBoundaryError,
  ServerErrorCode,
} from "../src/index.ts";

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("action idempotency returns cached result without advancing stateVersion or appending events", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "idempotency-match-1",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "fixed-seed-456",
  });

  const command = {
    matchId: "idempotency-match-1",
    playerId: "player-west", // WEST acts first when NORTH is dealer
    actionId: "bid-action-1",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "engine-bid-1" },
    },
  };

  const result1 = await host.submitCommand(command);
  assert.equal(result1.success, true);
  assert.equal(result1.stateVersion, 1);
  assert.equal(host.getStateVersion(), 1);
  assert.equal(result1.events.length, 1);

  // Submit exact duplicate command
  const result2 = await host.submitCommand(command);
  assert.equal(result2.success, true);
  assert.equal(result2.cached, true);
  assert.equal(result2.stateVersion, 1);
  assert.equal(host.getStateVersion(), 1); // State version did NOT advance
  assert.deepEqual(result2.events, result1.events); // Same events
});

test("interleaved duplicate action A -> B -> A returns cached result without state mutation", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "idempotency-match-2",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "fixed-seed-456",
  });

  // Action A (WEST: PASS)
  const commandA = {
    matchId: "idempotency-match-2",
    playerId: "player-west",
    actionId: "action-A",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "engine-pass-west" },
    },
  };
  const resultA1 = await host.submitCommand(commandA);
  assert.equal(resultA1.stateVersion, 1);
  assert.equal(host.getStateVersion(), 1);

  // Action B (SOUTH: PASS)
  const commandB = {
    matchId: "idempotency-match-2",
    playerId: "player-south",
    actionId: "action-B",
    expectedStateVersion: 1,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "engine-pass-south" },
    },
  };
  const resultB = await host.submitCommand(commandB);
  assert.equal(resultB.stateVersion, 2);
  assert.equal(host.getStateVersion(), 2);

  // Re-submit Action A
  const resultA2 = await host.submitCommand(commandA);
  assert.equal(resultA2.cached, true);
  assert.equal(resultA2.stateVersion, 1); // Returns original version
  assert.equal(host.getStateVersion(), 2); // Current state remains at version 2
});

test("state version fencing rejects stale and future versions", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "version-fencing-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  // 1. Future state version rejected
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "version-fencing-match",
        playerId: "player-west",
        actionId: "future-action",
        expectedStateVersion: 5, // Host is at 0
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "future-pass" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.FUTURE_STATE_VERSION,
  );

  // Execute valid action at version 0 -> advances host to version 1
  await host.submitCommand({
    matchId: "version-fencing-match",
    playerId: "player-west",
    actionId: "action-v0",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "pass-1" },
    },
  });

  // 2. Stale state version (0 when host is at 1) rejected
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "version-fencing-match",
        playerId: "player-south",
        actionId: "stale-action",
        expectedStateVersion: 0, // Stale!
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "pass-stale" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.STALE_STATE_VERSION,
  );
});

test("match and round identity validation rejects mismatched envelopes", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "identity-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  // Mismatched matchId
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "other-match",
        playerId: "player-west",
        actionId: "bad-match-action",
        expectedStateVersion: 0,
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "pass-bad-match" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.INVALID_MATCH,
  );

  // Mismatched roundId
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "identity-match",
        roundId: "identity-match:round:99",
        playerId: "player-west",
        actionId: "bad-round-action",
        expectedStateVersion: 0,
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "pass-bad-round" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.INVALID_ROUND,
  );

  // Unknown player
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "identity-match",
        playerId: "rogue-player",
        actionId: "rogue-action",
        expectedStateVersion: 0,
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "pass-rogue" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.UNKNOWN_PLAYER,
  );

  // Empty actionId
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "identity-match",
        playerId: "player-west",
        actionId: "   ",
        expectedStateVersion: 0,
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "pass-empty" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.INVALID_ACTION_ID,
  );
});

test("actionId is scoped to player and match preventing cross-player and cross-match collisions", async () => {
  const hostA = createAuthoritativeMatchHost({
    matchId: "match-A",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  const hostB = createAuthoritativeMatchHost({
    matchId: "match-B",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  // Player WEST on host A submits action "shared-action-id"
  const resA = await hostA.submitCommand({
    matchId: "match-A",
    playerId: "player-west",
    actionId: "shared-action-id",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "pass-A" },
    },
  });
  assert.equal(resA.success, true);
  assert.equal(resA.cached, undefined);

  // Player WEST on host B submits action "shared-action-id" -> independent match, not cached
  const resB = await hostB.submitCommand({
    matchId: "match-B",
    playerId: "player-west",
    actionId: "shared-action-id",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "pass-B" },
    },
  });
  assert.equal(resB.success, true);
  assert.equal(resB.cached, undefined);

  // In match A, next player SOUTH submits action "shared-action-id" -> different player, not cached
  const resSouth = await hostA.submitCommand({
    matchId: "match-A",
    playerId: "player-south",
    actionId: "shared-action-id",
    expectedStateVersion: 1,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "pass-south" },
    },
  });
  assert.equal(resSouth.success, true);
  assert.equal(resSouth.cached, undefined);
  assert.equal(hostA.getStateVersion(), 2);
});

