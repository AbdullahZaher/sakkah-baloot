import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  teamOfSeat,
  type BalootDeclaration,
  type BiddingAction,
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

type BiddingActionType = BiddingAction["type"];

export interface GameTableProps {
  readonly dealerSeat: Seat;
  readonly actingSeat: Seat;
  readonly phase: string;
  readonly exposedCard: Card | null;
  readonly hand: readonly Card[];
  readonly legalActions: readonly BiddingActionType[];
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
  const hokumSuits = actions.includes("BUY_HOKUM") ? availableHokumSuits(exposedCard?.suit ?? null) : [];
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
    <View style={styles.screen}>
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
                    المشتري: <Text style={styles.purchaserSeatHighlight}>{seatArabicName(purchaserSeat)}</Text> ({teamLabel(teamOfSeat(purchaserSeat))})
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

        {actionFeedback ? (
          <View style={styles.actionFeedback} pointerEvents="none">
            <Text style={styles.actionFeedbackText}>{formatActionFeedback(actionFeedback)}</Text>
          </View>
        ) : null}

        {/* North Player (AI Partner - Top) */}
        <SeatView
          label="NORTH"
          seatRole={seatRoleLabel("NORTH", playerSeat)}
          team={teamOfSeat("NORTH") === "NORTH_SOUTH" ? "LANA" : "LAHUM"}
          active={!isFrozen && !isRoundFinished && activeSeat === "NORTH"}
          isDealer={dealerSeat === "NORTH"}
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
                    ? "دورك الآن — اختر ورقة للعب"
                    : `في انتظار ${seatArabicName(activeSeat)}...`}
            </Text>
          </View>

          {/* Professional Bidding Decision Dock */}
          {actions.length > 0 ? (
            <BiddingPanel
              phase={phase}
              exposedCard={exposedCard}
              actions={actions}
              hokumSuits={hokumSuits}
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

function BidHistory({
  history,
}: {
  history: readonly {
    readonly actionId: string;
    readonly turnNumber: number;
    readonly seat: Seat;
    readonly phase: "FIRST_ROUND" | "SECOND_ROUND";
    readonly action: BiddingActionType;
    readonly stateVersion: number;
  }[];
}) {
  if (history.length === 0) return null;
  return (
    <View style={styles.bidHistory}>
      <Text style={styles.bidHistoryTitle}>سجل المزايدة</Text>
      <View style={styles.bidHistoryRows}>
        {history.slice(-6).map((item) => (
          <View key={item.actionId} style={styles.bidHistoryRow}>
            <Text style={styles.bidHistorySeat}>{seatArabicName(item.seat)}</Text>
            <Text style={styles.bidHistoryAction}>{biddingActionArabic(item.action)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function biddingActionArabic(action: BiddingActionType): string {
  switch (action) {
    case "PASS": return "بس";
    case "BUY_SUN": return "صن";
    case "BUY_HOKUM_EXPOSED": return "حكم المكشوف";
    case "BUY_HOKUM": return "حكم";
    case "BUY_ASHKAL": return "أشكال";
    case "DECLARE_KASHO": return "كاشو";
  }
}

function TrickView({
  plays,
  activeSeat,
  lastCompletedTrick,
  frozenTrick,
}: {
  plays: readonly GameState["currentTrick"][number][];
  activeSeat: Seat;
  lastCompletedTrick: CompletedTrick | null;
  frozenTrick: CompletedTrick | null;
}) {
  const seats: readonly Seat[] = ["NORTH", "EAST", "SOUTH", "WEST"] as const;
  const isFrozen = frozenTrick !== null;
  const currentPlays = isFrozen ? frozenTrick.plays : plays;
  const winnerSeat = isFrozen ? frozenTrick.winnerSeat : null;
  const trickNum = isFrozen
    ? frozenTrick.trickNumber
    : (lastCompletedTrick ? lastCompletedTrick.trickNumber : null);

  return (
    <View style={styles.trickContainer}>
      {/* Completed trick winner banner during 2-second hold */}
      {isFrozen && winnerSeat ? (
        <View style={styles.frozenWinnerBanner}>
          <Text style={styles.frozenWinnerText}>
            🏆 الأكلة {trickNum} — فاز بها: <Text style={styles.frozenWinnerHighlight}>{seatArabicName(winnerSeat)}</Text> ({teamLabel(teamOfSeat(winnerSeat))})
          </Text>
        </View>
      ) : lastCompletedTrick && plays.length === 0 ? (
        <View style={styles.lastWinnerBadge}>
          <Text style={styles.lastWinnerText}>
            الأكلة {lastCompletedTrick.trickNumber} فاز بها: <Text style={styles.lastWinnerHighlight}>{seatArabicName(lastCompletedTrick.winnerSeat)}</Text> ({teamLabel(teamOfSeat(lastCompletedTrick.winnerSeat))})
          </Text>
        </View>
      ) : null}

      {/* 4-Compass Trick Arena */}
      <View style={styles.trickArena}>
        {seats.map((seat) => {
          const play = currentPlays.find((p) => p.seat === seat);
          const isSeatActive = !isFrozen && activeSeat === seat && !play;
          const isWinnerCard = isFrozen && winnerSeat === seat;
          const slotStyle = getTrickSlotStyle(seat);
          const isLana = teamOfSeat(seat) === "NORTH_SOUTH";

          if (play) {
            return (
              <View key={seat} style={[styles.trickCardSlot, slotStyle]}>
                <View
                  style={[
                    styles.trickSeatTag,
                    isLana ? styles.seatTagLana : styles.seatTagLahum,
                    isWinnerCard && styles.seatTagWinner,
                  ]}
                >
                  <Text
                    style={[
                      styles.trickSeatTagText,
                      isWinnerCard && styles.trickSeatTagTextWinner,
                    ]}
                  >
                    {isWinnerCard ? `👑 ${seatArabicName(seat)}` : seatArabicName(seat)}
                  </Text>
                </View>
                <CardView
                  card={play.card}
                  size="medium"
                  highlight={isWinnerCard}
                  winnerGlow={isWinnerCard}
                />
              </View>
            );
          }

          return (
            <View key={seat} style={[styles.trickEmptySlot, slotStyle, isSeatActive && styles.trickActiveEmptySlot]}>
              <Text style={[styles.trickEmptySlotText, isSeatActive && styles.trickActiveEmptyText]}>
                {isSeatActive ? "يلعب الآن" : seatArabicName(seat)}
              </Text>
            </View>
          );
        })}
      </View>
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
  card,
  enabled,
  index,
  total,
  onPress,
}: {
  card: Card;
  enabled: boolean;
  index: number;
  total: number;
  onPress?: ((cardId: CardId) => void) | undefined;
}) {
  const offset = index - (total - 1) / 2;
  const rotation = `${offset * 2.2}deg`;
  const translateY = enabled ? -10 : 0;
  const transform = [{ rotate: rotation }, { translateY }];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`ورقة ${card.rank} ${suitArabic(card.suit)}`}
      accessibilityHint={enabled ? "اضغط للعب هذه الورقة" : "هذه الورقة غير قانونية في الدور الحالي"}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => onPress?.(card.id)}
      style={({ pressed }) => [
        styles.cardButton,
        { transform: [{ rotate: rotation }, { translateY: pressed && enabled ? -16 : translateY }] },
        enabled ? styles.cardEnabled : styles.cardDisabled,
        pressed && enabled ? styles.cardPressed : null,
      ]}
    >
      <CardView card={card} highlight={enabled} />
    </Pressable>
  );
}

function SeatView({
  label,
  seatRole,
  team,
  active,
  isDealer,
  cardCount,
  style,
}: {
  label: Seat;
  seatRole: string;
  team: "LANA" | "LAHUM";
  active: boolean;
  isDealer: boolean;
  cardCount?: number | undefined;
  style?: object;
}) {
  return (
    <View style={[styles.seatPod, style]}>
      <View
        style={[
          styles.avatarWrap,
          team === "LANA" ? styles.avatarLana : styles.avatarLahum,
          active && styles.avatarActive,
        ]}
      >
        <Text style={[styles.avatarInitial, team === "LANA" ? styles.avatarInitialLana : styles.avatarInitialLahum]}>
          {seatInitial(label)}
        </Text>
        {isDealer ? (
          <View style={styles.dealerChip}>
            <Text style={styles.dealerChipText}>D</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.seatBadge, active && styles.seatBadgeActive]}>
        <View style={styles.seatHeaderRow}>
          <Text style={[styles.seatLabel, active && styles.seatLabelActive]}>{seatArabicName(label)}</Text>
          {active ? (
            <View style={styles.activeTurnPill}>
              <Text style={styles.activeTurnPillText}>دوره</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.seatMetaRow}>
          <Text style={styles.seatSub}>{seatRole}</Text>
          {cardCount !== undefined ? <Text style={styles.cardCount}>🂠 {cardCount}</Text> : null}
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

function projectLabel(type: ProjectCandidate["type"]): string {
  switch (type) {
    case "SERA": return "سِرَا";
    case "FIFTY": return "خمسين";
    case "HUNDRED": return "مية";
    case "FOUR_HUNDRED": return "أربعمية";
  }
}

function formatProjectCards(cards: readonly CardId[]): string {
  return cards
    .map((id) => {
      const [suit, rank] = id.split("-");
      return suit && rank ? `${rank}${suitSymbol(suit as Suit)}` : id;
    })
    .join(" ");
}

function ProjectPanel({
  candidates,
  declared,
  onProject,
}: {
  candidates: readonly ProjectCandidate[];
  declared: readonly ProjectDeclaration[];
  onProject?: ((projectId: string) => void) | undefined;
}) {
  const declaredIds = new Set(declared.map((item) => item.candidate.id));
  const available = candidates.filter((candidate) => !declaredIds.has(candidate.id));
  if (available.length === 0) return null;

  return (
    <View style={styles.projectPanel}>
      <View style={styles.projectHeaderRow}>
        <Text style={styles.projectTitle}>إعلان المشاريع المتاحة</Text>
      </View>
      <View style={styles.projectChoices}>
        {available.map((candidate) => (
          <Pressable
            key={candidate.id}
            accessibilityRole="button"
            onPress={() => onProject?.(candidate.id)}
            disabled={!onProject}
            style={({ pressed }) => [styles.projectChoice, pressed && styles.projectChoicePressed]}
          >
            <Text style={styles.projectChoiceTitle}>
              {projectLabel(candidate.type)} (+{candidate.qaydValue} قيد)
            </Text>
            <Text style={styles.projectChoiceCards}>{formatProjectCards(candidate.cards)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CardView({
  card,
  size = "standard",
  highlight = false,
  winnerGlow = false,
}: {
  card: Card | null;
  size?: "standard" | "medium" | "compact";
  highlight?: boolean;
  winnerGlow?: boolean;
}) {
  if (!card) {
    return (
      <View
        style={[
          styles.card,
          size === "medium" && styles.mediumCard,
          size === "compact" && styles.compactCard,
          styles.emptyCard,
        ]}
      >
        <Text style={styles.emptyCardText}>—</Text>
      </View>
    );
  }

  const red = isRedSuit(card);

  return (
    <View
      style={[
        styles.card,
        size === "medium" && styles.mediumCard,
        size === "compact" && styles.compactCard,
        highlight && styles.cardHighlight,
        winnerGlow && styles.cardWinnerGlow,
      ]}
    >
      {/* Top corner rank and suit */}
      <View style={styles.cardCornerTop}>
        <Text style={[styles.rank, size === "compact" && styles.compactRank, red && styles.redColor]}>
          {card.rank}
        </Text>
        <Text style={[styles.suitIconSmall, size === "compact" && styles.compactSuitIcon, red && styles.redColor]}>
          {suitSymbol(card.suit)}
        </Text>
      </View>

      {/* Center suit symbol */}
      <Text
        style={[
          styles.centerSuit,
          size === "medium" && styles.mediumCenterSuit,
          size === "compact" && styles.compactCenterSuit,
          red && styles.redColor,
        ]}
      >
        {suitSymbol(card.suit)}
      </Text>

      {/* Bottom corner rank and suit */}
      <View style={styles.cardCornerBottom}>
        <Text style={[styles.rank, size === "compact" && styles.compactRank, red && styles.redColor]}>
          {card.rank}
        </Text>
        <Text style={[styles.suitIconSmall, size === "compact" && styles.compactSuitIcon, red && styles.redColor]}>
          {suitSymbol(card.suit)}
        </Text>
      </View>
    </View>
  );
}

function BiddingPanel({
  phase,
  exposedCard,
  actions,
  hokumSuits,
  history,
  onBiddingAction,
}: {
  phase: string;
  exposedCard: Card | null;
  actions: readonly BiddingActionType[];
  hokumSuits: readonly Suit[];
  history: readonly {
    readonly seat: Seat;
    readonly phase: "FIRST_ROUND" | "SECOND_ROUND";
    readonly action: BiddingActionType;
    readonly actionId: string;
    readonly turnNumber: number;
    readonly stateVersion: number;
  }[];
  onBiddingAction?: ((action: BiddingActionType, suit?: Suit) => void) | undefined;
}) {
  const hasSun = actions.includes("BUY_SUN");
  const hasExposedHokum = actions.includes("BUY_HOKUM_EXPOSED");
  const hasHokum = actions.includes("BUY_HOKUM");
  const hasAshkal = actions.includes("BUY_ASHKAL");
  const hasKasho = actions.includes("DECLARE_KASHO");
  const hasPass = actions.includes("PASS");
  const recent = history.slice(-4);

  return (
    <View style={styles.biddingPanel}>
      <View style={styles.biddingPanelHeader}>
        <View>
          <Text style={styles.biddingPanelTitle}>قرار المزايدة</Text>
          <Text style={styles.biddingPanelPhase}>{formatPhase(phase)}</Text>
        </View>
        {phase === "SECOND_ROUND" && exposedCard ? (
          <View style={styles.biddingExposedMini}>
            <Text style={styles.biddingExposedMiniLabel}>المكشوف</Text>
            <Text style={[styles.biddingExposedMiniValue, isRedSuit(exposedCard) && styles.redColor]}>
              {exposedCard.rank}{suitSymbol(exposedCard.suit)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.biddingPanelHint}>
        اختر العقد المتاح لك أو مرّر الدور بـ «بس»
      </Text>

      <View style={styles.biddingPrimaryRow}>
        {hasSun ? <Action action="BUY_SUN" onPress={onBiddingAction} /> : null}
        {hasExposedHokum ? <Action action="BUY_HOKUM_EXPOSED" onPress={onBiddingAction} /> : null}
        {hasAshkal ? <Action action="BUY_ASHKAL" onPress={onBiddingAction} /> : null}
        {hasKasho ? <Action action="DECLARE_KASHO" onPress={onBiddingAction} /> : null}
      </View>

      {hasHokum ? (
        <View style={styles.biddingSuitSection}>
          <Text style={styles.biddingSectionLabel}>اختر لون الحكم</Text>
          <View style={styles.biddingSuitRow}>
            {hokumSuits.map((suit) => (
              <Action
                key={`BUY_HOKUM-${suit}`}
                action="BUY_HOKUM"
                suit={suit}
                onPress={onBiddingAction}
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasPass ? (
        <View style={styles.biddingPassRow}>
          <Action action="PASS" onPress={onBiddingAction} />
        </View>
      ) : null}

      {recent.length > 0 ? (
        <View style={styles.biddingRecent}>
          <Text style={styles.biddingRecentTitle}>آخر المزايدات</Text>
          <View style={styles.biddingRecentRows}>
            {recent.map((item) => (
              <View key={item.actionId} style={styles.biddingRecentRow}>
                <Text style={styles.biddingRecentSeat}>{seatArabicName(item.seat)}</Text>
                <Text style={styles.biddingRecentAction}>{biddingActionArabic(item.action)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Action({
  action,
  suit,
  onPress,
}: {
  action: BiddingActionType;
  suit?: Suit;
  onPress?: ((action: BiddingActionType, suit?: Suit) => void) | undefined;
}) {
  const buttonStyle = getActionButtonStyle(action);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={actionAccessibilityLabel(action, suit)}
      accessibilityHint="اضغط لتأكيد قرار المزايدة"
      onPress={() => onPress?.(action, suit)}
      style={({ pressed }) => [
        styles.actionBtn,
        buttonStyle,
        pressed && styles.actionBtnPressed,
      ]}
    >
      <Text style={styles.actionBtnText}>{actionLabel(action, suit)}</Text>
    </Pressable>
  );
}

function actionAccessibilityLabel(action: BiddingActionType, suit?: Suit): string {
  return `اختيار ${actionLabel(action, suit)} في المزايدة`;
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

function seatRoleLabel(seat: Seat, playerSeat: Seat): string {
  if (seat === playerSeat) return "أنت";
  if (teamOfSeat(seat) === teamOfSeat(playerSeat)) return "الشريك";
  return "خصم";
}

function teamLabel(team: TeamId): string {
  return team === "NORTH_SOUTH" ? "لنا" : "لهم";
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

function RoundResult({
  score,
  matchScore,
  matchEnd,
  onNextRound,
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
        <Text style={styles.matchScoreNumbers}>
          {matchScore.NORTH_SOUTH} لنا — {matchScore.EAST_WEST} لهم
        </Text>
      </View>

      {matchEnd.status === "FINISHED" ? (
        <Text style={styles.finishedStatus}>
          انتهت الصكّة · الفائز: {matchEnd.winnerTeamId === "NORTH_SOUTH" ? "لنا" : "لهم"}
        </Text>
      ) : null}
      {matchEnd.status === "EXTRA_DEAL" ? <Text style={styles.extraDealStatus}>تعادل — توزيع إضافي</Text> : null}

      {canContinue ? (
        <Pressable accessibilityRole="button" onPress={onNextRound} style={styles.nextRoundBtn}>
          <Text style={styles.nextRoundBtnText}>
            {matchEnd.status === "EXTRA_DEAL" ? "توزيع إضافي" : "الجولة التالية"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "92%",
    zIndex: 25,
  },
  contractHud: {
    flexDirection: "row",
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
    flexDirection: "row",
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    width: "100%",
  },
  balootBanner: {
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(245, 158, 11, 0.22)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    alignItems: "center",
  },
  balootBannerText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
  },
  declaredProjectsContainer: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(5, 18, 14, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    alignItems: "center",
    gap: 2,
  },
  declaredProjectsTitle: {
    color: "#6EE7B7",
    fontSize: 8,
    fontWeight: "800",
  },
  declaredProjectList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
  },
  declaredChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  declaredChipText: {
    color: "#A7F3D0",
    fontSize: 8,
    fontWeight: "800",
  },
  projectPanel: {
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(5, 18, 14, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    maxWidth: 280,
    alignItems: "center",
  },
  projectHeaderRow: {
    marginBottom: 4,
  },
  projectTitle: {
    color: "#E8D49B",
    fontSize: 9,
    fontWeight: "900",
  },
  projectChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  projectChoice: {
    minWidth: 80,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(165, 180, 252, 0.4)",
    alignItems: "center",
  },
  projectChoicePressed: {
    opacity: 0.72,
  },
  projectChoiceTitle: {
    color: "#EDE9FE",
    fontSize: 9,
    fontWeight: "900",
  },
  projectChoiceCards: {
    color: "#C7D2FE",
    fontSize: 7,
    marginTop: 1,
  },
  exposedContainer: {
    alignItems: "center",
    backgroundColor: "rgba(5, 18, 14, 0.8)",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  exposedBadge: {
    marginBottom: 5,
  },
  exposedBadgeText: {
    color: "#F5E6BF",
    fontSize: 9,
    fontWeight: "800",
  },
  trickContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  frozenWinnerBanner: {
    marginBottom: 4,
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  frozenWinnerText: {
    color: "#FEF3C7",
    fontSize: 10,
    fontWeight: "900",
  },
  frozenWinnerHighlight: {
    color: "#FDE68A",
    fontWeight: "900",
  },
  lastWinnerBadge: {
    marginBottom: 4,
    backgroundColor: "rgba(5, 18, 14, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  lastWinnerText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "700",
  },
  lastWinnerHighlight: {
    color: "#FCD34D",
    fontWeight: "900",
  },
  trickArena: {
    width: 250,
    height: 165,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  trickCardSlot: {
    position: "absolute",
    alignItems: "center",
    gap: 2,
    zIndex: 10,
  },
  trickEmptySlot: {
    position: "absolute",
    width: 46,
    height: 66,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  trickActiveEmptySlot: {
    borderColor: "#34D399",
    borderWidth: 1.5,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
  },
  trickEmptySlotText: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  trickActiveEmptyText: {
    color: "#34D399",
    fontWeight: "900",
  },
  trickNorth: {
    top: 2,
    left: 102,
  },
  trickSouth: {
    bottom: 2,
    left: 102,
  },
  trickEast: {
    right: 12,
    top: 48,
  },
  trickWest: {
    left: 12,
    top: 48,
  },
  trickSeatTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  seatTagLana: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  seatTagLahum: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "rgba(248, 113, 113, 0.4)",
  },
  seatTagWinner: {
    backgroundColor: "rgba(245, 158, 11, 0.35)",
    borderColor: "#F59E0B",
    borderWidth: 1.5,
  },
  trickSeatTagText: {
    color: "#F8FAFC",
    fontSize: 7,
    fontWeight: "800",
  },
  trickSeatTagTextWinner: {
    color: "#FFFBEB",
    fontWeight: "900",
  },
  seatPod: {
    position: "absolute",
    alignItems: "center",
    zIndex: 15,
  },
  north: {
    top: 36,
  },
  west: {
    left: 8,
    top: "34%",
  },
  east: {
    right: 8,
    top: "34%",
  },
  south: {
    position: "absolute",
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  southTurnRibbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(5, 18, 14, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  turnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  turnDotActive: {
    backgroundColor: "#34D399",
  },
  turnDotInactive: {
    backgroundColor: "#94A3B8",
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
    color: "#6EE7B7",
    fontWeight: "900",
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
    backgroundColor: "rgba(5, 18, 14, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  seatBadgeActive: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(10, 35, 26, 0.95)",
  },
  seatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  seatLabel: {
    color: "#E2E8F0",
    fontSize: 9,
    fontWeight: "700",
  },
  seatLabelActive: {
    color: "#FDE68A",
    fontWeight: "900",
  },
  activeTurnPill: {
    backgroundColor: "#059669",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTurnPillText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },
  seatSub: {
    color: "#94A3B8",
    fontSize: 7,
  },
  seatMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardCount: {
    color: "#CBD5E1",
    fontSize: 7,
    fontWeight: "800",
  },
  hand: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 74,
    marginTop: 1,
  },
  cardButton: {
    marginHorizontal: 2,
    borderRadius: 6,
  },
  cardEnabled: {
    opacity: 1,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  card: {
    width: 46,
    height: 66,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  mediumCard: {
    width: 44,
    height: 64,
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
  cardWinnerGlow: {
    borderColor: "#F59E0B",
    borderWidth: 2.5,
    backgroundColor: "#FFFDF5",
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
    fontSize: 18,
    lineHeight: 18,
  },
  mediumCenterSuit: {
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
  actionFeedback: {
    position: "absolute",
    top: 44,
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
  bidHistory: {
    marginTop: 4,
    maxWidth: 250,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(5, 18, 14, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  bidHistoryTitle: {
    color: "#F5E6BF",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 3,
  },
  bidHistoryRows: {
    gap: 2,
  },
  bidHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  bidHistorySeat: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "800",
    minWidth: 38,
    textAlign: "right",
  },
  bidHistoryAction: {
    color: "#FDE68A",
    fontSize: 8,
    fontWeight: "900",
  },
    biddingPanel: {
    width: 292,
    maxWidth: "94%",
    marginBottom: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(5, 18, 14, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.45)",
    alignItems: "stretch",
    gap: 5,
  },
  biddingPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  biddingPanelTitle: {
    color: "#F5E6BF",
    fontSize: 11,
    fontWeight: "900",
  },
  biddingPanelPhase: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 1,
  },
  biddingExposedMini: {
    minWidth: 44,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    alignItems: "center",
  },
  biddingExposedMiniLabel: {
    color: "#D8C28A",
    fontSize: 7,
    fontWeight: "700",
  },
  biddingExposedMiniValue: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
  },
  biddingPanelHint: {
    color: "#CBD5E1",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  biddingPrimaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  biddingSuitSection: {
    gap: 3,
  },
  biddingSectionLabel: {
    color: "#D8C28A",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },
  biddingSuitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  biddingPassRow: {
    alignItems: "center",
    paddingTop: 1,
  },
  biddingRecent: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  biddingRecentTitle: {
    color: "#94A3B8",
    fontSize: 7,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  biddingRecentRows: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 3,
  },
  biddingRecentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  biddingRecentSeat: {
    color: "#CBD5E1",
    fontSize: 7,
    fontWeight: "700",
  },
  biddingRecentAction: {
    color: "#FDE68A",
    fontSize: 7,
    fontWeight: "900",
  },
  actionBtnPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
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
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.6)",
  },
  actionKasho: {
    backgroundColor: "#6D28D9",
    borderColor: "#DDD6FE",
  },
  actionDefault: {
    backgroundColor: "#1E293B",
  },
  resultCard: {
    minWidth: 260,
    maxWidth: 320,
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
    backgroundColor: "rgba(0, 0, 0, 0.35)",
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
