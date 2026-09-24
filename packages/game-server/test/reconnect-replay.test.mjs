import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  ServerBoundaryError,
  ServerErrorCode,
} from "../src/index.ts";
import { replayProtocol } from "@sakkah-baloot/game-protocol";

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("disconnect tracks connection state without mutating rules and reconnect resumes missed events", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "reconnect-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "reconnect-seed-1",
  });

  // WEST buys SUN (version 0 -> 1)
  await host.submitCommand({
    matchId: "reconnect-match",
    playerId: "player-west",
    actionId: "west-buy-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  // WEST disconnects
  host.disconnect("player-west");
  const snapAfterDisconnect = host.getSnapshot("player-north");
  assert.equal(
    snapAfterDisconnect.connectionStatus["player-west"],
    "DISCONNECTED",
  );

  // Play 2 cards by WEST and SOUTH (version 2 -> 3 -> 4)
  const c1 = host.getSnapshot("player-west").legalCardIds[0];
  await host.submitCommand({
    matchId: "reconnect-match",
    playerId: "player-west",
    actionId: "play-c1",
    expectedStateVersion: 2,
    payload: {
      type: "PLAY_CARD",
      cardId: c1,
    },
  });

  const c2 = host.getSnapshot("player-south").legalCardIds[0];
  await host.submitCommand({
    matchId: "reconnect-match",
    playerId: "player-south",
    actionId: "play-c2",
    expectedStateVersion: 3,
    payload: {
      type: "PLAY_CARD",
      cardId: c2,
    },
  });

  assert.equal(host.getStateVersion(), 4);

  // WEST reconnects resuming from version 2
  const resumeResult = await host.reconnect("player-west", 2);
  assert.equal(resumeResult.matchId, "reconnect-match");
  assert.equal(resumeResult.playerId, "player-west");
  assert.equal(resumeResult.currentVersion, 4);
  assert.equal(resumeResult.snapshot.connectionStatus["player-west"], "CONNECTED");

  // Missed events should be events at version 3 and 4
  assert.equal(resumeResult.missedEvents.length, 2);
  assert.equal(resumeResult.missedEvents[0].stateVersion, 3);
  assert.equal(resumeResult.missedEvents[1].stateVersion, 4);

  // Reconnect with future version is rejected
  await assert.rejects(
    () => host.reconnect("player-west", 99),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.FUTURE_STATE_VERSION,
  );
});
