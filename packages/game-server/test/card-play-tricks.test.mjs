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

test("card play validates turn, legality, resolves tricks, and scores complete round", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "card-play-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "deterministic-card-seed-1",
  });

  // WEST buys SUN
  await host.submitCommand({
    matchId: "card-play-match",
    playerId: "player-west",
    actionId: "west-buy-sun",
    expectedStateVersion: 0,
    payload: {
      type: "BID",
      action: { type: "BUY_SUN", actionId: "engine-buy-sun" },
    },
  });

  // 1. Out of turn card play rejected
  const snapSouth = host.getSnapshot("player-south");
  await assert.rejects(
    () =>
      host.submitCommand({
        matchId: "card-play-match",
        playerId: "player-south",
        actionId: "south-out-of-turn",
        expectedStateVersion: host.getStateVersion(),
        payload: {
          type: "PLAY_CARD",
          cardId: snapSouth.ownHand[0].id,
        },
      }),
    (err) =>
      err instanceof ServerBoundaryError &&
      err.code === ServerErrorCode.NOT_YOUR_TURN,
  );

  // 2. Play 1 full trick (4 cards)
  for (let playIndex = 0; playIndex < 4; playIndex++) {
    const matchState = host.getMatchState();
    const activePlayerId = matchState.round.game.currentPlayerId;
    const snap = host.getSnapshot(activePlayerId);
    const legalCards = snap.legalCardIds;
    assert.ok(legalCards.length > 0);

    const version = host.getStateVersion();
    const result = await host.submitCommand({
      matchId: "card-play-match",
      playerId: activePlayerId,
      actionId: `play-card-${playIndex}`,
      expectedStateVersion: version,
      payload: {
        type: "PLAY_CARD",
        cardId: legalCards[0],
      },
    });

    assert.equal(result.success, true);
    if (playIndex === 3) {
      // Trick completed! Events must include PLAY_CARD and TRICK_COMPLETE
      const eventTypes = result.events.map((e) => e.event.type);
      assert.ok(eventTypes.includes("PLAY_CARD"));
      assert.ok(eventTypes.includes("TRICK_COMPLETE"));
    }
  }

  // 3. Play remaining 7 tricks to complete the entire round (8 tricks total)
  let actionCounter = 4;
  while (host.getMatchState().round.phase === "PLAYING") {
    const activePlayerId = host.getMatchState().round.game.currentPlayerId;
    const snap = host.getSnapshot(activePlayerId);
    const legalCards = snap.legalCardIds;
    const version = host.getStateVersion();

    await host.submitCommand({
      matchId: "card-play-match",
      playerId: activePlayerId,
      actionId: `play-card-${actionCounter++}`,
      expectedStateVersion: version,
      payload: {
        type: "PLAY_CARD",
        cardId: legalCards[0],
      },
    });
  }

  const finalMatch = host.getMatchState();
  assert.equal(finalMatch.round.phase, "ROUND_COMPLETE");
  assert.ok(finalMatch.lastRoundScore);
  assert.equal(finalMatch.round.game.completedTricks.length, 8);
  assert.ok(
    finalMatch.score.NORTH_SOUTH > 0 || finalMatch.score.EAST_WEST > 0,
  );
});
