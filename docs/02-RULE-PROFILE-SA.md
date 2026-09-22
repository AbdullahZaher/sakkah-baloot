# صكّة بلوت — Saudi Rule Profile

```ts
export const SAUDI_BASELINE_CCW_V1 = {
  direction: "COUNTER_CLOCKWISE",
  match: {
    targetQaid: 152,
    bothCrossPolicy: "HIGHER_FINAL_TOTAL",
    // OPEN — present as a profile candidate only; Owner has not frozen equal-final-total handling.\n    // OPEN — equal final totals remain unresolved.
    equalFinalTotalPolicy: "OPEN",
    doubledTiePolicy: "INITIAL_DOUBLER_LOSES",
  },
  dealing: {
    firstDealer: "MATCH_SEED_DERIVED_AND_PERSISTED",
    exposedCardOwner: "BUYER",
    buyerHiddenCompletionCards: 2,
    otherHiddenCompletionCards: 3,
    finalHandSize: 8,
    ashkal: {
      exposedCardRecipient: "PARTNER",
      callerIsBuyer: true,
      buyerHiddenCompletionCards: 3,
    },
  },
  bidding: {
    rounds: 2,
    firstRoundAceSunPriority: "DEALER_RIGHT",
    secondRoundAceSunPriority: "DEALER_RIGHT",
    exposedAce: { thirdRound: false, naturalExposureRedeal: false },
  },
  ashkal: {
    enabled: true,
    firstRoundEligibleSeats: ["DEALER", "DEALER_LEFT"],
    secondRoundEligibleSeats: ["DEALER", "DEALER_LEFT"],
    callerIsBuyer: true,
    exposedCardRecipient: "PARTNER",
    contract: "SUN",
    passFinalBlocksLaterAshkal: true,
  },
  escalation: {
    hokum: {
      chain: ["NORMAL", "DOUBLE", "TRIPLE", "FOUR", "GAHWA"],
      window: "AFTER_LAST_THREE_BEFORE_FINAL_RAISE",
      closesWhen: "BUYER_RAISES_FINAL_CARDS",
      afterTrickStarts: false,
    },
    sun: { chain: ["NORMAL", "DOUBLE"], open: "CONTRACT_FINALIZED", close: "FINAL_CARDS_RAISED", afterCardCommit: false, afterTrickStarts: false, eligibility: "DOUBLER_TEAM_QAID_LE_100_AND_OPPONENT_QAID_GT_100" },
  },
  hokumPlayMode: {
    normal: "OPEN",
    double: "OPEN",
    triple: "OPEN",
    four: "OPEN_OR_LOCKED",
    gahwa: "OPEN",
    lockedAffects: "LEADING_ONLY",
  },
  projects: {
    maxPerHand: 2,
    oneCardOneProject: true,
    sequenceRank: ["A","K","Q","J","10","9","8","7"],
    values: {
      HOKUM: {
        SERA: { raw: 20, qaid: 2 }, FIFTY: { raw: 50, qaid: 5 },
        HUNDRED: { raw: 100, qaid: 10 }, BALOOT: { raw: 20, qaid: 2 },
      },
      SUN: {
        SERA: { raw: 20, qaid: 4 }, FIFTY: { raw: 50, qaid: 10 },
        HUNDRED: { raw: 100, qaid: 20 }, FOUR_HUNDRED: { raw: 200, qaid: 40 },
      },
    },
    // OPEN — numeric Triple/Four project multipliers are research/profile candidates, not Owner-frozen behavior.\n    multiplier: { NORMAL: 1, DOUBLE: 2, TRIPLE: 3, FOUR: 4, BALOOT: 1 },
    // OPEN — project comparison/coexistence edge semantics remain under Owner review.\n    tieBreak: "DEALER_RELATIVE_SEAT",
  },
  baloot: {
    enabledContracts: ["HOKUM"], samePlayerRequired: true,
    raw: 20, qaid: 2, multiplier: 1,
    independentOfProjectWinner: true, absorbedByHundred: true,
    optionalDeclaration: true,
    declarationTiming: "SECOND_K_OR_Q_BEFORE_CARD_COMMIT",
  },
  contract: {
    successThreshold: { SUN: 65, HOKUM: 81, comparison: "GREATER_OR_EQUAL" },
    buyerFailureAllocation: "FULL_CONTRACT_ROUND_VALUE_TO_OPPONENT",
  },
  conversion: {
    mode: "CONTRACT_SPECIFIC_TABLE", floatingPoint: false, exactTableRequired: true,
    HOKUM: { remainder_0_to_5: "DOWN", remainder_6_to_9: "UP", divisor: 10, total: 16 },
    SUN: { remainder_1_to_4: "DOWN", remainder_5: "PRESERVE", remainder_6_to_9: "UP", divisor: 5, total: 26 },
    complement: "FIXED_TOTAL_DERIVED_ONLY",
  },
  kaboot: {
    normal: { HOKUM: 25, SUN: 44 },
    escalation: {
      HOKUM: { NORMAL: 25, DOUBLE: 25, TRIPLE: 25, FOUR: 25 },
      SUN: { NORMAL: 44, DOUBLE: 44 },
      },
      reverse: {
        enabled: true, contract: "SUN", value: 88,
        buyerRelativeSeat: "DEALER_RIGHT", originalHandMustContainAce: true,
        buyerTeamTricks: 0, doubles: false,
      },
      gahwaOverridesKaboot: true, derivedOnly: true,
    },
  ika: {
    contract: "HOKUM",
    optional: true,
    leaderOnly: true,
    nonTrumpOnly: true,
    condition: "HIGHEST_REMAINING_CARD_OF_SUIT",
    representedOnCardPlayed: true,
    wrongDeclarationRejectsAction: true,
    partnerExemption: {
      enabled: true,
      trickPosition: "THIRD",
      partnerMustHaveOpenedTrick: true,
      partnerMustBeCurrentWinner: true,
      playerMustLackLeadSuit: true,
      qualifyingLead: ["ACE", "VALID_IKA"],
      legalBehavior: "ANY_CARD",
    },
  },
  trickLegality: {
    trumpLed: {
      thirdPartnerWinning: "ANY_TRUMP",
      thirdOpponentWinningHigherAvailable: "MUST_OVERTRUMP",
      thirdOpponentWinningNoHigherTrump: "ANY_TRUMP",
      fourthPartnerWinning: "ANY_TRUMP",
      fourthOpponentWinningHigherAvailable: "MUST_OVERTRUMP",
      fourthOpponentWinningNoHigherTrump: "ANY_TRUMP",
    },
    nonTrumpLedNoLeadSuit: {
      thirdPartnerWinningExempt: "ANY_CARD",
      thirdPartnerWinningWithTrump: "MUST_TRUMP",
      thirdOpponentWinningCurrentNonTrumpWithTrump: "MUST_TRUMP",
      thirdOpponentWinningCurrentTrumpHigherAvailable: "MUST_OVERTRUMP",
      thirdOpponentWinningCurrentTrumpNoHigher: "ANY_TRUMP",
      fourthPartnerWinning: "ANY_CARD",
      fourthOpponentWinningCurrentNonTrumpWithTrump: "MUST_TRUMP",
      fourthOpponentWinningCurrentTrumpHigherAvailable: "MUST_OVERTRUMP",
      fourthOpponentWinningCurrentTrumpNoHigher: "ANY_TRUMP",
    },
    lockedHokum: {
      affectsLeadingOnly: true,
      validIkaDoesNotBypass: true,
    },
  },
  timeout: { biddingSeconds: 8, playingSeconds: 30, playingTimeoutAction: "AFK_DISCONNECT_HANDLING", noRandomTimeoutCard: true },
  kasho: {
    bushatRanks: ["7","8","9"], trumpNineAllowed: true,
    explicitDeclaration: true, anyEligiblePlayerMayDeclare: true,
    priority: "CCW_ACTION_ORDER", window: "FIRST_BIDDING_UNTIL_PURCHASE_FINALIZED",
    actualPurchaseWaives: true, passDoesNotWaive: true,
    score: 0, dealerTransition: "ROTATE_RIGHT", noRoundScoring: true, idempotent: true,
  },
} as const;
```

**Critical:** the exact approved contract-specific conversion table must be stored explicitly; never replace it with generic division or floating-point rounding.

**Trick-legality canonicalization:** G-1/G-2/G-2P from Phase 14.Z.3 are represented explicitly above. The legal-move specification remains the behavioral source; this profile stores the configuration/predicate inputs only.
