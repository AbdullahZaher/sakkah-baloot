import {
  DECK,
  canDeclareBaloot,
  detectProjects,
  getLegalMoves,
  legalBiddingActions,
  type BiddingAction,
  type Card,
  type CardId,
  type MatchState,
  type ProjectCandidate,
  type Seat,
} from "@sakkah-baloot/game-engine";

const CARD_BY_ID: Readonly<Record<CardId, Card>> = Object.fromEntries(
  DECK.map((card) => [card.id, card]),
) as Readonly<Record<CardId, Card>>;

export interface AuthoritativeActionSpace {
  readonly bidding: readonly BiddingAction["type"][];
  readonly cards: readonly CardId[];
  readonly projects: readonly ProjectCandidate[];
  readonly baloot: boolean;
}

function cardsFromIds(ids: readonly CardId[]): readonly Card[] {
  return ids.map((id) => {
    const card = CARD_BY_ID[id];
    if (!card) throw new Error(`Unknown card id: ${id}`);
    return card;
  });
}

function knownPlayedByPlayer(
  match: MatchState,
  playerId: string,
): readonly Card[] {
  const game = match.round?.game;
  if (!game) return [];

  return [
    ...game.completedTricks.flatMap((trick) => trick.plays),
    ...game.currentTrick,
  ]
    .filter((play) => play.playerId === playerId)
    .map((play) => play.card);
}

export function createAuthoritativeActionSpace(
  match: MatchState,
  playerId: string,
  playerSeat: Seat,
): AuthoritativeActionSpace {
  const round = match.round;
  if (!round) {
    return { bidding: [], cards: [], projects: [], baloot: false };
  }

  const ownHandIds = round.deal.hands[playerSeat] ?? [];
  const ownHand = cardsFromIds(ownHandIds);

  let bidding: readonly BiddingAction["type"][] = [];
  if (round.phase === "BIDDING") {
    bidding = legalBiddingActions(
      round.bidding,
      round.dealerSeat,
      round.deal.exposedCardId === null
        ? null
        : CARD_BY_ID[round.deal.exposedCardId]?.suit ?? null,
      round.deal.hands,
    );
  }

  if (round.phase !== "PLAYING" || !round.game) {
    return { bidding, cards: [], projects: [], baloot: false };
  }

  const game = round.game;
  if (game.currentPlayerId !== playerId) {
    return { bidding, cards: [], projects: [], baloot: false };
  }

  const cards = getLegalMoves(game, playerId).map((move) => move.cardId);
  const projects =
    game.trickNumber === 1 && game.currentTrick.length === 0
      ? detectProjects(ownHand, game.contract, game.trumpSuit, playerSeat)
      : [];

  const alreadyPlayed = knownPlayedByPlayer(match, playerId);
  const baloot = cards.some((cardId) => {
    const card = CARD_BY_ID[cardId];
    if (!card) return false;

    return canDeclareBaloot(
      game.contract,
      game.trumpSuit,
      playerSeat,
      card,
      alreadyPlayed,
      true,
    );
  });

  return { bidding, cards, projects, baloot };
}
