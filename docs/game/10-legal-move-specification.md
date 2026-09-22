# صكّة بلوت — Canonical Legal Move Specification


**Document:** `docs/game/10-legal-move-specification.md`  
**Phase:** Rule Freeze — Trick Legality Specification  
**Status:** CANONICAL / FREEZE-READY CORE  
**Scope:** Legal card selection during trick play  
**Applies to:** Saudi Baseline / Counter-Clockwise Rules Profile  
**Implementation Status:** Documentation only — no production engine implementation


---


# 1. Purpose


This document defines the canonical rules used to determine which cards a player is legally allowed to play during a trick.


The specification is intentionally separated from scoring.


Card legality is determined exclusively by the authoritative game state and the legal-move resolver.


Qaid, Raw Score, project scoring, contract scoring, Kaboot, and match scoring MUST NOT determine which card a player is legally allowed to play.


The authoritative domain API is:


```ts
getLegalMoves(state, playerId): LegalMove[]
````


The result MUST contain the actual legal card IDs available to the player.


The client MUST NOT independently derive card legality.


The server MUST recalculate legal moves before accepting every `PLAY_CARD` action.


---


# 2. Core Principle


The player must only be able to select cards that are legal for the current trick state.


The intended flow is:


```text
AUTHORITATIVE GAME STATE
        ↓
getLegalMoves(state, playerId)
        ↓
LEGAL CARD IDs
        ↓
CLIENT ENABLES ONLY LEGAL CARDS
        ↓
PLAYER SELECTS CARD
        ↓
SERVER REVALIDATES
        ↓
CARD_PLAYED
```


The UI MUST NOT expose illegal cards as selectable actions.


The server remains authoritative even if the client has received a previous legal-move projection.


---


# 3. Direction and Relative Trick Position


The game uses a global counter-clockwise direction.


All relative seat and trick-position calculations MUST use the shared relative-seat utility.


The implementation MUST NOT hardcode numeric seat indexes for rule semantics.


The legal-move engine MUST derive:


```ts
type TrickPosition =
  | "LEADER"
  | "SECOND"
  | "THIRD"
  | "FOURTH";
```


from the authoritative turn/trick state.


---


# 4. Contracts


The legal-move system supports:


```ts
type ContractType =
  | "SUN"
  | "HOKUM";
```


The legal-move resolver MUST know the active contract.


---


# 5. Card Suit Rules


## 5.1 Lead Suit


The lead suit is the suit of the first card played in the current trick.


If the first card is a non-trump card:


```text
leadSuit = card.suit
```


If the first card is a trump card in Hokum:


```text
leadSuit = trumpSuit
```


A trump-led trick is therefore treated as a trick whose lead suit is the trump suit.


---


# 6. Rule Priority


Legal-move evaluation MUST follow this conceptual order:


```text
TURN VALIDATION
      ↓
TRICK POSITION
      ↓
LEAD SUIT
      ↓
HAS LEAD SUIT?
      │
      ├── YES → MUST FOLLOW SUIT
      │
      └── NO
            ↓
         CONTRACT
            ↓
        SUN / HOKUM
            ↓
        VALID IKA?
            ↓
        TRUMP STATE
            ↓
        MUST TRUMP
            ↓
        MUST OVERTRUMP
            ↓
        REMAINING LEGAL CARDS
```


This order is normative.


The implementation MUST NOT evaluate Must-Trump or Must-Overtrump before determining whether the player can follow the lead suit.


---


# 7. Follow Suit


## 7.1 General Rule


If the player has at least one card matching the lead suit:


```text
HAS_LEAD_SUIT = true
```


the player MUST play a card of that suit.


All cards outside the lead suit are illegal.


This rule has priority over trump/cutting rules.


Example:


```text
Lead:
♥ A


Player hand:
♥ 7
♠ J
♦ A
♣ K
```


Legal:


```text
♥ 7
```


Illegal:


```text
♠ J
♦ A
♣ K
```


---


# 8. Sun — No Lead Suit


In Sun, there is no trump suit.


If the player does not have the lead suit:


```text
NO_LEAD_SUIT
+
CONTRACT = SUN
```


the player may play any card in their hand.


```text
LEGAL = ENTIRE_REMAINING_HAND
```


There is no:


```text
MUST_TRUMP
MUST_OVERTRUMP
CUTTING
```


in Sun.


---


# 9. Hokum — No Lead Suit


In Hokum, when the player does not have the lead suit, additional rules apply.


The evaluation order is:


```text
NO_LEAD_SUIT
      ↓
