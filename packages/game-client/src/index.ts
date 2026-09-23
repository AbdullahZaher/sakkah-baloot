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
  nextCounterClockwise,
  createMatchState,
  completeMatchRound,
  startNextRound,
  type MatchState,
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
  readonly roundNumber: number;
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
  readonly advanceRound: () => LocalPreview;
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

function buyerOriginallyHeldAce(deal: DealState, bidding: BiddingState): boolean {
  const selected = bidding.selectedContract;
  if (selected === null) return false;
  const purchaserHand = deal.transcript.initialHands[selected.purchaserSeat];
  return purchaserHand.some((id) => id.endsWith("-A"));
}

function resolveRound(
  game: GameState,
  deal: DealState,
  bidding: BiddingState,
): RoundScoreBreakdown {
  const selected = bidding.selectedContract;
  if (selected === null) throw new Error("Cannot score without a selected contract");
  if (game.phase !== "ROUND_COMPLETE") throw new Error("Round is not complete");

  return scoreRound({
    contract: selected.contract,
    trumpSuit: selected.trumpSuit,
    purchaserSeat: selected.purchaserSeat,
    dealerSeat: deal.dealerSeat,
    buyerOriginallyHeldAce: buyerOriginallyHeldAce(deal, bidding),
    escalation: "NORMAL",
    tricks: game.completedTricks,
    projectRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    projectQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootRaw: { NORTH_SOUTH: 0, EAST_WEST: 0 },
    balootQaid: { NORTH_SOUTH: 0, EAST_WEST: 0 },
  });
}

function buildPreview(
  dealerSeat: Seat,
  roundNumber: number,
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

  return {
    dealerSeat,
    roundNumber,
    deal,
    bidding,
    playerSeat,
    playerHand,
    exposedCard,
    legalActions,
    game,
    legalCardIds,
    roundScore,
    matchScore,
    matchEnd,
  };
}

export function createLocalPreview(): LocalPreview {
  const dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "SOUTH";
  return buildPreview(
    dealerSeat,
    1,
    playerSeat,
    createInitialDeal("ui-preview-round-1", dealerSeat, createSeededRandom("ui-preview-round-1")),
    createBiddingState("ui-preview-round-1", dealerSeat),
    null,
    null,
    { NORTH_SOUTH: 0, EAST_WEST: 0 },
    createMatchState("ui-preview-match", dealerSeat).end,
  );
}

export function createLocalBiddingSession(): LocalBiddingSession {
  let dealerSeat: Seat = "NORTH";
  const playerSeat: Seat = "WEST";
  let roundNumber = 1;
  let deal = createInitialDeal(
    "ui-preview-round-1",
    dealerSeat,
    createSeededRandom("ui-preview-round-1"),
  );
  let bidding = createBiddingState("ui-preview-round-1", dealerSeat);
  let game: GameState | null = null;
  let roundScore: RoundScoreBreakdown | null = null;
  let match: MatchState = createMatchState("ui-preview-match", dealerSeat);

  const getSnapshot = () => buildPreview(
    dealerSeat,
    roundNumber,
    playerSeat,
    deal,
    bidding,
    game,
    roundScore,
    match.score,
    match.end,
  );

  return {
    getSnapshot,

    dispatchBiddingAction: (type, suit) => {
      if (game !== null) throw new Error("Bidding is already complete");
      if (matchEnd.status === "FINISHED") throw new Error("Match is already finished");

      const snapshot = getSnapshot();
      if (!snapshot.legalActions.includes(type)) throw new Error(`Illegal bidding action: ${type}`);

      const action: BiddingAction = type === "BUY_HOKUM"
        ? {
            type,
            actionId: `ui-${roundNumber}-${bidding.turnNumber + 1}-${type}-${suit ?? "NONE"}`,
            suit: suit ?? "CLUBS",
          }
        : {
            type,
            actionId: `ui-${roundNumber}-${bidding.turnNumber + 1}-${type}`,
          };

      bidding = applyBiddingAction(
        bidding,
        action,
        dealerSeat,
        deal.exposedCardId,
        cardMap(),
        deal.hands as BiddingHands,
      );

      if (bidding.phase === "CONTRACT_SELECTED") {
        deal = completeDeal(deal, bidding.selectedContract!.exposedCardReceiverSeat);
        game = buildGameState(deal, bidding);
        roundScore = null;
      }

      return getSnapshot();
    },

    dispatchCardPlay: (cardId, ikaDeclared = false) => {
      if (game === null) throw new Error("Playing has not started");
      if (game.phase === "ROUND_COMPLETE") throw new Error("Round is already complete");

      game = applyCardPlay(game, PLAYER_BY_SEAT[playerSeat], cardId, ikaDeclared);

      if (game.phase === "ROUND_COMPLETE") {
        roundScore = resolveRound(game, deal, bidding);
        match = completeMatchRound(match, roundScore);
      }

      return getSnapshot();
    },

    advanceRound: () => {
      if (game === null || game.phase !== "ROUND_COMPLETE") {
        throw new Error("Next round is only available after round completion");
      }
      if (match.end.status === "FINISHED") {
        throw new Error("Cannot start another round after match completion");
      }

      match = startNextRound(match);
      dealerSeat = match.dealerSeat;
      roundNumber = match.roundNumber;
      const roundId = match.roundId;
      deal = createInitialDeal(roundId, dealerSeat, createSeededRandom(roundId));
      bidding = createBiddingState(roundId, dealerSeat);
      game = null;
      roundScore = null;
      return getSnapshot();
    },
  };
}
