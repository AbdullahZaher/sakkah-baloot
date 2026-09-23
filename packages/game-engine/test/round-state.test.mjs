import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialDeal,
  createBiddingState,
  createRoundState,
  withRoundGame,
  withRoundProjects,
  withRoundBaloot,
  completeRoundState,
  createSeededRandom,
  createMatchState,
} from "../dist/index.js";

const players = {
  NORTH_PLAYER: "NORTH",
  EAST_PLAYER: "EAST",
  SOUTH_PLAYER: "SOUTH",
  WEST_PLAYER: "WEST",
};

function makeRound() {
  const roundId = "round-state-test:round:1";
  const dealerSeat = "NORTH";
  const deal = createInitialDeal(roundId, dealerSeat, createSeededRandom(roundId));
  const bidding = createBiddingState(roundId, dealerSeat);
  return createRoundState(deal, bidding, 1);
}

test("RoundState owns deal, bidding, game, projects, Baloot, and score", () => {
  const round = makeRound();

  assert.equal(round.phase, "BIDDING");
  assert.equal(round.deal.roundId, round.roundId);
  assert.equal(round.bidding.roundId, round.roundId);
  assert.equal(round.game, null);
  assert.deepEqual(round.projects, []);
  assert.equal(round.baloot, null);
  assert.equal(round.score, null);
});

test("RoundState transitions are guarded by canonical lifecycle phases", () => {
  const round = makeRound();

  const game = {
    phase: "PLAYING",
    currentPlayerId: "WEST_PLAYER",
    players,
    hands: {
      NORTH_PLAYER: [],
      EAST_PLAYER: [],
      SOUTH_PLAYER: [],
      WEST_PLAYER: [],
    },
    contract: "SUN",
    trumpSuit: null,
    hokumPlayMode: "OPEN",
    dealerSeat: "NORTH",
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };

  const playing = withRoundGame(round, game);
  assert.equal(playing.phase, "PLAYING");

  const withProjects = withRoundProjects(playing, []);
  assert.deepEqual(withProjects.projects, []);

  assert.throws(() => withRoundGame(playing, game), /BIDDING/);
  assert.throws(() => withRoundProjects(round, []), /active playing round/);
  assert.throws(() => withRoundBaloot(round, {}), /active playing round/);
});

test("MatchState can carry an authoritative RoundState", () => {
  const round = makeRound();
  const match = createMatchState("round-state-test", "NORTH", 1, round);

  assert.equal(match.round?.roundId, round.roundId);
  assert.equal(match.round?.dealerSeat, "NORTH");
  assert.equal(match.stateVersion, 0);
});
