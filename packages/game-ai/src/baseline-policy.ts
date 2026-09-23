import type {
  BiddingAction,
  Card,
  CardId,
} from "@sakkah-baloot/game-engine";
import {
  cardRawValue,
  cardStrength,
  compareCards,
  contractThreshold,
  isTrump,
} from "@sakkah-baloot/game-engine";
import type { AIAction, AIRoundObservation } from "./index.js";
import { createCardMemory } from "./card-memory.js";
import { extractStrategyFeatures } from "./strategy-features.js";

export interface BaselinePolicyConfig {
  readonly preferInformation?: boolean;
}

export interface BaselineDecision {
  readonly action: AIAction;
  readonly trace: {
    readonly selectedAction: AIAction;
    readonly candidates: readonly {
      readonly action: AIAction;
      readonly heuristicScore: number;
    }[];
    readonly reasonCodes: readonly string[];
  };
}

export function chooseBaselineAction(
  observation: AIRoundObservation,
  config: BaselinePolicyConfig = {},
): BaselineDecision {
  if (observation.phase === "BIDDING" && observation.bidding) {
    return chooseBid(observation);
  }

  if (observation.phase === "PLAYING" && observation.playing) {
    return chooseCard(observation, config);
  }

  throw new Error("No AI action is available in the current observation phase");
}

function chooseBid(observation: AIRoundObservation): BaselineDecision {
  const bidding = observation.bidding!;
  const actions = bidding.legalActions;

  if (actions.length === 0) {
    throw new Error("Authoritative bidding action space is empty");
  }

  const handValue = bidding.ownHand.reduce(
    (sum, card) => sum + cardRawValue(card, "SUN", null),
    0,
  );

  const ranked = actions.map((type) => {
    let score = 0;
    const reasons: string[] = [];

    if (type === "PASS") {
      score = 0;
      reasons.push("PASS_BASELINE");
    } else if (type === "BUY_HOKUM") {
      const exposed = bidding.exposedCard;
      const trumpCount = exposed
        ? bidding.ownHand.filter((card) => card.suit === exposed.suit).length
        : 0;
      score = trumpCount * 12 + handValue;
      if (trumpCount >= 3) reasons.push("TRUMP_LENGTH");
      if (handValue >= 30) reasons.push("HAND_VALUE");
    } else if (type === "SUN") {
      score = handValue;
      if (handValue >= contractThreshold("SUN")) reasons.push("SUN_CONTROL");
    } else {
      score = handValue / 2;
    }

    return {
      action: {
        type: "BID",
        action: {
          type,
          actionId: `ai-baseline:${observation.roundId}:${observation.playerId}:${type}`,
          ...(type === "BUY_HOKUM" && bidding.exposedCard
            ? { suit: bidding.exposedCard.suit }
            : {}),
        } as BiddingAction,
      } satisfies AIAction,
      heuristicScore: score,
      reasons,
    };
  });

  const selected = [...ranked].sort(compareCandidate)[0]!;
  return {
    action: selected.action,
    trace: {
      selectedAction: selected.action,
      candidates: ranked.map(({ action, heuristicScore }) => ({ action, heuristicScore })),
      reasonCodes: selected.reasons,
    },
  };
}

function chooseCard(
  observation: AIRoundObservation,
  config: BaselinePolicyConfig,
): BaselineDecision {
  const playing = observation.playing!;
  const hand = playing.game.ownHand;
  const legalIds = playing.game.legalCardIds;

  if (legalIds.length === 0) throw new Error("Authoritative card action space is empty");

  const memory = createCardMemory({
    ownHand: hand,
    completedTricks: playing.game.completedTricks,
    currentTrick: playing.game.currentTrick,
    contract: playing.contract,
    trumpSuit: playing.trumpSuit,
  });

  const features = extractStrategyFeatures({
    ownHand: hand,
    memory,
    contract: playing.contract,
    trumpSuit: playing.trumpSuit,
    playerSeat: observation.seat,
    currentTrick: playing.game.currentTrick,
    completedTrickCount: playing.game.completedTricks.length,
  });

  const legalCards = legalIds.map(findCard(hand, playing.game.currentTrick, memory));
  const ranked = legalCards.map((card) => {
    const score = scoreCard(
      card,
      legalCards,
      playing.game.currentTrick,
      playing.contract,
      playing.trumpSuit,
      features.partnerWinning,
      config.preferInformation ?? true,
    );

    const reasons = reasonCodes(
      card,
      features.partnerWinning,
      features.minimumWinningCardIds,
      playing.contract,
      playing.trumpSuit,
    );

    return {
      action: { type: "PLAY_CARD", cardId: card.id } as AIAction,
      heuristicScore: score,
      reasons,
    };
  });

  const selected = [...ranked].sort(compareCandidate)[0]!;
  return {
    action: selected.action,
    trace: {
      selectedAction: selected.action,
      candidates: ranked.map(({ action, heuristicScore }) => ({ action, heuristicScore })),
      reasonCodes: selected.reasons,
    },
  };
}

