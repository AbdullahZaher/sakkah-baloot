# صكّة بلوت — Saudi Rule Profile

**Phase:** 14.x  
**Date:** 2026-09-22  
**Status:** DRAFT — NOT FROZEN

```yaml
direction:
  global: COUNTER_CLOCKWISE
  applies_to:
    dealing: true
    bidding: true
    play: true
    dealer_rotation: true
    relative_seat_terms: true

dealing:
  initial_cards_per_player: 5
  initial_pattern: [3, 2]
  exposed_card:
    enabled: true
    buyer_receives_exposed: true
    buyer_hidden_completion: 2
    non_buyer_hidden_completion: 3
  final_hand_size: 8

contracts:
  - SUN
  - HOKUM

doubling:
  HOKUM:
    chain: [NORMAL, DOUBLE, TRIPLE, FOUR, GAHWA]
  SUN:
    chain: [NORMAL, DOUBLE]
  ownership:
    DOUBLE: OPPONENT_OF_BUYER
    TRIPLE: BUYER
    FOUR: DOUBLER
    GAHWA: BUYER
  play_mode:
    DOUBLE: OPEN_BY_DEFAULT
    TRIPLE: OPEN
    FOUR: OPEN_OR_LOCKED
    GAHWA: OPEN
  window_boundary: UNRESOLVED

gahwa:
  terminal: true
  result: MATCH_WIN

projects:
  declaration_trick: 1
  reveal_compare_trick: 2
  values:
    HOKUM:
      SERA: 2
      FIFTY: 5
      HUNDRED: 10
      FOUR_HUNDRED: null
      BALOOT: 2
    SUN:
      SERA: 4
      FIFTY: 10
      HUNDRED: 20
      FOUR_HUNDRED: 40
      BALOOT: null
  multiplier:
    NORMAL: 1
    DOUBLE: 2
    TRIPLE: 2
    FOUR: 2
  baloot_multiplier:
    NORMAL: 1
    DOUBLE: 1
    TRIPLE: 1
    FOUR: 1

baloot:
  enabled_for: HOKUM_ONLY
  cards: [KING_OF_TRUMP, QUEEN_OF_TRUMP]
  value: 2
  declaration:
    required: true
    window: BEFORE_SECOND_CARD_LANDS
  multiplies_with_doubling: false

kaboot:
  detection:
    derived: true
    claim_action: false
  value:
    HOKUM: 25
    SUN: 44
  reversed_kaboot:
    enabled: true
    value: 88
    condition: UNRESOLVED_CANONICAL_DETAILS

kasho:
  initial_five_all_low_cards:
    eligible_ranks: [9, 8, 7]
    nine_trump_invalidates: false
  second_round_all_pass:
    cancel_hand: true
    score: 0
    rotate_dealer: true

ashkal:
  contract: SUN
  caller_is_buyer: true
  partner_receives_exposed_card: true
  eligibility:
    exact_seat_matrix: UNRESOLVED
    prior_wala_effect: true

match:
  target_qaid: 152
  gahwa_terminal: true

open:
  doubling_window_boundary: true
  project_edge_cases: true
  project_ties: true
  baloot_hundred_interaction: true
  kaboot_special_cases: true
  kasho_full_matrix: true
  ashkal_exact_eligibility: true
  scoring_conversion_edge_cases: true
  canonical_game_phase_names: true
  architecture_decisions_AD_01_to_AD_05: true
```

Rule Profile must be versioned and immutable for each match/replay.
