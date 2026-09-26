import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  teamOfSeat,
  type BalootDeclaration,
  type BiddingAction,
  type BiddingActionOption,
  type Card,
  type CardId,
  type CompletedTrick,
  type Contract,
  type GameState,
  type MatchEndResult,
  type MatchScore,
  type ProjectCandidate,
  type ProjectDeclaration,
  type RoundScoreBreakdown,
  type Seat,
  type SelectedContract,
  type Suit,
  type TeamId,
} from "@sakkah-baloot/game-engine";
import { BiddingPanel, type BiddingActionType } from "./BiddingPanel";
import { CardButton } from "./CardButton";
import { CardView, isRedSuit, suitArabic, suitSymbol } from "./CardView";
import { ProjectPanel, projectLabel } from "./ProjectPanel";
import { RoundResult } from "./RoundResult";
import { SeatView, seatArabicName } from "./SeatView";
import { TrickView } from "./TrickView";

export interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCard: Card | null;
  readonly hand: readonly Card[];
  readonly legalActions: readonly BiddingActionType[];
  readonly legalOptions?: readonly BiddingActionOption[];
  readonly biddingHistory?: readonly {
    readonly actionId: string;
    readonly turnNumber: number;
    readonly seat: Seat;
    readonly phase: "FIRST_ROUND" | "SECOND_ROUND";
    readonly action: BiddingActionType;
    readonly stateVersion: number;
  }[];
  readonly legalCardIds?: readonly CardId[];
  readonly game?: GameState | null;
  readonly playerSeat?: Seat;
  readonly onBiddingAction?: (action: BiddingActionType, suit?: Suit) => void;
  readonly onCardPlay?: (cardId: CardId) => void;
  readonly onNextRound?: (() => void) | undefined;
  readonly roundScore?: RoundScoreBreakdown | null;
  readonly matchScore?: MatchScore;
  readonly matchEnd?: MatchEndResult;
  readonly contract?: Contract | null;
  readonly trumpSuit?: Suit | null;
  readonly selectedContract?: SelectedContract | null;
  readonly projectCandidates?: readonly ProjectCandidate[];
  readonly declaredProjects?: readonly ProjectDeclaration[];
  readonly baloot?: BalootDeclaration | null;
  readonly onProject?: (projectId: string) => void;
  readonly completedTrickPresentation?: CompletedTrick | null;
  readonly actionFeedback?: string | null;
}