VALID IKA EXEMPTION?
      ↓
TRUMP ON TABLE?
      ↓
CURRENT WINNER
      ↓
TRUMP OBLIGATION
```


---


# 10. Ika


Ika is Hokum-only.


Ika is available only when the player is the trick leader and the required Ika card condition is satisfied.


The declaration is optional.


Ika is represented inside the card-play action:


```ts
type CardPlayedEvent = {
  type: "CARD_PLAYED";
  playerId: PlayerId;
  cardId: CardId;
  trickNumber: number;
  ikaDeclared: boolean;
  sequence: number;
};
```


An invalid Ika declaration MUST reject the entire `PLAY_CARD` action.


The rejection MUST produce zero state mutation.


---


# 11. Ika Partner Exemption

The Ika Partner Exemption is a specific third-player condition. It MUST NOT be generalized to every situation where a partner is winning and the player lacks the lead suit.

The exemption applies only when all predicates are true:

```text
CONTRACT = HOKUM
+
TRICK_POSITION = THIRD
+
PLAYER_HAS_NO_LEAD_SUIT
+
PARTNER_OPENED_THE_TRICK
+
CURRENT_WINNER = PARTNER
+
(
  PARTNER_LEAD_CARD_IS_ACE
  OR
  PARTNER_DECLARED_VALID_IKA
)
```

When the exemption applies:

```text
IKA_PARTNER_EXEMPTION = TRUE
→ ANY_CARD
```

The third player may play any remaining card, including trump.

The engine MUST evaluate authoritative trick history and MUST NOT infer the exemption merely because the partner is winning.

# 12. Hokum — No Lead Suit — No Trump on Table


If:


```text
CONTRACT = HOKUM
NO_LEAD_SUIT
NO_TRUMP_ON_TABLE
```


the current winner must be considered.


---


## 12.1 Opponent Is Current Winner


If the opponent is currently winning and the player has at least one trump:


```text
CURRENT_WINNER = OPPONENT
+
HAS_TRUMP
```


the player MUST play trump.


```text
MUST_TRUMP
```


All non-trump cards are illegal.


---


## 12.2 Opponent Is Current Winner — No Trump


If the opponent is currently winning and the player has no trump:


```text
NO_TRUMP
```


the player may play any remaining card.


```text
ANY_CARD
```


---


# 13. Partner Is Current Winner


The fact that the partner is currently winning does not automatically produce one universal Must-Trump rule.


The trick position MUST be considered.


---


## 13.1 Third Player — Partner Winning


When:


```text
TRICK_POSITION = THIRD
CURRENT_WINNER = PARTNER
NO_LEAD_SUIT
```


and the player has trump, the canonical Saudi baseline requires the player to trump unless the valid Ika exemption applies.


Therefore:


```text
HAS_TRUMP
+
NO_VALID_IKA
        ↓
