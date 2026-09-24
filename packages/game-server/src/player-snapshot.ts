import type {
  Card,
  CardId,
  MatchState,
  PlayerId,
  RoundState,
  Seat,
} from "@sakkah-baloot/game-engine";
import {
  DECK,
  SEATS,
  getCardById,
  getLegalMoves,
  legalBiddingActions,
} from "@sakkah-baloot/game-engine";
import type { ConnectionStatus, PlayerScopedSnapshot } from "./types.js";
import type { SeatRouter } from "./seat-router.js";

export { getCardById };

export function buildPlayerScopedSnapshot(
  match: MatchState,
  playerId: PlayerId,
  seatRouter: SeatRouter,
  connectionStatus: Readonly<Record<PlayerId, ConnectionStatus>>,
): PlayerScopedSnapshot {
  const playerSeat = seatRouter.getSeat(playerId);
  const round: RoundState | null = match.round;

  const opponentCardCounts: Record<Seat, number> = {
    NORTH: 0,
    EAST: 0,
    SOUTH: 0,
    WEST: 0,
  };

  let ownHand: readonly Card[] = [];
  let exposedCard: Card | null = null;
  let legalBiddingActionList: readonly import("@sakkah-baloot/game-engine").BiddingAction["type"][] =
    [];
  let legalCardIdList: readonly CardId[] = [];

  if (round) {
    if (round.phase === "BIDDING") {
      const handCardIds = round.deal.hands[playerSeat] ?? [];
      ownHand = handCardIds.map(getCardById);

      for (const seat of SEATS) {
        opponentCardCounts[seat] = (round.deal.hands[seat] ?? []).length;
      }

      if (round.deal.exposedCardId) {
        exposedCard = getCardById(round.deal.exposedCardId);
      }

      if (round.bidding.actingSeat === playerSeat) {
        legalBiddingActionList = legalBiddingActions(
          round.bidding,
          round.dealerSeat,
          exposedCard?.suit ?? null,
          round.deal.hands,
        );
      }
    } else if (round.phase === "PLAYING" && round.game) {
      const game = round.game;
      ownHand = game.hands[playerId] ?? [];

      for (const seat of SEATS) {
        const pid = seatRouter.getPlayer(seat);
        opponentCardCounts[seat] = (game.hands[pid] ?? []).length;
      }

      if (game.currentPlayerId === playerId && game.phase === "PLAYING") {
        legalCardIdList = getLegalMoves(game, playerId).map((m) => m.cardId);
      }
    } else if (round.phase === "ROUND_COMPLETE") {
      if (round.game) {
        ownHand = round.game.hands[playerId] ?? [];
        for (const seat of SEATS) {
          const pid = seatRouter.getPlayer(seat);
          opponentCardCounts[seat] = (round.game.hands[pid] ?? []).length;
        }
      }
    }
  }

  const publicPlays = round?.game?.currentTrick ?? [];
  const completedTricks = round?.game?.completedTricks ?? [];
  const contract = round?.game?.contract ?? round?.bidding?.selectedContract?.contract ?? null;
  const trumpSuit = round?.game?.trumpSuit ?? round?.bidding?.selectedContract?.trumpSuit ?? null;

  return {
    matchId: match.matchId,
    roundId: match.roundId,
    roundNumber: match.roundNumber,
    stateVersion: match.stateVersion,
    dealerSeat: match.dealerSeat,
    matchPhase: match.phase,
    roundPhase: round ? round.phase : "NONE",
    score: match.score,
    lastRoundScore: match.lastRoundScore,
    matchEnd: match.end,
    playerSeat,
    playerId,
    ownHand,
    opponentCardCounts,
    exposedCard,
    biddingState: round?.bidding ?? null,
    legalBiddingActions: legalBiddingActionList,
    publicPlays,
    completedTricks,
    legalCardIds: legalCardIdList,
    contract,
    trumpSuit,
    projects: round?.projects ?? [],
    baloot: round?.baloot ?? null,
    playerSeats: seatRouter.getAllBindings(),
    connectionStatus,
  };
}
