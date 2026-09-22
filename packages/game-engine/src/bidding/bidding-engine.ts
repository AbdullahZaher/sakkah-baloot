import type { CardId, Suit } from "../cards.js";
import type { Seat } from "../rules/types.js";
import { SEATS } from "../rules/types.js";
import type { Contract, RoundId } from "../rules/types.js";
import {
  nextCounterClockwise,
  previousCounterClockwise,
  partnerOfSeat,
} from "../rules/profile.js";
import type { DealState } from "../dealing/deal-engine.js";
import { completeDeal } from "../dealing/deal-engine.js";

export type BiddingPhase = "FIRST_ROUND" | "SECOND_ROUND" | "CONTRACT_SELECTED" | "CANCELLED";

export type BiddingAction =
  | { readonly type: "PASS"; readonly actionId: string }
  | { readonly type: "BUY_HOKUM_EXPOSED"; readonly actionId: string }
  | { readonly type: "BUY_SUN"; readonly actionId: string }
  | { readonly type: "BUY_ASHKAL"; readonly actionId: string }
  | { readonly type: "BUY_HOKUM"; readonly actionId: string; readonly suit: Suit };

export interface SelectedContract {
  readonly contract: Contract;
  readonly purchaserSeat: Seat;
  readonly source: "FIRST_ROUND" | "SECOND_ROUND";
  readonly trumpSuit: Suit | null;
  readonly mode: "NORMAL" | "ASHKAL";
  readonly exposedCardReceiverSeat: Seat;
}

export interface BiddingActionRecord {
  readonly actionId: string;
  readonly turnNumber: number;
  readonly seat: Seat;
  readonly phase: "FIRST_ROUND" | "SECOND_ROUND";
  readonly action: BiddingAction["type"];
  readonly stateVersion: number;
}

export interface BiddingState {
  readonly roundId: RoundId;
  readonly phase: BiddingPhase;
  readonly actingSeat: Seat;
  readonly turnNumber: number;
  readonly passCount: number;
  readonly stateVersion: number;
  readonly selectedContract: SelectedContract | null;
  readonly history: readonly BiddingActionRecord[];
  readonly processedActionIds: readonly string[];
}

export function createBiddingState(
  roundId: RoundId,
  dealerSeat: Seat,
): BiddingState {
  return {
    roundId,
    phase: "FIRST_ROUND",
    actingSeat: nextCounterClockwise(dealerSeat),
    turnNumber: 0,
    passCount: 0,
    stateVersion: 0,
    selectedContract: null,
    history: [],
    processedActionIds: [],
  };
}

function hasProcessed(state: BiddingState, actionId: string): boolean {
  return state.processedActionIds.includes(actionId);
}

function firstRoundAshkalEligible(seat: Seat, dealerSeat: Seat): boolean {
  return seat === dealerSeat || seat === previousCounterClockwise(dealerSeat);
}

function advanceSeat(seat: Seat): Seat {
  return nextCounterClockwise(seat);
}

function nextTurn(
  state: BiddingState,
  dealerSeat: Seat,
  action: BiddingAction,
): BiddingState {
  const nextTurnNumber = state.turnNumber + 1;
  const historyRecord: BiddingActionRecord = {
    actionId: action.actionId,
    turnNumber: state.turnNumber,
    seat: state.actingSeat,
    phase: state.phase as "FIRST_ROUND" | "SECOND_ROUND",
    action: action.type,
    stateVersion: state.stateVersion + 1,
  };

  return {
    ...state,
    actingSeat: advanceSeat(state.actingSeat),
    turnNumber: nextTurnNumber,
    stateVersion: state.stateVersion + 1,
    history: [...state.history, historyRecord],
    processedActionIds: [...state.processedActionIds, action.actionId],
    passCount: state.passCount + 1,
  };
}

function selectContract(
  state: BiddingState,
  action: BiddingAction,
  contract: SelectedContract,
): BiddingState {
  const record: BiddingActionRecord = {
    actionId: action.actionId,
    turnNumber: state.turnNumber,
    seat: state.actingSeat,
    phase: state.phase as "FIRST_ROUND" | "SECOND_ROUND",
    action: action.type,
    stateVersion: state.stateVersion + 1,
  };

  return {
    ...state,
    phase: "CONTRACT_SELECTED",
    selectedContract: contract,
    stateVersion: state.stateVersion + 1,
    history: [...state.history, record],
    processedActionIds: [...state.processedActionIds, action.actionId],
  };
}

