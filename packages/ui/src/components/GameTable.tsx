import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type {
  BiddingAction,
  Card,
  CardId,
  GameState,
  MatchEndResult,
  MatchScore,
  RoundScoreBreakdown,
  Seat,
  Suit,
} from "@sakkah-baloot/game-engine";

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

const SEATS: readonly Seat[] = ["NORTH", "EAST", "SOUTH", "WEST"];

export function GameTable({
  dealerSeat,
  actingSeat,
  phase,
  exposedCard,
  hand,
  legalActions,
  legalCardIds = [],
  game = null,
  playerSeat = "SOUTH",
  onBiddingAction,
  onCardPlay,
  onNextRound,
  roundScore,
  matchScore,
  matchEnd,
}: GameTableProps) {
  const { width, height } = useWindowDimensions();
  const landscape = width >= height;
  const scale = Math.max(0.78, Math.min(1.18, Math.min(width / 852, height / 393)));

  const playerIsActing = actingSeat === playerSeat;
  const actions = playerIsActing ? legalActions : [];
  const hokumSuits = actions.includes("BUY_HOKUM")
    ? availableHokumSuits(exposedCard?.suit ?? null)
    : [];
  const trickCards = game?.currentTrick ?? [];
  const isRoundComplete = game?.phase === "ROUND_COMPLETE";

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.table,
          {
            borderRadius: 28 * scale,
            borderWidth: Math.max(1, 2 * scale),
            margin: landscape ? 8 * scale : 4,
          },
        ]}
      >
        {SEATS.filter((seat) => seat !== playerSeat).map((seat) => (
          <SeatView
            key={seat}
            label={seat}
            active={activeSeat(seat, actingSeat, game)}
            style={seatStyle(seat)}
            scale={scale}
          />
        ))}

        <View style={styles.center}>
          <View style={styles.brandRow}>
            <Text style={[styles.logo, { fontSize: 34 * scale }]}>صكّة</Text>
            <View style={styles.roundInfo}>
              <Text style={[styles.phase, { fontSize: 12 * scale }]}>
                {game ? `اللعبة ${game.trickNumber} / 8` : formatPhase(phase)}
              </Text>
              <Text style={[styles.meta, { fontSize: 10 * scale }]}>
                {game ? `الموزع: ${arabicSeat(dealerSeat)}` : `الموزع: ${arabicSeat(dealerSeat)}`}
              </Text>
            </View>
          </View>

          {!game ? (
            <View style={styles.contractArea}>
              <Text style={[styles.hint, { fontSize: 11 * scale }]}>الكرت المكشوف</Text>
              <CardView card={exposedCard} compact scale={scale} />
            </View>
          ) : isRoundComplete && roundScore ? (
            <RoundResult
              score={roundScore}
              matchScore={matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 }}
              matchEnd={
                matchEnd ??
                {
                  status: "ONGOING",
                  score: matchScore ?? { NORTH_SOUTH: 0, EAST_WEST: 0 },
                }
              }
              onNextRound={onNextRound}
              scale={scale}
            />
          ) : (
            <TrickView plays={trickCards} scale={scale} />
          )}
        </View>

        <View style={styles.playerArea}>
          <View style={styles.playerHeader}>
            <SeatView
              label={playerSeat}
              active={playerIsActing}
              style={styles.playerSeat}
              scale={scale}
            />
          </View>

          {actions.length > 0 ? (
            <View style={styles.actions}>
              {actions
                .filter((action) => action !== "BUY_HOKUM")
                .map((action) => (
                  <Action
                    key={action}
                    action={action}
                    onPress={onBiddingAction}
                    scale={scale}
                  />
                ))}
              {hokumSuits.map((suit) => (
                <Action
                  key={`BUY_HOKUM-${suit}`}
                  action="BUY_HOKUM"
                  suit={suit}
                  onPress={onBiddingAction}
                  scale={scale}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.hand}>
            {hand.map((card) => (
              <CardButton
                key={card.id}
                card={card}
                enabled={legalCardIds.includes(card.id)}
                onPress={onCardPlay}
                scale={scale}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function activeSeat(
  seat: Seat,
  actingSeat: Seat,
  game: GameState | null,
): boolean {
  if (!game) return actingSeat === seat;
  const currentSeat = game.players[game.currentPlayerId];
  return currentSeat === seat;
}

function seatStyle(seat: Seat) {
  switch (seat) {
    case "NORTH":
      return styles.north;
    case "EAST":
      return styles.east;
    case "WEST":
      return styles.west;
    case "SOUTH":
      return styles.southSeat;
  }
}

function RoundResult({
  score,
  matchScore,
  matchEnd,
  onNextRound,
  scale,
}: {
  score: RoundScoreBreakdown;
  matchScore: MatchScore;
  matchEnd: MatchEndResult;
  onNextRound?: (() => void) | undefined;
  scale: number;
}) {
  const canContinue = matchEnd.status !== "FINISHED";

  return (
    <View style={[styles.result, { padding: 12 * scale, minWidth: 230 * scale }]}>
      <Text style={[styles.resultTitle, { fontSize: 15 * scale }]}>نتيجة الجولة</Text>
      <Text style={[styles.resultLine, { fontSize: 10 * scale }]}>
        الكروت: {score.cardRaw.NORTH_SOUTH} — {score.cardRaw.EAST_WEST}
      </Text>
      <Text style={[styles.resultLine, { fontSize: 10 * scale }]}>
        المشاريع: {score.projectQaid.NORTH_SOUTH} — {score.projectQaid.EAST_WEST}
      </Text>
      <Text style={[styles.resultLine, { fontSize: 10 * scale }]}>
        بلوت: {score.balootQaid.NORTH_SOUTH} — {score.balootQaid.EAST_WEST}
      </Text>
      <Text style={[styles.resultLine, { fontSize: 10 * scale }]}>
        النتيجة: {score.finalQaid.NORTH_SOUTH} — {score.finalQaid.EAST_WEST}
      </Text>
      {score.kabootTeamId ? (
        <Text style={[styles.badge, { fontSize: 10 * scale }]}>
          كابوت: {score.kabootTeamId === "NORTH_SOUTH" ? "شمال + جنوب" : "شرق + غرب"}
        </Text>
      ) : null}
      {score.reverseKaboot ? (
        <Text style={[styles.badge, { fontSize: 10 * scale }]}>ريبيرس كابوت</Text>
      ) : null}
      <Text style={[styles.matchLine, { fontSize: 10 * scale }]}>
        المباراة: {matchScore.NORTH_SOUTH} — {matchScore.EAST_WEST}
      </Text>
      {matchEnd.status === "FINISHED" ? (
        <Text style={[styles.matchLine, { fontSize: 10 * scale }]}>انتهت المباراة</Text>
      ) : null}
      {matchEnd.status === "EXTRA_DEAL" ? (
        <Text style={[styles.matchLine, { fontSize: 10 * scale }]}>
          تعادل فوق الهدف — توزيع إضافي
        </Text>
      ) : null}
      {canContinue ? (
        <Pressable
          accessibilityRole="button"
          onPress={onNextRound}
          style={[styles.nextRound, { paddingVertical: 8 * scale }]}
        >
          <Text style={[styles.nextRoundText, { fontSize: 11 * scale }]}>
            {matchEnd.status === "EXTRA_DEAL" ? "توزيع إضافي" : "الجولة التالية"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TrickView({
  plays,
  scale,
}: {
  plays: readonly GameState["currentTrick"][number][];
  scale: number;
}) {
  if (plays.length === 0) {
    return <Text style={[styles.waiting, { fontSize: 11 * scale }]}>بانتظار أول ورقة</Text>;
  }

  return (
    <View style={[styles.trick, { width: 190 * scale, gap: 6 * scale }]}>
      {plays.map((play) => (
        <View key={play.sequence} style={styles.trickCard}>
          <Text style={[styles.trickSeat, { fontSize: 8 * scale }]}>
            {arabicSeat(play.seat)}
          </Text>
          <CardView card={play.card} compact scale={scale} />
        </View>
      ))}
    </View>
  );
}

function CardButton({
  card,
  enabled,
  onPress,
  scale,
}: {
  card: Card;
  enabled: boolean;
  onPress?: ((cardId: CardId) => void) | undefined;
  scale: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!enabled}
      onPress={() => onPress?.(card.id)}
      style={[
        styles.cardButton,
        { borderRadius: 8 * scale },
        !enabled && styles.disabledCard,
      ]}
    >
      <CardView card={card} scale={scale} />
    </Pressable>
  );
}

function SeatView({
  label,
  active,
  style,
  scale,
}: {
  label: Seat;
  active: boolean;
  style?: object;
  scale: number;
}) {
  return (
    <View style={[styles.seat, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: 34 * scale,
            height: 34 * scale,
            borderRadius: 17 * scale,
          },
          active && styles.active,
        ]}
      />
      <Text style={[styles.seatText, { fontSize: 10 * scale }]}>
        {arabicSeat(label)}
      </Text>
    </View>
  );
}

function CardView({
  card,
  compact = false,
  scale,
}: {
  card: Card | null;
  compact?: boolean;
  scale: number;
}) {
  const width = (compact ? 42 : 52) * scale;
  const height = (compact ? 58 : 74) * scale;

  return (
    <View
      style={[
        styles.card,
        {
          width,
          height,
          borderRadius: 8 * scale,
        },
      ]}
    >
      <Text
        style={[
          styles.rank,
          { fontSize: (compact ? 15 : 18) * scale },
        ]}
      >
        {card?.rank ?? "—"}
      </Text>
      <Text
        style={[
          styles.suit,
          {
            fontSize: (compact ? 16 : 20) * scale,
            lineHeight: (compact ? 17 : 21) * scale,
          },
          card && isRedSuit(card) && styles.redSuit,
        ]}
      >
        {card ? suitSymbol(card.suit) : ""}
      </Text>
    </View>
  );
}

function Action({
  action,
  suit,
  onPress,
  scale,
}: {
  action: BiddingActionType;
  suit?: Suit;
  onPress?: ((action: BiddingActionType, suit?: Suit) => void) | undefined;
  scale: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(action, suit)}
      style={[
        styles.action,
        {
          minWidth: 70 * scale,
          paddingHorizontal: 12 * scale,
          paddingVertical: 8 * scale,
          borderRadius: 18 * scale,
        },
      ]}
    >
      <Text style={[styles.actionText, { fontSize: 11 * scale }]}>
        {actionLabel(action, suit)}
      </Text>
    </Pressable>
  );
}

function actionLabel(action: BiddingActionType, suit?: Suit): string {
  if (action === "BUY_HOKUM" && suit !== undefined) {
    return `حكم ${suitArabic(suit)}`;
  }

  switch (action) {
    case "PASS":
      return "بس";
    case "DECLARE_KASHO":
      return "كاشو";
    case "BUY_HOKUM_EXPOSED":
      return "حكم";
    case "BUY_SUN":
      return "صن";
    case "BUY_ASHKAL":
      return "أشكال";
    case "BUY_HOKUM":
      return "حكم";
  }
}

function suitSymbol(suit: Suit): string {
  switch (suit) {
    case "CLUBS":
      return "♣";
    case "DIAMONDS":
      return "♦";
    case "HEARTS":
      return "♥";
    case "SPADES":
      return "♠";
  }
}

function suitArabic(suit: Suit): string {
  switch (suit) {
    case "CLUBS":
      return "كلوب";
    case "DIAMONDS":
      return "دينار";
    case "HEARTS":
      return "هاص";
    case "SPADES":
      return "سبيد";
  }
}

function arabicSeat(seat: Seat): string {
  switch (seat) {
    case "NORTH":
      return "شمال";
    case "EAST":
      return "شرق";
    case "SOUTH":
      return "أنت";
    case "WEST":
      return "غرب";
  }
}

function availableHokumSuits(exposedSuit: Suit | null): readonly Suit[] {
  return (["CLUBS", "DIAMONDS", "HEARTS", "SPADES"] as const).filter(
    (suit) => suit !== exposedSuit,
  );
}

function isRedSuit(card: Card): boolean {
  return card.suit === "DIAMONDS" || card.suit === "HEARTS";
}

function formatPhase(phase: string): string {
  if (phase === "FIRST_ROUND") return "الجولة الأولى";
  if (phase === "SECOND_ROUND") return "الجولة الثانية";
  if (phase === "CONTRACT_SELECTED") return "تم اختيار اللعب";
  return phase;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07120F",
  },
  table: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderColor: "#B89455",
    backgroundColor: "#123D31",
  },
  center: {
    position: "absolute",
    left: "30%",
    right: "30%",
    top: "22%",
    bottom: "25%",
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    alignItems: "center",
    gap: 2,
  },
  logo: {
    color: "#F5E6BF",
    fontWeight: "900",
  },
  roundInfo: {
    alignItems: "center",
  },
  phase: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  meta: {
    color: "#BFD2C9",
  },
  contractArea: {
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  hint: {
    color: "#BFD2C9",
    fontWeight: "700",
  },
  seat: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
  },
  north: {
    top: 12,
    left: 0,
    right: 0,
  },
  east: {
    right: 14,
    top: "45%",
  },
  west: {
    left: 14,
    top: "45%",
  },
  southSeat: {
    position: "relative",
  },
  playerArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },
  playerHeader: {
    position: "absolute",
    bottom: 116,
    alignItems: "center",
  },
  playerSeat: {
    position: "relative",
  },
  seatText: {
    color: "#E8F0EC",
    fontWeight: "700",
  },
  avatar: {
    backgroundColor: "#315C4E",
  },
  active: {
    borderWidth: 3,
    borderColor: "#E8C66A",
    backgroundColor: "#3B6B59",
  },
  hand: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
  },
  cardButton: {
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.42,
  },
  card: {
    backgroundColor: "#F7F2E8",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#D7CDBB",
  },
  rank: {
    color: "#17231F",
    fontWeight: "900",
  },
  suit: {
    color: "#17231F",
    fontWeight: "700",
  },
  redSuit: {
    color: "#B33A3A",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    maxWidth: 620,
    marginBottom: 7,
  },
  action: {
    backgroundColor: "#9D7B3C",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },
  trick: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
  },
  trickCard: {
    alignItems: "center",
    gap: 2,
  },
  trickSeat: {
    color: "#BFD2C9",
  },
  waiting: {
    color: "#BFD2C9",
    marginTop: 10,
  },
  result: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: "#0D2C24",
    borderWidth: 1,
    borderColor: "#B89455",
    gap: 3,
  },
  resultTitle: {
    color: "#F5E6BF",
    fontWeight: "900",
  },
  resultLine: {
    color: "#E8F0EC",
  },
  badge: {
    color: "#E8C66A",
    fontWeight: "900",
  },
  matchLine: {
    color: "#BFD2C9",
    fontWeight: "700",
  },
  nextRound: {
    marginTop: 6,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#9D7B3C",
  },
  nextRoundText: {
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },
});
