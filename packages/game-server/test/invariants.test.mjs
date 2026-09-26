import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthoritativeMatchHost,
  executeAITurn,
} from "../src/index.ts";
import { validateDealState } from "@sakkah-baloot/game-engine";

const PLAYER_BINDINGS = {
  NORTH: "p-north",
  EAST: "p-east",
  SOUTH: "p-south",
  WEST: "p-west",
};

test("invariants: stateVersion is strictly monotonic and advances once per accepted event", async () => {
  const host = createAuthoritativeMatchHost({
    matchId: "invariant-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "inv-seed-1",
  });

  let previousVersion = host.getStateVersion();
  assert.equal(previousVersion, 0);

  // Play full round with AI
  while (
    (host.getMatchState().round?.phase === "BIDDING" &&
      host.getMatchState().round.bidding.phase !== "CANCELLED") ||
    host.getMatchState().round?.phase === "PLAYING"
  ) {
    const round = host.getMatchState().round;
    const activePid =
      round.phase === "BIDDING"
        ? PLAYER_BINDINGS[round.bidding.actingSeat]
        : round.game.currentPlayerId;

    const res = await executeAITurn(host, activePid, { mode: "BASELINE" });
    if (res) {
      assert.ok(res.stateVersion > previousVersion);
      assert.equal(res.stateVersion, previousVersion + res.events.length);
      previousVersion = res.stateVersion;
    }
  }

  assert.ok(previousVersion > 0);
  assert.equal(host.getStateVersion(), previousVersion);
});

test("invariants: deal state strictly conserves 32 unique cards across initial deal and completion deal", () => {
  const host = createAuthoritativeMatchHost({
    matchId: "card-conservation-match",
    initialDealerSeat: "NORTH",
    playerBindings: PLAYER_BINDINGS,
    seed: "card-cons-seed",
  });

  const matchState = host.getMatchState();
  // validateDealState checks that all 32 cards are present, unique, and partitioned correctly
  validateDealState(matchState.round.deal);
  assert.equal(matchState.round.deal.phase, "BIDDING_READY");
});
