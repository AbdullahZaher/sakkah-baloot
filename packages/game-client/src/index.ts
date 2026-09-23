import {
  applyBiddingAction,
  applyCardPlay,
  completeDeal,
  createBiddingState,
  createInitialDeal,
  createSeededRandom,
  getLegalMoves,
  legalBiddingActions,
  scoreRound,
  applyRoundToMatch,
  evaluateMatchEnd,
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
  type MatchEndResult,
  type MatchScore,
  type RoundScoreBreakdown,
  DECK,
} from "@sakkah-baloot/game-engine";

const PLAYER_BY_SEAT: Readonly<Record<Seat, PlayerId>> = {
  NORTH: "NORTH_PLAYER",
  EAST: "EAST_PLAYER",
  SOUTH: "SOUTH_PLAYER",
  WEST: "WEST_PLAYER",
};

const PLAYERS: Readonly<Record<PlayerId, Seat>> = {
  NORTH_PLAYER: "NORTH",
  EAST_PLAYER: "EAST",
  SOUTH_PLAYER: "SOUTH",
  WEST_PLAYER: "WEST",
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
  readonly roundScore: RoundScoreBreakdown | null;
  readonly matchScore: MatchScore;
  readonly matchEnd: MatchEndResult;
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
    (Object.keys(PLAYER_BY_SEAT) as Seat[]).map((seat) => [
      PLAYER_BY_SEAT[seat],
      deal.hands[seat].map((id) => cardMap()[id]),
    ]),
  ) as Record<PlayerId, readonly Card[]>;

  return {
    phase: "PLAYING",
    currentPlayerId: PLAYER_BY_SEAT[nextCounterClockwise(deal.dealerSeat)],
    players: PLAYERS,
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
  roundScore: RoundScoreBreakdown | null,
  matchScore: MatchScore,
  matchEnd: MatchEndResult,
): LocalPreview {
  const cards = cardsById();
  const playerId = PLAYER_BY_SEAT[playerSeat];
  const playerHand = game
    ? game.hands[playerId] ?? []
    : deal.hands[playerSeat].map((id) => cards.get(id)).filter((card): card is Card => card !== undefined);
  const exposedCard = deal.exposedCardId === null ? null : cards.get(deal.exposedCardId) ?? null;
  const legalActions = game ? [] : legalBiddingActions(bidding, dealerSeat, exposedCard?.suit ?? null, deal.hands);
  const legalCardIds = game && game.phase === "PLAYING" && game.currentPlayerId === playerId
    ? getLegalMoves(game, game.currentPlayerId).map((move) => move.cardId)
    : [];

  return { dealerSeat, deal, bidding, playerSeat, playerHand, exposedCard, legalActions, game, legalCardIds, roundScore, matchScore, matchEnd };
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
    null,
    { NORTH_SOUTH: 0, EAST_WEST: 0 },
    { status: "ONGOING", score: { NORTH_SOUTH: 0, EAST_WEST: 0 } },
  );
}

export function createLocalBiddingSession(): LocalBiddingSession {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "WEST";
  let deal = createInitialDeal("ui-preview", dealerSeat, createSeededRandom("ui-preview"));
  let bidding = createBiddingState("ui-preview", dealerSeat);
  let game: GameState | null = null;
  let roundScore: RoundScoreBreakdown | null = null;
  let matchScore: MatchScore = { NORTH_SOUTH: 0, EAST_WEST: 0 };
  let matchEnd: MatchEndResult = { status: "ONGOING", score: matchScore };
  const getSnapshot = () => buildPreview(
    dealerSeat, playerSeat, deal, bidding, game, roundScore, matchScore, matchEnd,
  );

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
        roundScore = null;
      }
      return getSnapshot();
    },
    dispatchCardPlay: (cardId, ikaDeclared = false) => {
      if (game === null) throw new Error("Playing has not started");
      game = applyCardPlay(game, PLAYER_BY_SEAT[playerSeat], cardId, ikaDeclared);
      return getSnapshot();
    },
  };
}
