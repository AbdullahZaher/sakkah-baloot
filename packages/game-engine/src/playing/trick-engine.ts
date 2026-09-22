import type { Card, CardId } from "../cards.js";
import { compareCards } from "../cards.js";
import type { PlayerId, Seat } from "../rules/types.js";
import type { CompletedTrick, GameState, TrickPlay } from "./types.js";
import { getCurrentWinner, getLeadSuit } from "./legal-moves.js";
import { getLegalMoves } from "./legal-moves.js";

function removeCard(hand: readonly Card[], cardId: CardId): readonly Card[] {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index < 0) throw new Error("Card is not in player's hand");
  return [...hand.slice(0, index), ...hand.slice(index + 1)];
}

export function resolveTrick(
  trickNumber: number,
  leaderSeat: Seat,
  plays: readonly TrickPlay[],
  contract: GameState["contract"],
  trumpSuit: GameState["trumpSuit"],
): CompletedTrick {
  if (plays.length !== 4) throw new Error("A trick requires exactly four cards");
  const ledSuit = plays[0]?.card.suit ?? null;
  if (ledSuit === null) throw new Error("Missing lead card");
  let winner = plays[0]!;
  for (let i = 1; i < plays.length; i += 1) {
    const candidate = plays[i]!;
    if (compareCards(candidate.card, winner.card, contract, trumpSuit, ledSuit) > 0) winner = candidate;
  }
  return { trickNumber, leaderSeat, plays: [...plays], winnerSeat: winner.seat };
}

export function applyCardPlay(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId,
  ikaDeclared = false,
): GameState {
  if (state.phase !== "PLAYING") throw new Error("Game is not in PLAYING phase");
  if (state.currentPlayerId !== playerId) throw new Error("Not this player's turn");

  const legal = getLegalMoves(state, playerId);
  if (!legal.some((move) => move.cardId === cardId)) throw new Error("Illegal card");
  const card = state.hands[playerId]?.find((c) => c.id === cardId);
  if (!card) throw new Error("Card is not in player's hand");

  if (ikaDeclared) {
    if (state.currentTrick.length !== 0) throw new Error("Ika must be declared on the lead card");
    const isTrumpCard = state.contract === "HOKUM" && state.trumpSuit !== null && card.suit === state.trumpSuit;
    if (state.contract !== "HOKUM" || isTrumpCard) throw new Error("Invalid Ika declaration");
    const sameSuit = (state.hands[playerId] ?? []).filter((c) => c.suit === card.suit && !(
      state.contract === "HOKUM" && state.trumpSuit !== null && c.suit === state.trumpSuit
    ));
    const strength = (c: Card) => {
      const order = ["7","8","9","10","J","Q","K","A"];
      return order.indexOf(c.rank);
    };
    if (card.rank !== "A" && !sameSuit.every((c) => strength(card) >= strength(c))) {
      throw new Error("Invalid Ika declaration");
    }
  }

  const play: TrickPlay = {
    playerId,
    seat: state.players[playerId]!,
    card,
    ikaDeclared,
    sequence: state.currentTrick.length + 1,
  };
  const nextHands = { ...state.hands, [playerId]: removeCard(state.hands[playerId]!, cardId) };
  const plays = [...state.currentTrick, play];

  if (plays.length < 4) {
    const seats = state.players;
    let nextPlayer: PlayerId | null = null;
    let cursor = play.seat;
    for (const [candidateId, seat] of Object.entries(seats)) {
      if (seat === undefined) continue;
      // The player immediately counter-clockwise from the current seat is the next actor.
      // Seat ordering is resolved through the Rule Profile, not object insertion order.
      void candidateId;
    }
    const nextSeatMap: Record<Seat, Seat> = {
      NORTH: "WEST", WEST: "SOUTH", SOUTH: "EAST", EAST: "NORTH",
    };
    const nextSeat = nextSeatMap[cursor];
    nextPlayer = Object.entries(seats).find(([, seat]) => seat === nextSeat)?.[0] ?? null;
    if (!nextPlayer) throw new Error("Unable to resolve next player");
    return { ...state, hands: nextHands, currentTrick: plays, currentPlayerId: nextPlayer };
  }

  const completed = resolveTrick(state.trickNumber, state.currentTrick[0]?.seat ?? play.seat, plays, state.contract, state.trumpSuit);
  const completedTricks = [...state.completedTricks, completed];

  if (completedTricks.length === 8) {
    return {
      ...state,
      hands: nextHands,
      currentTrick: [],
      completedTricks,
      phase: "ROUND_COMPLETE",
      currentPlayerId: playerId,
    };
  }

  const nextPlayer = Object.entries(state.players).find(([, seat]) => seat === completed.winnerSeat)?.[0];
  if (!nextPlayer) throw new Error("Unable to resolve trick winner player");
  return {
    ...state,
    hands: nextHands,
    currentTrick: [],
    completedTricks,
    trickNumber: state.trickNumber + 1,
    currentPlayerId: nextPlayer,
  };
}
