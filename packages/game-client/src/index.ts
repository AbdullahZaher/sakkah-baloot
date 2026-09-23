import {
  applyBiddingAction,
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
  type Suit,
  DECK,
} from "@sakkah-baloot/game-engine";

export interface LocalPreview {
  readonly dealerSeat: Seat;
  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly playerSeat: Seat;
  readonly playerHand: readonly Card[];
  readonly exposedCard: Card | null;
  readonly legalActions: readonly BiddingAction["type"][];
}

export interface LocalBiddingSession {
  readonly getSnapshot: () => LocalPreview;
  readonly dispatchBiddingAction: (type: BiddingAction["type"], suit?: Suit) => LocalPreview;
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(DECK.map((card) => [card.id, card])) as Record<CardId, Card>;
}

function cardsById(): Map<CardId, Card> {
  return new Map(DECK.map((card) => [card.id, card]));
}

function buildPreview(dealerSeat: Seat, playerSeat: Seat, deal: DealState, bidding: BiddingState): LocalPreview {
  const cards = cardsById();
  const playerHand = deal.hands[playerSeat].map((id) => cards.get(id)).filter((card): card is Card => card !== undefined);
  const exposedCard = deal.exposedCardId === null ? null : cards.get(deal.exposedCardId) ?? null;
  const legalActions = legalBiddingActions(bidding, dealerSeat, exposedCard?.suit ?? null, deal.hands);
  return { dealerSeat, deal, bidding, playerSeat, playerHand, exposedCard, legalActions };
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "SOUTH";
  return buildPreview(
    dealerSeat,
    playerSeat,
    createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview")),
    createBiddingState("ui-preview", dealerSeat),
  );
}

export function createLocalBiddingSession(): LocalBiddingSession {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "WEST";
  let deal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  let bidding = createBiddingState("ui-preview", dealerSeat);

  const getSnapshot = () => buildPreview(dealerSeat, playerSeat, deal, bidding);

  return {
    getSnapshot,
    dispatchBiddingAction: (type, suit) => {
      const snapshot = getSnapshot();
      if (!snapshot.legalActions.includes(type)) throw new Error(`Illegal bidding action: ${type}`);

      const action: BiddingAction = type === "BUY_HOKUM"
        ? { type, actionId: `ui-${bidding.turnNumber + 1}-${type}-${suit ?? "NONE"}`, suit: suit ?? "CLUBS" }
        : { type, actionId: `ui-${bidding.turnNumber + 1}-${type}` };

      bidding = applyBiddingAction(bidding, action, dealerSeat, deal.exposedCardId, cardMap(), deal.hands as BiddingHands);
      return getSnapshot();
    },
  };
}