MUST_TRUMP
```


If no trump exists:


```text
ANY_CARD
```


If the valid Ika exemption applies:


```text
ANY_CARD
```


including trump.


---


## 13.2 Fourth Player — Partner Winning


When:


```text
TRICK_POSITION = FOURTH
CURRENT_WINNER = PARTNER
NO_LEAD_SUIT
```


the player may play any legal remaining card.


```text
ANY_CARD
```


The player is not forced to trump merely because the partner is currently winning.


---


# 14. Trump on the Table

When at least one trump has already been played, legality depends on the trick position and the origin of the current winning trump. The engine MUST inspect the winning card and originating player.

## 14.1 Third Player — Trump Led

Partner's trump winning:
```text
THIRD + CURRENT_WINNER = PARTNER + WINNING_TRUMP_PLAYED_BY_PARTNER
→ ANY_TRUMP
```
No forced overtrump applies against the partner.

Opponent's trump winning:
- higher trump available → MUST_OVERTRUMP;
- no higher trump but player has trump → ANY_TRUMP;
- no trump → ANY_NON_TRUMP_CARD.

## 14.2 Fourth Player — Trump Led

Partner's trump winning:
```text
FOURTH + CURRENT_WINNER = PARTNER + WINNING_TRUMP_PLAYED_BY_PARTNER
→ ANY_TRUMP
```
No forced overtrump applies against the partner.

Opponent's trump winning:
- higher trump available → MUST_OVERTRUMP;
- no higher trump but player has trump → ANY_TRUMP;
- no trump → ANY_NON_TRUMP_CARD.

## 14.3 Non-Trump Lead — Third Player

If the third player cannot follow the non-trump lead:

- opponent winning on non-trump + trump available → MUST_TRUMP;
- opponent winning on trump + higher trump available → MUST_OVERTRUMP;
- opponent winning on trump + no higher trump + trump available → ANY_TRUMP;
- partner winning → Ika Partner Exemption if valid, otherwise MUST_TRUMP when trump exists.

## 14.4 Non-Trump Lead — Fourth Player

If the fourth player cannot follow the non-trump lead:

- partner winning → ANY_CARD;
- opponent winning on non-trump + trump available → MUST_TRUMP;
- opponent winning on trump + higher trump available → MUST_OVERTRUMP;
- opponent winning on trump + no higher trump + trump available → ANY_TRUMP.

# 15. Trump-Led Trick


If the first card of the trick is trump:


```text
LEAD_SUIT = TRUMP
```


then trump is the lead suit.


A player who has trump MUST follow trump.


```text
HAS_TRUMP
    ↓
MUST_FOLLOW_TRUMP
```


The ordinary Follow Suit rule therefore handles the primary legality requirement.


---


## 15.1 Trump-Led — Player Has Trump


Only trump cards are legal.


Example:


```text
Lead:
♠ 7


Player:
♠ K
♠ 8
♥ A
♦ K
```


Legal:


```text
♠ K
♠ 8
```


Illegal:


```text
♥ A
♦ K
```


---


## 15.2 Trump-Led — Player Has No Trump


If:


```text
LEAD_SUIT = TRUMP
+
PLAYER_HAS_NO_TRUMP
```


the player may play any non-trump card.


```text
ANY_NON_TRUMP_CARD
```


---


# 16. Trump Hierarchy


For Hokum:


```text
J > 9 > A > 10 > K > Q > 8 > 7
```


This hierarchy is used to determine:


* current trick winner
* whether a trump can overtake the current winner
* Must-Overtrump legality


The legal-move engine MUST use the canonical card-ranking function.


It MUST NOT duplicate ranking logic in multiple UI or resolver locations.


---


# 17. Locked Hokum


Locked Hokum affects leading only.


```ts
type HokumPlayMode =
  | "OPEN"
  | "LOCKED";
```


When:


```text
PLAY_MODE = LOCKED
+
TRICK_POSITION = LEADER
```


the player cannot lead trump if at least one non-trump card is available.


Example:


```text
Hand:
♠ J       // Trump
♥ A
♥ 7
♦ K
```


Legal opening cards:


```text
♥ A
♥ 7
♦ K
```


Illegal:


```text
♠ J
```


---


## 17.1 Locked Hokum — All Trump Hand


If every remaining card in the player's hand is trump:


```text
PLAY_MODE = LOCKED
+
ALL_REMAINING_CARDS = TRUMP
```


the player may lead trump.


Locked Hokum does not make the position impossible.


---


## 17.2 Locked Hokum — Non-Leader


If the player is not the trick leader:


```text
PLAY_MODE = LOCKED
+
TRICK_POSITION != LEADER
```


Locked Hokum has no effect on card legality.


The normal Follow Suit / Ika / Trump rules continue to apply.


---


# 18. Locked Hokum and Ika


Locked Hokum does not bypass the requirement that Ika be a valid non-trump lead.


Therefore:


```text
LOCKED
+
LEADER
+
VALID IKA
```


does not allow a trump lead.


Ika is evaluated as a valid non-trump lead and therefore remains subject to the Locked leading restriction.


---


# 19. Legal Move Constraints


The domain may expose explanatory constraint metadata:


```ts
type MoveConstraint =
  | "FOLLOW_SUIT"
  | "IKA_FREE_PLAY"
  | "MUST_TRUMP"
  | "MUST_OVERTRUMP"
  | "ANY_CARD";
