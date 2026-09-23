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

export interface LocalBiddingSession extends LocalPreview {
  readonly dispatchBiddingAction: (type: BiddingAction["type"], suit?: Suit) => void;
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(DECK.map((card) => [card.id, card])) as Record<CardId, Card>;
}

function cardsById(): Map<CardId, Card> {
  return new Map(DECK.map((card) => [card.id, card]));
}

function buildPreview(
  dealerSeat: Seat,
  playerSeat: Seat,
  deal: DealState,
  bidding: BiddingState,
): LocalPreview {
  const cards = cardsById();
  const playerHand = deal.hands[playerSeat]
    .map((id) => cards.get(id))
    .filter((card): card is Card => card !== undefined);
  const exposedCard = deal.exposedCardId === null ? null : cards.get(deal.exposedCardId) ?? null;
  const legalActions = legalBiddingActions(
    bidding,
    dealerSeat,
    exposedCard?.suit ?? null,
    deal.hands,
  );

  return { dealerSeat, deal, bidding, playerSeat, playerHand, exposedCard, legalActions };
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "SOUTH";
  const deal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  const bidding = createBiddingState("ui-preview", dealerSeat);
  return buildPreview(dealerSeat, playerSeat, deal, bidding);
}

export function createLocalBiddingSession(): LocalBiddingSession {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "WEST";
  const initialDeal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  let deal = initialDeal;
  let bidding = createBiddingState("ui-preview", dealerSeat);

  const session: LocalBiddingSession = {
    ...buildPreview(dealerSeat, playerSeat, deal, bidding),
    dispatchBiddingAction: (type, suit) => {
      const action: BiddingAction =
        type === "BUY_HOKUM"
          ? { type, actionId: `ui-${bidding.turnNumber + 1}-${type}-${suit ?? "NONE"}`, suit: suit ?? "CLUBS" }
          : { type, actionId: `ui-${bidding.turnNumber + 1}-${type}` };

      bidding = applyBiddingAction(
        bidding,
        action,
        dealerSeat,
        deal.exposedCardId,
        cardMap(),
        deal.hands as BiddingHands,
      );
      if (bidding.phase === "CONTRACT_SELECTED") {
        deal = {
          ...deal,
          exposedCardId: deal.exposedCardId,
        };
      }

      Object.assign(session, buildPreview(dealerSeat, playerSeat, deal, bidding));
    },
  };

  return session;
}