export function GameTable({
  dealerSeat,
  actingSeat,
  phase,
  exposedCard,
  hand,
  legalActions,
  legalOptions = [],
  biddingHistory = [],
  legalCardIds = [],
  game = null,
  playerSeat = "SOUTH",
  onBiddingAction,
  onCardPlay,
  onNextRound,
  roundScore,
  matchScore,
  matchEnd,
  contract = null,
  trumpSuit = null,
  selectedContract = null,
  projectCandidates = [],
  declaredProjects = [],
  baloot = null,
  onProject,
  completedTrickPresentation = null,
  actionFeedback = null,
}: GameTableProps) {
  const isFrozen = Boolean(completedTrickPresentation);
  const frozenTrick = completedTrickPresentation ?? null;
  const isRoundFinished = roundScore !== null && !isFrozen;

  const activeSeat: Seat = isFrozen && frozenTrick
    ? frozenTrick.winnerSeat
    : ((game ? game.players[game.currentPlayerId] : actingSeat) ?? actingSeat);

  const playerIsActing = !isFrozen && !isRoundFinished && activeSeat === playerSeat;
  const actions = playerIsActing ? legalActions : [];
  const effectiveBiddingOptions: readonly BiddingActionOption[] =
    playerIsActing && !game
      ? legalOptions && legalOptions.length > 0
        ? legalOptions
        : actions.map((type) => ({ type, label: type } as BiddingActionOption))
      : [];

  const trickCards = game?.currentTrick ?? [];
  const isRoundComplete = roundScore !== null && !isFrozen;
  const lastCompletedTrick: CompletedTrick | null =
    game?.completedTricks && game.completedTricks.length > 0
      ? game.completedTricks[game.completedTricks.length - 1] ?? null
      : null;

  // Active contract resolution
  const activeContract = selectedContract?.contract ?? contract ?? game?.contract ?? null;
  const activeTrumpSuit = selectedContract?.trumpSuit ?? trumpSuit ?? game?.trumpSuit ?? null;
  const purchaserSeat = selectedContract?.purchaserSeat ?? null;

  // Effective legal card IDs (frozen during 2s trick hold)
  const effectiveLegalCardIds = isFrozen ? [] : (playerIsActing ? legalCardIds : []);

  return (
    <View style={styles.screen} testID="game-table">
      <View style={styles.table}>
        {/* Decorative inner table felt border */}
        <View style={styles.tableInnerRing} pointerEvents="none" />

        {/* Top persistent Contract & Round Info Banner */}
        <View style={styles.topHudBar}>
          {activeContract ? (
            <View style={styles.contractHud}>
              <View style={styles.contractBadge}>
                <Text style={styles.contractBadgeText}>
                  {activeContract === "HOKUM"
                    ? `حكم ${activeTrumpSuit ? suitArabic(activeTrumpSuit) : ""} ${activeTrumpSuit ? suitSymbol(activeTrumpSuit) : ""}`
                    : selectedContract?.mode === "ASHKAL"
                      ? "أشكال (صن للموزع)"
                      : "صن"}
                </Text>
              </View>
              {purchaserSeat ? (
                <View style={styles.purchaserBadge}>
                  <Text style={styles.purchaserText}>
                    المشتري:{" "}
                    <Text style={styles.purchaserSeatHighlight}>
                      {seatArabicName(purchaserSeat)}
                    </Text>{" "}
                    ({teamLabel(teamOfSeat(purchaserSeat))})
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.biddingPhaseBadge}>
              <Text style={styles.biddingPhaseText}>{formatPhase(phase)}</Text>
            </View>
          )}

          {game ? (
            <View style={styles.trickCounterBadge}>
              <Text style={styles.trickCounterText}>
                الأكلة {isFrozen && frozenTrick ? frozenTrick.trickNumber : game.trickNumber} من 8
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Feedback Banner */}
        {actionFeedback ? (
          <View style={styles.actionFeedback} pointerEvents="none">
            <Text style={styles.actionFeedbackText}>
              {formatActionFeedback(actionFeedback)}
            </Text>
          </View>
        ) : null}

        {/* North Player (AI Partner - Top) */}
        <SeatView
          label="NORTH"
          seatRole={seatRoleLabel("NORTH", playerSeat)}
          team={teamOfSeat("NORTH") === "NORTH_SOUTH" ? "LANA" : "LAHUM"}
          active={!isFrozen && !isRoundFinished && activeSeat === "NORTH"}
          isDealer={dealerSeat === "NORTH"}
          isHuman={false}
          cardCount={cardCountForSeat(game, "NORTH")}
          style={styles.north}
        />

        {/* West Player (AI Opponent - Left) */}
        <SeatView
          label="WEST"
          seatRole={seatRoleLabel("WEST", playerSeat)}
          team={teamOfSeat("WEST") === "NORTH_SOUTH" ? "LANA" : "LAHUM"}
          active={!isFrozen && !isRoundFinished && activeSeat === "WEST"}
          isDealer={dealerSeat === "WEST"}
          isHuman={false}
          cardCount={cardCountForSeat(game, "WEST")}
          style={styles.west}
        />

        {/* East Player (AI Opponent - Right) */}
        <SeatView
          label="EAST"
          seatRole={seatRoleLabel("EAST", playerSeat)}
          team={teamOfSeat("EAST") === "NORTH_SOUTH" ? "LANA" : "LAHUM"}
          active={!isFrozen && !isRoundFinished && activeSeat === "EAST"}
          isDealer={dealerSeat === "EAST"}
          isHuman={false}
          cardCount={cardCountForSeat(game, "EAST")}
          style={styles.east}
        />

        {/* Center Board Arena */}
        <View style={styles.center}>
          {/* Baloot Notification Banner */}
          {baloot ? (
            <View style={styles.balootBanner}>
              <Text style={styles.balootBannerText}>
                🌟 بلوت {suitSymbol(baloot.trumpSuit)} {suitArabic(baloot.trumpSuit)} · +{baloot.qaydValue} قيد ({seatArabicName(baloot.ownerSeat)})
              </Text>
            </View>
          ) : null}

          {/* Declared Projects Persistent Bar */}
          {declaredProjects.length > 0 && !isRoundComplete ? (
            <View style={styles.declaredProjectsContainer}>
              <Text style={styles.declaredProjectsTitle}>المشاريع المعلنة:</Text>
              <View style={styles.declaredProjectList}>
                {declaredProjects.map((item) => (
                  <View key={item.declarationId} style={styles.declaredChip}>
                    <Text style={styles.declaredChipText}>
                      {seatArabicName(item.candidate.ownerSeat)}: {projectLabel(item.candidate.type)} (+{item.candidate.qaydValue})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Interactive Project Declaration during Trick 1 */}
          {game && game.trickNumber === 1 && game.currentTrick.length === 0 && projectCandidates.length > 0 ? (
            <ProjectPanel
              candidates={projectCandidates}
              declared={declaredProjects}
              onProject={onProject}
            />
          ) : null}

          {/* Bidding Phase: Exposed Card Container */}
          {!game ? (
            <View style={styles.exposedContainer}>
              <View style={styles.exposedBadge}>
                <Text style={styles.exposedBadgeText}>ورقة الشراء المكشوفة</Text>
              </View>
              <CardView card={exposedCard} />
            </View>
          ) : null}

          {/* Trick Taking Arena (authoritative plays with completed trick freeze) */}
          {game && (!isRoundComplete || isFrozen) ? (
            <TrickView
              plays={trickCards}
              activeSeat={activeSeat}
              lastCompletedTrick={lastCompletedTrick}
              frozenTrick={frozenTrick}
            />
          ) : null}

          {/* Round Score Recap Dialog (shown only after final trick freeze clears) */}
          {isRoundComplete && roundScore && !isFrozen ? (
            <RoundResult
              score={roundScore}
              matchScore={matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 }}
              matchEnd={matchEnd ?? { status: "ONGOING", score: matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 } }}
              onNextRound={onNextRound}
            />
          ) : null}
        </View>

        {/* South Player Area (Human Player Hand + Actions Dock) */}
        <View style={styles.south}>
          {/* Turn indicator ribbon above hand */}
          <View style={styles.southTurnRibbon}>
            <View
              style={[
                styles.turnDot,
                isFrozen
                  ? styles.turnDotFrozen
                  : playerIsActing
                    ? styles.turnDotActive
                    : styles.turnDotInactive,
              ]}
            />
            <Text
              style={[
                styles.southTurnText,
                (playerIsActing || isFrozen) && styles.southTurnTextActive,
              ]}
            >
              {isFrozen
                ? "جاري احتساب الفائز بالأكلة..."
                : isRoundFinished
                  ? matchEnd?.status === "FINISHED"
                    ? "انتهت الصكة"
                    : "انتهت الجولة"
                  : playerIsActing
                    ? (game ? "دورك الآن — اختر ورقة للعب" : "دورك في المزايدة — اختر العقد المناسب")
                    : `في انتظار ${seatArabicName(activeSeat)}...`}
            </Text>
          </View>

          {/* Professional Bidding Decision Dock */}
          {effectiveBiddingOptions.length > 0 ? (
            <BiddingPanel
              phase={phase}
              exposedCard={exposedCard}
              legalOptions={effectiveBiddingOptions}
              history={biddingHistory}
              onBiddingAction={onBiddingAction}
            />
          ) : null}

          {/* Hand Cards Fan */}
          <View style={styles.hand}>
            {hand.map((card, index) => (
              <CardButton
                key={card.id}
                card={card}
                index={index}
                total={hand.length}
                enabled={effectiveLegalCardIds.includes(card.id)}
                onPress={onCardPlay}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function cardCountForSeat(game: GameState | null, seat: Seat): number | undefined {
  if (!game) return undefined;
  const player = Object.entries(game.players).find(([, playerSeat]) => playerSeat === seat)?.[0];
  return player ? (game.hands[player]?.length ?? 0) : undefined;
}

function seatRoleLabel(seat: Seat, playerSeat: Seat): string {
  if (seat === playerSeat) return "أنت";
  if (teamOfSeat(seat) === teamOfSeat(playerSeat)) return "الشريك";
  return "خصم";
}

function teamLabel(team: TeamId): string {
  return team === "NORTH_SOUTH" ? "لنا" : "لهم";
}

function formatPhase(phase: string): string {
  if (phase === "FIRST_ROUND") return "المزايدة: الدورة الأولى";
  if (phase === "SECOND_ROUND") return "المزايدة: الدورة الثانية";
  if (phase === "CONTRACT_SELECTED") return "تم اختيار اللعب";
  return phase;
}

function formatActionFeedback(value: string): string {
  return value
    .replace("NORTH", "الشمال")
    .replace("EAST", "الشرق")
    .replace("SOUTH", "الجنوب")
    .replace("WEST", "الغرب")
    .replace("BUY_HOKUM_EXPOSED", "حكم المكشوف")
    .replace("BUY_ASHKAL", "أشكال")
    .replace("BUY_SUN", "صن")
    .replace("BUY_HOKUM", "حكم")
    .replace("DECLARE_KASHO", "كاشو")
    .replace("PASS", "بس")
    .replace("CLUBS", "كلوب")
    .replace("DIAMONDS", "ديمن")
    .replace("HEARTS", "هارت")
    .replace("SPADES", "سبيد");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    width: "100%",
    height: "100%",
  },
  table: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#A38035",
    backgroundColor: "#0C2E23",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  tableInnerRing: {
    position: "absolute",
    width: "92%",
    height: "85%",
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  topHudBar: {
    position: "absolute",
    top: 6,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    width: "92%",
    zIndex: 25,
  },
  contractHud: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(5, 18, 14, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  contractBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  contractBadgeText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
  },
  purchaserBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  purchaserText: {
    color: "#E2E8F0",
    fontSize: 9,
    fontWeight: "700",
  },
  purchaserSeatHighlight: {
    color: "#38BDF8",
    fontWeight: "900",
  },
  biddingPhaseBadge: {
    backgroundColor: "rgba(5, 18, 14, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  biddingPhaseText: {
    color: "#D8C28A",
    fontSize: 10,
    fontWeight: "800",
  },
  trickCounterBadge: {
    backgroundColor: "rgba(5, 18, 14, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  trickCounterText: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "800",
  },
  actionFeedback: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    zIndex: 40,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "rgba(5, 18, 14, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.55)",
  },
  actionFeedbackText: {
    color: "#F5E6BF",
    fontSize: 9,
    fontWeight: "900",
  },
  north: {
    position: "absolute",
    top: 36,
    alignSelf: "center",
  },
  south: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    alignItems: "center",
    width: "100%",
  },
  east: {
    position: "absolute",
    right: 8,
    top: "38%",
  },
  west: {
    position: "absolute",
    left: 8,
    top: "38%",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    width: "100%",
  },
  balootBanner: {
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(212, 175, 55, 0.18)",
    borderWidth: 1,
    borderColor: "#D4AF37",
    alignItems: "center",
  },
  balootBannerText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
  },
  declaredProjectsContainer: {
    marginBottom: 6,
    alignItems: "center",
    gap: 3,
  },
  declaredProjectsTitle: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
  },
  declaredProjectList: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  declaredChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  declaredChipText: {
    color: "#BAE6FD",
    fontSize: 8,
    fontWeight: "800",
  },
  exposedContainer: {
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(5, 18, 14, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  exposedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  exposedBadgeText: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "800",
  },
  southTurnRibbon: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(5, 18, 14, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 4,
  },
  turnDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  turnDotActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  turnDotInactive: {
    backgroundColor: "#64748B",
  },
  turnDotFrozen: {
    backgroundColor: "#F59E0B",
  },
  southTurnText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
  },
  southTurnTextActive: {
    color: "#F8FAFC",
    fontWeight: "800",
  },
  hand: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 72,
    paddingHorizontal: 12,
  },
});