```


This metadata is explanatory.


The primary output of the public API is the actual legal card set.


```ts
type LegalMove = {
  cardId: CardId;
  allowed: true;
  constraint?: MoveConstraint;
};
```


---


# 20. Canonical Public API


The public domain API is:


```ts
getLegalMoves(
  state: GameState,
  playerId: PlayerId
): LegalMove[]
```


The API MUST:


1. validate that it is the player's turn
2. identify trick position
3. identify lead suit
4. inspect the player's authoritative hand
5. determine contract
6. evaluate Follow Suit
7. evaluate Ika where applicable
8. evaluate current trick winner
9. evaluate trump state
10. evaluate Must-Trump
11. evaluate Must-Overtrump
12. apply Locked Hokum leading restrictions
13. return only legal card IDs


---


# 21. Server Validation


The client MUST NOT be trusted to enforce legality.


For every:


```ts
PLAY_CARD
```


the server MUST:


```text
AUTHORITATIVE STATE
       ↓
getLegalMoves()
       ↓
Does requested card exist?
       ↓
Is requested card legal?
       ↓
YES → apply action
NO  → reject action
```


An illegal card request MUST NOT mutate:


* hand
* trick
* turn
* score
* sequence
* replay state


---


# 22. Client Behavior


The client receives the legal card set and should make only those cards interactable.


The client MAY visually indicate why a card is legal or unavailable.


The client MUST NOT implement an independent copy of the game rules.


The client MUST NOT determine:


* Must Trump
* Must Overtrump
* Ika eligibility
* Follow Suit
* Locked Hokum
* trick winner


Those decisions belong to the domain engine/server.


---


# 23. Hidden Information


The legal-move system MUST respect hidden card information.


The server owns the complete authoritative state.


A player must never receive another player's hidden hand merely to calculate legal moves.


The player receives only information necessary for their own legal actions.


---


# 24. Bot Integration


Bots MUST use the same:


```ts
getLegalMoves()
```


API as human players.


Bots MUST NOT implement an independent legality system.


This guarantees that:


```text
Human
Bot
Replay Verification
Simulation
Multiplayer Server
Tests
```


share the same legality semantics.


---


# 25. Replay Verification


Replay verification MUST recompute legal moves from the authoritative historical state.


For every recorded:


```text
CARD_PLAYED
```


the verifier MUST be able to determine:


```text
Was this card legal?
```


using:


```ts
getLegalMoves(stateBeforeAction, playerId)
```


The replay system MUST NOT trust the recorded client-side legality metadata.


---


# 26. Determinism


Given the same:


```text
GameState
+
PlayerId
```


the function:


```ts
getLegalMoves(state, playerId)
```


MUST produce the same legal-card set.


It MUST NOT depend on:


* network arrival time
* UI state
* random numbers
* client ordering
* packet order
* wall-clock time


---


# 27. Scoring Separation


The following systems MUST NOT participate in legal card selection:


```text
Qaid
Raw scoring
Contract score
Project Qaid
Project Raw
Baloot Qaid
Kaboot
Match score
152 target
```


Legal moves are a trick-state concern.


Scoring is a round-resolution concern.


The architectural separation is:


```text
                    GAME STATE
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
    LEGAL MOVE ENGINE          ROUND RESOLUTION
          │                         │
 getLegalMoves()              Raw / Projects
          │                         │
          ↓                         ↓
   Legal Card IDs              Contract Result
                                    ↓
                                  Qaid
                                    ↓
                               Match Score
```


There MUST be no dependency:


```text
Qaid → getLegalMoves()
```


---


# 28. Canonical Decision Matrix

| Situation | Legal behavior |
|---|---|
| Has lead suit | MUST FOLLOW SUIT |
| Sun + no lead suit | ANY CARD |
| Valid Ika Partner Exemption | ANY CARD |
| Third + partner-winning non-trump lead + no lead suit + no exemption + trump | MUST TRUMP |
| Third + partner-winning non-trump lead + no lead suit + no trump | ANY CARD |
| Third + partner-winning trump-led trick | ANY TRUMP |
| Fourth + partner-winning trump-led trick | ANY TRUMP |
| Opponent-winning non-trump + no lead suit + trump | MUST TRUMP |
| Opponent-winning trump + higher trump available | MUST OVERTRUMP |
| Opponent-winning trump + no higher trump + trump available | ANY TRUMP |
| Opponent-winning trump + no trump | ANY NON-TRUMP CARD |
| Trump led + has trump | MUST FOLLOW TRUMP |
| Trump led + no trump | ANY NON-TRUMP CARD |
| Locked Hokum + leader + non-trump exists | CANNOT LEAD TRUMP |
| Locked Hokum + leader + all cards are trump | MAY LEAD TRUMP |
| Locked Hokum + non-leader | NO EFFECT |

# 29. Explicit Non-Rules


The implementation MUST NOT use any of the following simplified rules:


```text
"If player has no lead suit, always play trump."


