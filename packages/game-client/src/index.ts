import {
  createBiddingState,
  createInitialDeal,
  createSeededRandom,
  legalBiddingActions,
  type BiddingAction,
  type BiddingHands,
  type BiddingState,
  type Card,
  type CardId,
  type DealState,
  type Seat,
  DECK,
} from "@sakkah-baloot/game-engine";

export interface LocalPreview {
  readonly dealerSeat: Seat;
  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly playerHand: readonly Card[];
  readonly legalActions: readonly BiddingAction["type"][];
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat: Seat = "NORTH";
  const deal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  const bidding = createBiddingState("ui-preview", dealerSeat);
  const cardsById = new Map<CardId, Card>(DECK.map((card) => [card.id, card]));
  const playerHand = deal.hands.SOUTH.map((id) => cardsById.get(id)).filter((card): card is Card => card !== undefined);
  const hands: BiddingHands = deal.hands;
  const exposedSuit = deal.exposedCardId === null ? null : cardsById.get(deal.exposedCardId)?.suit ?? null;
  const legalActions = legalBiddingActions(bidding, dealerSeat, exposedSuit, hands);

  return { dealerSeat, deal, bidding, playerHand, legalActions };
}
