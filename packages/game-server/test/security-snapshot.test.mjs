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

test("player snapshot contains only own hand and redacts opponent cards and hidden deck", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "security-match-1",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "sec-seed-789",
  });

  const snapshotEast = host.getSnapshot("player-east");
  const snapshotSouth = host.getSnapshot("player-south");

  assert.equal(snapshotEast.playerId, "player-east");
  assert.equal(snapshotEast.playerSeat, "EAST");
  assert.equal(snapshotEast.ownHand.length, 5);

  // Collect private card IDs of South, West, North
  const southCards = snapshotSouth.ownHand.map((c) => c.id);
  const jsonEast = JSON.stringify(snapshotEast);

  // Verify that NONE of South's private cards appear anywhere in East's JSON payload
  for (const southCardId of southCards) {
    assert.equal(
      jsonEast.includes(`"${southCardId}"`),
      false,
      `Secret leak! Opponent card ${southCardId} found in player East snapshot`,
    );
  }

  // Verify that only card counts are exposed for opponents
  assert.equal(snapshotEast.opponentCardCounts.NORTH, 5);
  assert.equal(snapshotEast.opponentCardCounts.SOUTH, 5);
  assert.equal(snapshotEast.opponentCardCounts.WEST, 5);
  assert.equal(snapshotEast.opponentCardCounts.EAST, 5);

  // Verify that internal deal transcript or hidden deck order is not leaked
  assert.equal(jsonEast.includes("initialDeckOrder"), false);
  assert.equal(jsonEast.includes("initialHands"), false);
  assert.equal(jsonEast.includes("completionHands"), false);
});

test("snapshot in PLAYING phase exposes only own 8 cards and public plays", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "security-match-playing",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "sec-seed-playing",
  });

  // WEST buys SUN
  await host.submitCommand({
    matchId: "security-match-playing",
    playerId: "player-west",
    actionId: "buy-sun-action",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  const snapshotNorth = host.getSnapshot("player-north");
  const snapshotWest = host.getSnapshot("player-west");

  assert.equal(snapshotNorth.ownHand.length, 8);
  assert.equal(snapshotWest.ownHand.length, 8);

  const westCardIds = snapshotWest.ownHand.map((c) => c.id);
  const northCardIds = snapshotNorth.ownHand.map((c) => c.id);

  const jsonNorth = JSON.stringify(snapshotNorth);

  // Check that all unplayed West cards (not shared with North) do not appear in North's snapshot
  for (const westCardId of westCardIds) {
    if (!northCardIds.includes(westCardId)) {
      assert.equal(
        jsonNorth.includes(`"${westCardId}"`),
        false,
        `Secret leak! West card ${westCardId} found in North snapshot`,
      );
    }
  }
});

test("snapshot exposes legal actions only to the active player", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "security-match-turns",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
  });

  const snapWest = host.getSnapshot("player-west");
  const snapSouth = host.getSnapshot("player-south");

  // WEST acts first
  assert.ok(snapWest.legalBiddingActions.length > 0);
  // SOUTH is not active yet -> empty legal actions
  assert.equal(snapSouth.legalBiddingActions.length, 0);
});