"If player has trump, always play trump."


"If trump is on table, always overtrump."


"If partner is winning, player may always discard."


"If player is third, player must always trump."


"Locked Hokum affects every trick."


"Qaid determines card legality."


"Client determines legal cards."
```


These simplifications are not valid substitutes for the canonical matrix.


---


# 30. Remaining Edge-Case Verification

The final engine test suite MUST cover:

1. Third + partner winning + non-trump lead + no lead suit + trump + no Ika exemption.
2. Third + partner winning + partner lead Ace + no lead suit → Ika exemption.
3. Third + partner winning + valid Ika + no lead suit → Ika exemption.
4. Third + partner winning + non-Ace/non-Ika lead + no lead suit → MUST_TRUMP when trump exists.
5. Third + partner-winning trump-led trick → ANY_TRUMP.
6. Third + opponent-winning trump-led + higher trump → MUST_OVERTRUMP.
7. Third + opponent-winning trump-led + no higher trump + trump → ANY_TRUMP.
8. Third + opponent-winning non-trump-led + trump → MUST_TRUMP.
9. Third + opponent-winning non-trump-led + current winner trump + higher trump → MUST_OVERTRUMP.
10. Third + opponent-winning non-trump-led + current winner trump + no higher trump + trump → ANY_TRUMP.
11. Fourth + partner-winning trump-led trick → ANY_TRUMP.
12. Fourth + opponent-winning trump-led + higher trump → MUST_OVERTRUMP.
13. Fourth + opponent-winning trump-led + no higher trump + trump → ANY_TRUMP.
14. Fourth + partner winning + non-trump lead + no lead suit → ANY_CARD.
15. Fourth + opponent winning + non-trump lead + trump → MUST_TRUMP.
16. Fourth + opponent winning + current winner trump + higher trump → MUST_OVERTRUMP.
17. Fourth + opponent winning + current winner trump + no higher trump + trump → ANY_TRUMP.
18. Locked Hokum + leader + valid Ika → Ika remains non-trump and cannot bypass Locked.
19. Invalid Ika declaration → reject PLAY_CARD with zero mutation.
20. Ika declaration on non-highest remaining card → reject PLAY_CARD with zero mutation.
21. Duplicate PLAY_CARD request.
22. Stale client legal-move projection.
23. Reconnect followed by PLAY_CARD.
24. Deterministic legal-move result for identical authoritative state/player.

# 31. Evidence and Provenance


This specification incorporates the previously approved project decisions for:


* Counter-clockwise direction
* Ika
* Locked Hokum
* Follow Suit
* Must-Trump
* Must-Overtrump
* Trump-led tricks
* Legal move generation


External research is evidence and does not independently modify the project rules.


The canonical chain remains:


```text
Source Evidence
      ↓
Conflict
      ↓
Rules Owner Decision
      ↓
Canonical Rule
      ↓
Rule Profile
      ↓
Legal Move Specification
      ↓
Tests
```


---


# 32. Implementation Boundary


This document is a rules specification.


It does not authorize production implementation by itself.


Implementation begins only after:


```text
RULE_FREEZE = PASS
```


and after the Architecture Gate has been completed.


The eventual implementation MUST preserve this document as the canonical behavioral specification.


---


# 33. Freeze Status


Current status:


```text
TRICK_LEGALITY_CORE = SPECIFIED


RULE_FREEZE = NOT YET DECLARED
```


The complete Rule Freeze still depends on the remaining global blockers outside this document, including:


* Contract conversion/complement completion
* Bidding residue
* Sun priority
* Sun doubling window
* Incident policy
* Violation matrix
* First-dealer policy
* Timeout policy
* Action/event catalog
* Architecture Gates AD-01…AD-05
* Final provenance cleanup
* Implementation and test evidence after Freeze


No production engine code is authorized by this document.
