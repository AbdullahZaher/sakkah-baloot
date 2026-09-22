import type { CardId } from "../cards.js";
import type { GameState } from "../playing/types.js";
import { applyCardPlay } from "../playing/trick-engine.js";
import { assertPlayingStateInvariants } from "../validation/invariants.js";

export type GameEvent =
  | {
      readonly type: "CARD_PLAYED";
      readonly eventId: string;
      readonly playerId: string;
      readonly cardId: CardId;
      readonly ikaDeclared: boolean;
    };

export interface ReplayResult {
  readonly state: GameState;
  readonly appliedEventIds: readonly string[];
}

export function reduceEvent(
  state: GameState,
  event: GameEvent,
  processedEventIds: readonly string[] = [],
): ReplayResult {
  if (processedEventIds.includes(event.eventId)) {
    return { state, appliedEventIds: processedEventIds };
  }

  let next = state;
  switch (event.type) {
    case "CARD_PLAYED":
      next = applyCardPlay(state, event.playerId, event.cardId, event.ikaDeclared);
      break;
    default:
      throw new Error("Unsupported replay event");
  }

  assertPlayingStateInvariants(next);
  return { state: next, appliedEventIds: [...processedEventIds, event.eventId] };
}

export function replay(
  initialState: GameState,
  events: readonly GameEvent[],
): GameState {
  let state = initialState;
  let processed: readonly string[] = [];
  for (const event of events) {
    const result = reduceEvent(state, event, processed);
    state = result.state;
    processed = result.appliedEventIds;
  }
  return state;
}