export function legalBiddingActions(
  state: BiddingState,
  dealerSeat: Seat,
  exposedSuit: Suit | null,
): readonly BiddingAction["type"][] {
  if (state.phase !== "FIRST_ROUND" && state.phase !== "SECOND_ROUND") return [];
  const actions: BiddingAction["type"][] = ["PASS", "BUY_SUN"];
  if (state.phase === "FIRST_ROUND") {
    if (exposedSuit !== null) actions.push("BUY_HOKUM_EXPOSED");
    if (firstRoundAshkalEligible(state.actingSeat, dealerSeat)) actions.push("BUY_ASHKAL");
  } else {
    for (const suit of ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const) {
      if (suit !== exposedSuit) actions.push("BUY_HOKUM");
    }
  }
  return actions;
}

export function applyBiddingAction(
  state: BiddingState,
  action: BiddingAction,
  dealerSeat: Seat,
  exposedCardId: CardId | null,
  cards: Readonly<Record<CardId, { readonly suit: Suit }>>,
): BiddingState {
  if (state.phase !== "FIRST_ROUND" && state.phase !== "SECOND_ROUND") {
    throw new Error("Bidding is not active");
  }
  if (hasProcessed(state, action.actionId)) return state;

  const exposedSuit = exposedCardId === null ? null : cards[exposedCardId]?.suit ?? null;
  if (state.actingSeat === undefined) throw new Error("Missing acting seat");

  if (action.type === "PASS") {
    const next = nextTurn(state, dealerSeat, action);
    if (state.phase === "FIRST_ROUND" && next.passCount >= SEATS.length) {
      return {
        ...next,
        phase: "SECOND_ROUND",
        actingSeat: nextCounterClockwise(dealerSeat),
        passCount: 0,
      };
    }
    if (state.phase === "SECOND_ROUND" && next.passCount >= SEATS.length) {
      return { ...next, phase: "CANCELLED" };
    }
    return next;
  }

  if (state.phase === "FIRST_ROUND") {
    if (action.type === "BUY_HOKUM_EXPOSED") {
      if (exposedSuit === null) throw new Error("No exposed card");
      return selectContract(state, action, {
        contract: "HOKUM",
        purchaserSeat: state.actingSeat,
        source: "FIRST_ROUND",
        trumpSuit: exposedSuit,
        mode: "NORMAL",
        exposedCardReceiverSeat: state.actingSeat,
      });
    }

    if (action.type === "BUY_SUN") {
      return selectContract(state, action, {
        contract: "SUN",
        purchaserSeat: state.actingSeat,
        source: "FIRST_ROUND",
        trumpSuit: null,
        mode: "NORMAL",
        exposedCardReceiverSeat: state.actingSeat,
      });
    }

    if (action.type === "BUY_ASHKAL") {
      if (!firstRoundAshkalEligible(state.actingSeat, dealerSeat)) {
        throw new Error("Ashkal is not eligible for this seat");
      }
      return selectContract(state, action, {
        contract: "SUN",
        purchaserSeat: state.actingSeat,
        source: "FIRST_ROUND",
        trumpSuit: null,
        mode: "ASHKAL",
        exposedCardReceiverSeat: partnerOfSeat(state.actingSeat),
      });
    }

    throw new Error("Invalid first-round action");
  }

  if (action.type === "BUY_HOKUM") {
    if (action.suit === exposedSuit) throw new Error("Second-round Hokum must differ from exposed suit");
    return selectContract(state, action, {
      contract: "HOKUM",
      purchaserSeat: state.actingSeat,
      source: "SECOND_ROUND",
      trumpSuit: action.suit,
      mode: "NORMAL",
      exposedCardReceiverSeat: state.actingSeat,
    });
  }

  if (action.type === "BUY_SUN") {
    return selectContract(state, action, {
      contract: "SUN",
      purchaserSeat: state.actingSeat,
      source: "SECOND_ROUND",
      trumpSuit: null,
      mode: "NORMAL",
      exposedCardReceiverSeat: state.actingSeat,
    });
  }

  throw new Error("Invalid second-round action");
}

export function finalizeBiddingDeal(
  deal: DealState,
  bidding: BiddingState,
): DealState {
  if (bidding.phase !== "CONTRACT_SELECTED" || bidding.selectedContract === null) {
    throw new Error("Contract is not selected");
  }
  return completeDeal(deal, bidding.selectedContract.exposedCardReceiverSeat);
}
