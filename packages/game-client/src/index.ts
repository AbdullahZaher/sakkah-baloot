import {
  applyBiddingAction,
  applyCardPlay,
  completeDeal,
  createBiddingState,
  createInitialDeal,
  createSeededRandom,
  getLegalMoves,
  legalBiddingActions,
  type BiddingAction,
  type BiddingHands,
  type BiddingState,
  type Card,
  type CardId,
  type DealState,
  type GameState,
  type PlayerId,
  type Seat,
  type Suit,
  DECK,
} from "@sakkah-baloot/game-engine";

const PLAYER_IDS: Readonly<Record<Seat, PlayerId>> = {
  NORTH: "NORTH_PLAYER",
  EAST: "EAST_PLAYER",
  SOUTH: "SOUTH_PLAYER",
  WEST: "WEST_PLAYER",
};

export interface LocalPreview {
  readonly dealerSeat: Seat;
  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly playerSeat: Seat;
  readonly playerHand: readonly Card[];
  readonly exposedCard: Card | null;
  readonly legalActions: readonly BiddingAction["type"][];
  readonly game: GameState | null;
  readonly legalCardIds: readonly CardId[];
}

export interface LocalBiddingSession {
  readonly getSnapshot: () => LocalPreview;
  readonly dispatchBiddingAction: (type: BiddingAction["type"], suit?: Suit) => LocalPreview;
  readonly dispatchCardPlay: (cardId: CardId, ikaDeclared?: boolean) => LocalPreview;
}

function cardMap(): Readonly<Record<CardId, Card>> {
  return Object.fromEntries(DECK.map((card) => [card.id, card])) as Record<CardId, Card>;
}

function cardsById(): Map<CardId, Card> {
  return new Map(DECK.map((card) => [card.id, card]));
}

function buildGameState(deal: DealState, bidding: BiddingState): GameState {
  const selected = bidding.selectedContract;
  if (selected === null) throw new Error("Cannot start playing without a selected contract");

  const hands = Object.fromEntries(
    (Object.keys(PLAYER_IDS) as Seat[]).map((seat) => [
      PLAYER_IDS[seat],
      deal.hands[seat].map((id) => cardMap()[id]),
    ]),
  ) as Record<PlayerId, readonly Card[]>;

  return {
    phase: "PLAYING",
    currentPlayerId: PLAYER_IDS[nextCounterClockwise(deal.dealerSeat)],
    players: PLAYER_IDS,
    hands,
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    hokumPlayMode: "OPEN",
    dealerSeat: deal.dealerSeat,
    trickNumber: 1,
    currentTrick: [],
    completedTricks: [],
  };
}

function nextCounterClockwise(seat: Seat): Seat {
  const order: readonly Seat[] = ["NORTH", "WEST", "SOUTH", "EAST"];
  return order[(order.indexOf(seat) + 1) % order.length]!;
}

function buildPreview(
  dealerSeat: Seat,
  playerSeat: Seat,
  deal: DealState,
  bidding: BiddingState,
  game: GameState | null,
): LocalPreview {
  const cards = cardsById();
  const playerHand = game
    ? game.hands[PLAYER_IDS[playerSeat]] ?? []
    : deal.hands[playerSeat].map((id) => cards.get(id)).filter((card): card is Card => card !== undefined);
  const exposedCard = deal.exposedCardId === null ? null : cards.get(deal.exposedCardId) ?? null;
  const legalActions = game ? [] : legalBiddingActions(bidding, dealerSeat, exposedCard?.suit ?? null, deal.hands);
  const legalCardIds = game && game.currentPlayerId === PLAYER_IDS[playerSeat]
    ? getLegalMoves(game, game.currentPlayerId).map((move) => move.cardId)
    : [];

  return { dealerSeat, deal, bidding, playerSeat, playerHand, exposedCard, legalActions, game, legalCardIds };
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "SOUTH";
  return buildPreview(
    dealerSeat,
    playerSeat,
    createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview")),
    createBiddingState("ui-preview", dealerSeat),
    null,
  );
}

export function createLocalBiddingSession(): LocalBiddingSession {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "WEST";
  let deal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  let bidding = createBiddingState("ui-preview", dealerSeat);
  let game: GameState | null = null;
  const getSnapshot = () => buildPreview(dealerSeat, playerSeat, deal, bidding, game);

  return {
    getSnapshot,
    dispatchBiddingAction: (type, suit) => {
      if (game !== null) throw new Error("Bidding is already complete");
      const snapshot = getSnapshot();
      if (!snapshot.legalActions.includes(type)) throw new Error(`Illegal bidding action: ${type}`);
      const action: BiddingAction = type === "BUY_HOKUM"
        ? { type, actionId: `ui-${bidding.turnNumber + 1}-${type}-${suit ?? "NONE"}`, suit: suit ?? "CLUBS" }
        : { type, actionId: `ui-${bidding.turnNumber + 1}-${type}` };
      bidding = applyBiddingAction(bidding, action, dealerSeat, deal.exposedCardId, cardMap(), deal.hands as BiddingHands);
      if (bidding.phase === "CONTRACT_SELECTED") {
        deal = completeDeal(deal, bidding.selectedContract!.exposedCardReceiverSeat);
        game = buildGameState(deal, bidding);
      }
      return getSnapshot();
    },
    dispatchCardPlay: (cardId, ikaDeclared = false) => {
      if (game === null) throw new Error("Playing has not started");
      game = applyCardPlay(game, PLAYER_IDS[playerSeat], cardId, ikaDeclared);
      return getSnapshot();
    },
  };
}