function findCard(
  hand: readonly Card[],
  _currentTrick: readonly unknown[],
  _memory: ReturnType<typeof createCardMemory>,
) {
  return (id: CardId): Card => {
    const card = hand.find((candidate) => candidate.id === id);
    if (!card) throw new Error(`Authoritative action references card not in own hand: ${id}`);
    return card;
  };
}

function scoreCard(
  card: Card,
  legalCards: readonly Card[],
  currentTrick: readonly { readonly card: Card; readonly seat: string }[],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
  partnerWinning: boolean,
  preferInformation: boolean,
): number {
  let score = 0;
  const trump = isTrump(card, contract, trumpSuit);

  score += cardRawValue(card, contract, trumpSuit) * 0.8;
  score += cardStrength(card, contract, trumpSuit) * 0.2;

  if (currentTrick.length > 0) {
    const ledSuit = currentTrick[0]!.card.suit;
    const winner = currentWinner(currentTrick, contract, trumpSuit);

    if (winner && compareCards(card, winner.card, contract, trumpSuit, ledSuit) > 0) {
      score += 20;
      if (card.id === minimumWinningCard(legalCards, winner.card, ledSuit, contract, trumpSuit)?.id) {
        score += 12;
      }
    } else if (partnerWinning) {
      score -= trump ? 18 : 3;
    }
  } else {
    if (trump) score -= 2;
    if (card.rank === "A") score += 6;
    if (card.rank === "10") score += 4;
  }

  if (preferInformation && currentTrick.length === 0) {
    score += card.suit === "CLUBS" || card.suit === "DIAMONDS" ? 0.1 : 0;
  }

  return score;
}

function currentWinner(
  plays: readonly { readonly card: Card; readonly seat: string }[],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
) {
  const ledSuit = plays[0]!.card.suit;
  let winner = plays[0]!;
  for (const play of plays.slice(1)) {
    if (compareCards(play.card, winner.card, contract, trumpSuit, ledSuit) > 0) {
      winner = play;
    }
  }
  return winner;
}

function minimumWinningCard(
  cards: readonly Card[],
  winner: Card,
  ledSuit: Card["suit"],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
): Card | null {
  return cards
    .filter((card) => compareCards(card, winner, contract, trumpSuit, ledSuit) > 0)
    .sort((a, b) => cardStrength(a, contract, trumpSuit) - cardStrength(b, contract, trumpSuit))[0] ?? null;
}

function reasonCodes(
  card: Card,
  partnerWinning: boolean,
  minimumWinningIds: readonly string[],
  contract: "SUN" | "HOKUM",
  trumpSuit: "CLUBS" | "DIAMONDS" | "HEARTS" | "SPADES" | null,
): readonly string[] {
  const reasons: string[] = [];
  if (partnerWinning && isTrump(card, contract, trumpSuit)) reasons.push("PROTECT_PARTNER");
  if (minimumWinningIds.includes(card.id)) reasons.push("MINIMUM_WINNER");
  if (card.rank === "A") reasons.push("ACE_CONTROL");
  if (isTrump(card, contract, trumpSuit) && (card.rank === "J" || card.rank === "9")) {
    reasons.push("TRUMP_CONTROL");
  }
  return reasons.length ? reasons : ["BASELINE_VALUE"];
}

function compareCandidate(
  a: { readonly action: AIAction; readonly heuristicScore: number },
  b: { readonly action: AIAction; readonly heuristicScore: number },
): number {
  if (b.heuristicScore !== a.heuristicScore) return b.heuristicScore - a.heuristicScore;
  const aId = a.action.type === "PLAY_CARD" ? a.action.cardId : a.action.action.type;
  const bId = b.action.type === "PLAY_CARD" ? b.action.cardId : b.action.action.type;
  return aId.localeCompare(bId);
}
