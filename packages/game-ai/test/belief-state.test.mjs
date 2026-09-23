import test from "node:test";
import assert from "node:assert/strict";
import {
  createBeliefState,
  sampleBeliefWorlds,
} from "../dist/index.js";

function card(id) {
  const [suit, rank] = id.split("-");
  return { id, suit, rank };
}

function inputState() {
  const ownHand = [
    card("CLUBS-A"),
    card("CLUBS-K"),
    card("DIAMONDS-A"),
    card("DIAMONDS-K"),
    card("HEARTS-A"),
    card("HEARTS-K"),
    card("SPADES-A"),
  ];

  return {
    playerId: "P1",
    ownHand,
    game: {
      players: {
        P1: "NORTH",
        P2: "EAST",
        P3: "SOUTH",
        P4: "WEST",
      },
      hands: {
        P1: ownHand,
        P2: Array(7).fill(card("HIDDEN-2")),
        P3: Array(7).fill(card("HIDDEN-3")),
        P4: Array(7).fill(card("HIDDEN-4")),
      },
      completedTricks: [{
        trickNumber: 1,
        leaderSeat: "NORTH",
        plays: [
          { playerId: "P1", seat: "NORTH", card: card("HEARTS-10"), ikaDeclared: false, sequence: 1 },
          { playerId: "P2", seat: "EAST", card: card("CLUBS-7"), ikaDeclared: false, sequence: 2 },
          { playerId: "P3", seat: "SOUTH", card: card("HEARTS-7"), ikaDeclared: false, sequence: 3 },
          { playerId: "P4", seat: "WEST", card: card("HEARTS-8"), ikaDeclared: false, sequence: 4 },
        ],
        winnerSeat: "P1",
      }],
      currentTrick: [],
    },
    contract: "SUN",
    trumpSuit: null,
  };
}

test("belief state records a public void-suit observation", () => {
  const belief = createBeliefState(inputState());

  assert.deepEqual(belief.voidSuits.P2, ["HEARTS"]);
  assert.equal(
    belief.observations.some(
      (item) =>
        item.type === "VOID_SUIT" &&
        item.playerId === "P2" &&
        item.suit === "HEARTS",
    ),
    true,
  );
});

test("belief worlds respect inferred void suits", () => {
  const input = inputState();
  const belief = createBeliefState(input);
  const samples = sampleBeliefWorlds(input, belief, 12, "belief-seed");

  for (const sample of samples) {
    assert.equal(
      sample.world.hands.P2.some((card) => card.suit === "HEARTS"),
      false,
    );
    assert.equal(sample.weight, 1 / samples.length);
  }
});
