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

test("bidding enforces turn order and rejects out-of-turn bids", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "bidding-order-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  // NORTH is dealer -> CCW first actor is WEST.
  // SOUTH trying to bid out of turn must be rejected
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "bidding-order-match",
        playerId: "player-south",
        actionId: "out-of-turn-bid",
        expectedStateVersion: 0,
        payload: {
          type: "BID",
          action: { type: "PASS", actionId: "engine-pass-south" },
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.NOT_YOUR_TURN,
  );

  // WEST bids PASS -> accepted, advances to SOUTH
  const res1 = await host.submitCommand({
    matchId: "bidding-order-match",
    playerId: "player-west",
    actionId: "bid-west-pass",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "engine-pass-west" },
    },
  });
  assert.equal(res1.success, true);
  assert.equal(host.getStateVersion(), 1);

  // SOUTH now acts
  const res2 = await host.submitCommand({
    matchId: "bidding-order-match",
    playerId: "player-south",
    actionId: "bid-south-pass",
    expectedStateVersion: 1,
    payload: {
      type: "BID",
      action: { type: "PASS", actionId: "engine-pass-south" },
    },
  });
  assert.equal(res2.success, true);
  assert.equal(host.getStateVersion(), 2);
});

test("contract purchase completes deal and transitions to PLAYING phase", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "bidding-buy-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "fixed-seed-sun",
  });

  // WEST buys SUN in first round
  const res = await host.submitCommand({
    matchId: "bidding-buy-match",
    playerId: "player-west",
    actionId: "bid-west-buy-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  assert.equal(res.success, true);
  const matchState = host.getMatchState();
  assert.equal(matchState.round.phase, "PLAYING");
  assert.ok(matchState.round.game);
  assert.equal(matchState.round.game.contract, "SUN");
  assert.equal(matchState.round.game.phase, "PLAYING");

  // All 4 players now have exactly 8 cards
  for (const pid of Object.values(PLAYER_BINDINGS)) {
    assert.equal(matchState.round.game.hands[pid].length, 8);
  }

  // Next acting player in playing phase is WEST (dealer-right of NORTH)
  assert.equal(matchState.round.game.currentPlayerId, "player-west");
});

test("all-pass in second round triggers cancellation and new deal with rotated dealer", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "bidding-all-pass-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "fixed-seed-all-pass",
  });

  // 8 consecutive PASS actions in CCW order: WEST -> SOUTH -> EAST -> NORTH
  const order = [
    "player-west",
    "player-south",
    "player-east",
    "player-north",
    "player-west",
    "player-south",
    "player-east",
    "player-north",
  ];

  for (let i = 0; i < order.length; i++) {
    const pid = order[i];
    const version = host.getStateVersion();
    await host.submitCommand({
      matchId: "bidding-all-pass-match",
      playerId: pid,
      actionId: `pass-action-${i}`,
      expectedStateVersion: version,
      payload: {
        type: "BID",
        action: { type: "PASS", actionId: `engine-pass-${i}` },
      },
    });
  }

  const matchState = host.getMatchState();
  // Round should have been re-dealt with dealer rotated from NORTH to WEST (in CCW order)
  assert.equal(matchState.dealerSeat, "WEST");
  assert.equal(matchState.roundNumber, 2);
  assert.equal(matchState.round.phase, "BIDDING");
});
