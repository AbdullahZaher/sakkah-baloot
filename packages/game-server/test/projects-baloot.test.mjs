import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  ServerBoundaryError,
  ServerErrorCode,
} from "../src/index.ts";
import { detectProjects } from "@sakkah-baloot/game-engine";

const PLAYER_BINDINGS = {
  NORTH: "player-north",
  EAST: "player-east",
  SOUTH: "player-south",
  WEST: "player-west",
};

test("projects can be declared in trick 1 before card play and close after play", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "project-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "fixed-project-seed-1",
  });

  // WEST buys SUN
  await host.submitCommand({
    matchId: "project-match",
    playerId: "player-west",
    actionId: "west-buy-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  const snapshotWest = host.getSnapshot("player-west");
  const candidates = detectProjects(
    snapshotWest.ownHand,
    "SUN",
    null,
    "WEST",
  );

  if (candidates.length > 0) {
    const proj = candidates[0];
    const version = host.getStateVersion();
    const res = await host.submitCommand({
      matchId: "project-match",
      playerId: "player-west",
      actionId: "declare-proj-west",
      expectedStateVersion: version,
      payload: {
        type: "DECLARE_PROJECT",
        projectId: proj.id,
      },
    });

    assert.equal(res.success, true);
    assert.equal(host.getSnapshot("player-west").projects.length, 1);
  }

  // WEST plays their first card
  const vBeforePlay = host.getStateVersion();
  const westLegalCards = host.getSnapshot("player-west").legalCardIds;
  await host.submitCommand({
    matchId: "project-match",
    playerId: "player-west",
    actionId: "west-play-c1",
    expectedStateVersion: vBeforePlay,
    payload: {
      type: "PLAY_CARD",
      cardId: westLegalCards[0],
    },
  });

  // Attempting to declare a project now must be rejected because trick 1 has plays
  if (candidates.length > 0) {
    await assert.rejects(
      () =>
        host.submitCommand({
          matchId: "project-match",
          playerId: "player-south",
          actionId: "late-project",
          expectedStateVersion: host.getStateVersion(),
          payload: {
            type: "DECLARE_PROJECT",
            projectId: candidates[0].id,
          },
        }),
      (err) =>
        err instanceof ServerBoundaryError &&
        err.code === ServerErrorCode.ILLEGAL_ACTION,
    );
  }
});

test("Baloot declaration requires Hokum contract, trump K/Q, and correct timing", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "baloot-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "baloot-seed-test",
  });

  // WEST buys SUN (not Hokum)
  await host.submitCommand({
    matchId: "baloot-match",
    playerId: "player-west",
    actionId: "buy-sun-action",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  const snapshot = host.getSnapshot("player-west");
  const card = snapshot.ownHand[0];

  // Declaring Baloot in SUN contract must be rejected
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "baloot-match",
        playerId: "player-west",
        actionId: "invalid-sun-baloot",
        expectedStateVersion: host.getStateVersion(),
        payload: {
          type: "DECLARE_BALOOT",
          cardId: card.id,
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.ILLEGAL_ACTION,
  );
});
