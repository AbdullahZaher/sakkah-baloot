import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BiddingAction, Card, CardId, GameState, MatchEndResult, MatchScore, RoundScoreBreakdown, Seat, Suit } from "@sakkah-baloot/game-engine";

type BiddingActionType = BiddingAction["type"];

interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCard: Card | null;
  readonly hand: readonly Card[];
  readonly legalActions: readonly BiddingActionType[];
  readonly legalCardIds?: readonly CardId[];
  readonly game?: GameState | null;
  readonly playerSeat?: Seat;
  readonly onBiddingAction?: (action: BiddingActionType, suit?: Suit) => void;
  readonly onCardPlay?: (cardId: CardId) => void;
  readonly onNextRound?: (() => void) | undefined;
  readonly roundScore?: RoundScoreBreakdown | null;
  readonly matchScore?: MatchScore;
  readonly matchEnd?: MatchEndResult;
}

export function GameTable({
  dealerSeat, actingSeat, phase, exposedCard, hand, legalActions, legalCardIds = [], game = null,
  playerSeat = "SOUTH", onBiddingAction, onCardPlay, onNextRound, roundScore, matchScore, matchEnd,
}: GameTableProps) {
  const playerIsActing = actingSeat === playerSeat;
  const actions = playerIsActing ? legalActions : [];
  const hokumSuits = actions.includes("BUY_HOKUM") ? availableHokumSuits(exposedCard?.suit ?? null) : [];
  const trickCards = game?.currentTrick ?? [];
  const isRoundComplete = game?.phase === "ROUND_COMPLETE";
  const activeSeat = game ? game.currentPlayerId : actingSeat;

  return (
    <View style={styles.screen}>
      <View style={styles.table}>
        {/* Decorative inner table border */}
        <View style={styles.tableInnerRing} pointerEvents="none" />

        {/* North Player (AI Partner - Top) */}
        <SeatView
          label="NORTH"
          seatRole="الشريك"
          team="LANA"
          active={activeSeat === "NORTH"}
          isDealer={dealerSeat === "NORTH"}
          style={styles.north}
        />

        {/* West Player (AI Opponent - Left) */}
        <SeatView
          label="WEST"
          seatRole="خصم"
          team="LAHUM"
          active={activeSeat === "WEST"}
          isDealer={dealerSeat === "WEST"}
          style={styles.west}
        />

        {/* East Player (AI Opponent - Right) */}
        <SeatView
          label="EAST"
          seatRole="خصم"
          team="LAHUM"
          active={activeSeat === "EAST"}
          isDealer={dealerSeat === "EAST"}
          style={styles.east}
        />

        {/* Center Board: Logo, Phase, Exposed Card, or Trick Pile */}
        <View style={styles.center}>
          <View style={styles.centerHeader}>
            <Text style={styles.logo}>صكّة</Text>
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseText}>
                {game ? `الأكلة ${game.trickNumber} من 8` : formatPhase(phase)}
              </Text>
            </View>
          </View>

          {/* Bidding Phase: Exposed Card */}
          {!game ? (
            <View style={styles.exposedContainer}>
              <View style={styles.exposedBadge}>
                <Text style={styles.exposedBadgeText}>المكشوفة</Text>
              </View>
              <CardView card={exposedCard} compact />
            </View>
          ) : null}

          {/* Trick Taking Arena */}
          {game && !isRoundComplete ? <TrickView plays={trickCards} /> : null}

          {/* Round Score Recap Dialog */}
          {isRoundComplete && roundScore ? (
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
          {actions.length > 0 ? (
            <View style={styles.actionDock}>
              {actions.filter((action) => action !== "BUY_HOKUM").map((action) => (
                <Action key={action} action={action} onPress={onBiddingAction} />
              ))}
              {hokumSuits.map((suit) => (
                <Action key={`BUY_HOKUM-${suit}`} action="BUY_HOKUM" suit={suit} onPress={onBiddingAction} />
              ))}
            </View>
          ) : null}

          {/* Hand Cards Fan */}
          <View style={styles.hand}>
            {hand.map((card, index) => (
              <CardButton
                key={card.id}
                card={card}
                index={index}
                total={hand.length}
                enabled={legalCardIds.includes(card.id)}
                onPress={onCardPlay}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function RoundResult({
  score, matchScore, matchEnd, onNextRound,
}: {
  score: RoundScoreBreakdown;
  matchScore: MatchScore;
  matchEnd: MatchEndResult;
  onNextRound?: (() => void) | undefined;
}) {
  const canContinue = matchEnd.status !== "FINISHED";
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>نتيجة الجولة</Text>

      <View style={styles.resultGrid}>
        <View style={styles.resultCol}>
          <Text style={[styles.resultColHeader, styles.textLana]}>لنا (شمال + جنوب)</Text>
          <Text style={styles.resultRow}>الأبناط: {score.cardRaw.NORTH_SOUTH}</Text>
          <Text style={styles.resultRow}>المشاريع: {score.projectQaid.NORTH_SOUTH}</Text>
          <Text style={styles.resultRow}>البلوت: {score.balootQaid.NORTH_SOUTH}</Text>
          <Text style={styles.resultQaidTotal}>القيد: {score.finalQaid.NORTH_SOUTH}</Text>
        </View>

        <View style={styles.resultDivider} />

        <View style={styles.resultCol}>
          <Text style={[styles.resultColHeader, styles.textLahum]}>لهم (شرق + غرب)</Text>
          <Text style={styles.resultRow}>الأبناط: {score.cardRaw.EAST_WEST}</Text>
          <Text style={styles.resultRow}>المشاريع: {score.projectQaid.EAST_WEST}</Text>
          <Text style={styles.resultRow}>البلوت: {score.balootQaid.EAST_WEST}</Text>
          <Text style={styles.resultQaidTotal}>القيد: {score.finalQaid.EAST_WEST}</Text>
        </View>
      </View>

      {score.kabootTeamId ? (
        <View style={styles.badgeKaboot}>
          <Text style={styles.badgeKabootText}>كابوت لصالح: {score.kabootTeamId === "NORTH_SOUTH" ? "لنا" : "لهم"}</Text>
        </View>
      ) : null}

      {score.reverseKaboot ? (
        <View style={styles.badgeReverse}>
          <Text style={styles.badgeReverseText}>ريبيرس كابوت</Text>
        </View>
      ) : null}

      <View style={styles.matchScoreBar}>
        <Text style={styles.matchScoreLabel}>الصكّة:</Text>
        <Text style={styles.matchScoreNumbers}>{matchScore.NORTH_SOUTH} لنا — {matchScore.EAST_WEST} لهم</Text>
      </View>

      {matchEnd.status === "FINISHED" ? <Text style={styles.finishedStatus}>انتهت الصكّة</Text> : null}
      {matchEnd.status === "EXTRA_DEAL" ? <Text style={styles.extraDealStatus}>تعادل فوق 152 — توزيع إضافي</Text> : null}

      {canContinue ? (
        <Pressable accessibilityRole="button" onPress={onNextRound} style={styles.nextRoundBtn}>
          <Text style={styles.nextRoundBtnText}>{matchEnd.status === "EXTRA_DEAL" ? "توزيع إضافي" : "الجولة التالية"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TrickView({ plays }: { plays: readonly GameState["currentTrick"][number][] }) {
  if (plays.length === 0) {
    return (
      <View style={styles.waitingTrick}>
        <Text style={styles.waitingTrickText}>في انتظار اللعب...</Text>
      </View>
    );
  }

  return (
    <View style={styles.trickArena}>
      {plays.map((play) => (
        <View key={play.sequence} style={[styles.trickCardSlot, getTrickSlotStyle(play.seat)]}>
          <Text style={styles.trickSeatTag}>{seatArabicName(play.seat)}</Text>
          <CardView card={play.card} compact />
        </View>
      ))}
    </View>
  );
}

function getTrickSlotStyle(seat: Seat) {
  switch (seat) {
    case "NORTH": return styles.trickNorth;
    case "SOUTH": return styles.trickSouth;
    case "EAST": return styles.trickEast;
    case "WEST": return styles.trickWest;
  }
}

function CardButton({
  card, enabled, index, total, onPress,
}: {
  card: Card;
  enabled: boolean;
  index: number;
  total: number;
  onPress?: ((cardId: CardId) => void) | undefined;
}) {
  const offset = index - (total - 1) / 2;
  const rotation = `${offset * 2}deg`;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!enabled}
      onPress={() => onPress?.(card.id)}
      style={[
        styles.cardButton,
        { transform: [{ rotate: rotation }] },
        enabled ? styles.cardEnabled : styles.cardDisabled,
      ]}
    >
      <CardView card={card} highlight={enabled} />
    </Pressable>
  );
}

function SeatView({
  label, seatRole, team, active, isDealer, style,
}: {
  label: Seat;
  seatRole: string;
  team: "LANA" | "LAHUM";
  active: boolean;
  isDealer: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.seatPod, style]}>
      <View style={[
        styles.avatarWrap,
        team === "LANA" ? styles.avatarLana : styles.avatarLahum,
        active && styles.avatarActive,
      ]}>
        <Text style={[styles.avatarInitial, team === "LANA" ? styles.avatarInitialLana : styles.avatarInitialLahum]}>
          {seatInitial(label)}
        </Text>
        {isDealer ? (
          <View style={styles.dealerChip}>
            <Text style={styles.dealerChipText}>D</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.seatBadge}>
        <Text style={styles.seatLabel}>{seatArabicName(label)}</Text>
        <Text style={styles.seatSub}>{seatRole}</Text>
      </View>
    </View>
  );
}

function CardView({ card, compact = false, highlight = false }: { card: Card | null; compact?: boolean; highlight?: boolean }) {
  if (!card) {
    return (
      <View style={[styles.card, compact && styles.compactCard, styles.emptyCard]}>
        <Text style={styles.emptyCardText}>—</Text>
      </View>
    );
  }

  const red = isRedSuit(card);

  return (
    <View style={[
      styles.card,
      compact && styles.compactCard,
      highlight && styles.cardHighlight,
    ]}>
      {/* Top corner rank and suit */}
      <View style={styles.cardCornerTop}>
        <Text style={[styles.rank, compact && styles.compactRank, red && styles.redColor]}>{card.rank}</Text>
        <Text style={[styles.suitIconSmall, compact && styles.compactSuitIcon, red && styles.redColor]}>{suitSymbol(card.suit)}</Text>
      </View>

      {/* Center suit symbol */}
      <Text style={[styles.centerSuit, compact && styles.compactCenterSuit, red && styles.redColor]}>
        {suitSymbol(card.suit)}
      </Text>

      {/* Bottom corner rank and suit */}
      <View style={styles.cardCornerBottom}>
        <Text style={[styles.rank, compact && styles.compactRank, red && styles.redColor]}>{card.rank}</Text>
        <Text style={[styles.suitIconSmall, compact && styles.compactSuitIcon, red && styles.redColor]}>{suitSymbol(card.suit)}</Text>
      </View>
    </View>
  );
}

function Action({ action, suit, onPress }: { action: BiddingActionType; suit?: Suit; onPress?: ((action: BiddingActionType, suit?: Suit) => void) | undefined }) {
  const buttonStyle = getActionButtonStyle(action);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(action, suit)}
      style={[styles.actionBtn, buttonStyle]}
    >
      <Text style={styles.actionBtnText}>{actionLabel(action, suit)}</Text>
    </Pressable>
  );
}

function getActionButtonStyle(action: BiddingActionType) {
  switch (action) {
    case "BUY_SUN": return styles.actionSun;
    case "BUY_HOKUM":
    case "BUY_HOKUM_EXPOSED": return styles.actionHokum;
    case "BUY_ASHKAL": return styles.actionAshkal;
    case "PASS": return styles.actionPass;
    case "DECLARE_KASHO": return styles.actionKasho;
    default: return styles.actionDefault;
  }
}

function actionLabel(action: BiddingActionType, suit?: Suit): string {
  if (action === "BUY_HOKUM" && suit !== undefined) return `حكم ${suitArabic(suit)} ${suitSymbol(suit)}`;
  switch (action) {
    case "PASS": return "بس";
    case "DECLARE_KASHO": return "كاشو";
    case "BUY_HOKUM_EXPOSED": return "حكم";
    case "BUY_SUN": return "صن";
    case "BUY_ASHKAL": return "أشكال";
    case "BUY_HOKUM": return "حكم";
  }
}

function suitSymbol(suit: Suit): string {
  switch (suit) {
    case "CLUBS": return "♣";
    case "DIAMONDS": return "♦";
    case "HEARTS": return "♥";
    case "SPADES": return "♠";
  }
}

function suitArabic(suit: Suit): string {
  switch (suit) {
    case "CLUBS": return "شيريا";
    case "DIAMONDS": return "ديمن";
    case "HEARTS": return "هاص";
    case "SPADES": return "سبيد";
  }
}

function seatArabicName(seat: Seat): string {
  switch (seat) {
    case "NORTH": return "الشمال";
    case "WEST": return "الغرب";
    case "EAST": return "الشرق";
    case "SOUTH": return "الجنوب";
  }
}

function seatInitial(seat: Seat): string {
  switch (seat) {
    case "NORTH": return "ش";
    case "WEST": return "غ";
    case "EAST": return "ق";
    case "SOUTH": return "ج";
  }
}

function availableHokumSuits(exposedSuit: Suit | null): readonly Suit[] {
  return (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).filter((suit) => suit !== exposedSuit);
}

function isRedSuit(card: Card): boolean {
  return card.suit === "DIAMONDS" || card.suit === "HEARTS";
}

function formatPhase(phase: string): string {
  if (phase === "FIRST_ROUND") return "المزايدة: الدورة الأولى";
  if (phase === "SECOND_ROUND") return "المزايدة: الدورة الثانية";
  if (phase === "CONTRACT_SELECTED") return "تم اختيار اللعب";
  return phase;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 8,
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
    width: "90%",
    height: "82%",
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  centerHeader: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: {
    color: "#F5E6BF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  phaseBadge: {
    backgroundColor: "rgba(5, 18, 14, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  phaseText: {
    color: "#D8C28A",
    fontSize: 10,
    fontWeight: "700",
  },
  exposedContainer: {
    alignItems: "center",
    backgroundColor: "rgba(5, 18, 14, 0.7)",
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.35)",
    marginTop: 2,
  },
  exposedBadge: {
    marginBottom: 3,
  },
  exposedBadgeText: {
    color: "#F5E6BF",
    fontSize: 9,
    fontWeight: "800",
  },
  seatPod: {
    position: "absolute",
    alignItems: "center",
    zIndex: 15,
  },
  north: {
    top: 6,
  },
  west: {
    left: 10,
    top: "32%",
  },
  east: {
    right: 10,
    top: "32%",
  },
  south: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  avatarLana: {
    backgroundColor: "#164434",
  },
  avatarLahum: {
    backgroundColor: "#332222",
  },
  avatarActive: {
    borderColor: "#F7E5A9",
    borderWidth: 2.5,
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: "900",
  },
  avatarInitialLana: {
    color: "#34D399",
  },
  avatarInitialLahum: {
    color: "#F87171",
  },
  dealerChip: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0C2E23",
  },
  dealerChipText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
  },
  seatBadge: {
    backgroundColor: "rgba(5, 18, 14, 0.75)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 2,
  },
  seatLabel: {
    color: "#E2E8F0",
    fontSize: 9,
    fontWeight: "700",
  },
  seatSub: {
    color: "#94A3B8",
    fontSize: 7,
  },
  hand: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 72,
    marginTop: 2,
  },
  cardButton: {
    marginHorizontal: 2,
    borderRadius: 6,
  },
  cardEnabled: {
    opacity: 1,
    transform: [{ translateY: -4 }],
  },
  cardDisabled: {
    opacity: 0.4,
  },
  card: {
    width: 44,
    height: 64,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  compactCard: {
    width: 36,
    height: 52,
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  cardHighlight: {
    borderColor: "#D4AF37",
    borderWidth: 2,
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  emptyCardText: {
    color: "#64748B",
    fontSize: 12,
  },
  cardCornerTop: {
    alignSelf: "flex-start",
    alignItems: "center",
    lineHeight: 1,
  },
  cardCornerBottom: {
    alignSelf: "flex-end",
    alignItems: "center",
    transform: [{ rotate: "180deg" }],
    lineHeight: 1,
  },
  rank: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 12,
  },
  compactRank: {
    fontSize: 10,
    lineHeight: 10,
  },
  suitIconSmall: {
    color: "#0F172A",
    fontSize: 9,
    lineHeight: 9,
  },
  compactSuitIcon: {
    fontSize: 8,
    lineHeight: 8,
  },
  centerSuit: {
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 16,
  },
  compactCenterSuit: {
    fontSize: 13,
    lineHeight: 13,
  },
  redColor: {
    color: "#DC2626",
  },
  actionDock: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
    justifyContent: "center",
    backgroundColor: "rgba(5, 18, 14, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  actionSun: {
    backgroundColor: "#B45309",
    borderColor: "#FCD34D",
  },
  actionHokum: {
    backgroundColor: "#047857",
    borderColor: "#6EE7B7",
  },
  actionAshkal: {
    backgroundColor: "#4338CA",
    borderColor: "#A5B4FC",
  },
  actionPass: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(239, 68, 68, 0.6)",
  },
  actionKasho: {
    backgroundColor: "#6D28D9",
    borderColor: "#DDD6FE",
  },
  actionDefault: {
    backgroundColor: "#1E293B",
  },
  trickArena: {
    width: 140,
    height: 100,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  trickCardSlot: {
    position: "absolute",
    alignItems: "center",
    gap: 1,
  },
  trickNorth: { top: 0 },
  trickSouth: { bottom: 0 },
  trickEast: { right: 0 },
  trickWest: { left: 0 },
  trickSeatTag: {
    color: "#F5E6BF",
    fontSize: 8,
    fontWeight: "700",
  },
  waitingTrick: {
    paddingVertical: 4,
  },
  waitingTrickText: {
    color: "#94A3B8",
    fontSize: 10,
  },
  resultCard: {
    minWidth: 240,
    maxWidth: 300,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#071B14",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    gap: 5,
  },
  resultTitle: {
    color: "#F5E6BF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  resultGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 6,
    borderRadius: 8,
  },
  resultCol: {
    flex: 1,
    gap: 2,
  },
  resultColHeader: {
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 1,
  },
  textLana: { color: "#34D399" },
  textLahum: { color: "#F87171" },
  resultRow: {
    color: "#CBD5E1",
    fontSize: 9,
  },
  resultQaidTotal: {
    color: "#F5E6BF",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
    paddingTop: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.3)",
  },
  resultDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 6,
  },
  badgeKaboot: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F59E0B",
    alignItems: "center",
  },
  badgeKabootText: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "800",
  },
  badgeReverse: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
  },
  badgeReverseText: {
    color: "#FCA5A5",
    fontSize: 9,
    fontWeight: "800",
  },
  matchScoreBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchScoreLabel: {
    color: "#D8C28A",
    fontSize: 9,
    fontWeight: "700",
  },
  matchScoreNumbers: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  finishedStatus: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  extraDealStatus: {
    color: "#FCD34D",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  nextRoundBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  nextRoundBtnText: {
    color: "#05130E",
    fontSize: 11,
    fontWeight: "900",
  },
});
