import test from "node:test";
import assert from "node:assert/strict";
import { simulateMatch } from "../src/index.ts";

test("seat policy map is deterministic", () => {
  const first = ({ legalCardIds }) => legalCardIds[0];
  const last = ({ legalCardIds }) => legalCardIds.at(-1);

  const policies = {
    NORTH_PLAYER: first,
    EAST_PLAYER: last,
    SOUTH_PLAYER: first,
    WEST_PLAYER: last,
  };

  const a = simulateMatch("policy-map", first, 20, policies);
  const b = simulateMatch("policy-map", first, 20, policies);

  assert.deepEqual(a, b);
  assert.equal(a.illegalActions, 0);
});
