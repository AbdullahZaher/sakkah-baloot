import {
  createBiddingState,
  createInitialDeal,
  createSeededRandom,
  type BiddingState,
  type DealState,
  type Seat,
  DECK,
} from "@sakkah-baloot/game-engine";

export interface LocalPreview {
  readonly dealerSeat: Seat;
  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly playerHand: readonly string[];
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat = "NORTH" as Seat;
  const deal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  const bidding = createBiddingState("ui-preview", dealerSeat);

  return {
    dealerSeat,
    deal,
    bidding,
    playerHand: deal.hands.SOUTH.map((id) => DECK.find((card) => card.id === id)?.id ?? id),
  };
}
