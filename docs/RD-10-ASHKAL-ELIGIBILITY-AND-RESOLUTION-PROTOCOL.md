# RD-10 — Ashkal Eligibility & Resolution Protocol

**Project:** صكّة بلوت (Sakkah Baloot)  
**Status:** APPROVED — Saudi-source baseline  
**Domain:** Bidding / Dealing / Authoritative Engine  
**Direction:** Counter-clockwise (`N → W → S → E`)

## 1. Canonical decision

The project adopts the Saudi-source Ashkal behavior.

### Eligibility

Ashkal is available to:
- the dealer
- the player sitting to the dealer's left

The Saudi-source rulebook reproduced by 8K Care states that Ashkal is for the dealer and the player on the dealer's left. BalootAI gives the same eligibility and additionally describes the second bidding round as allowing Ashkal for the eligible seat. citeturn0search2turn0search0

With the project's counter-clockwise direction:

```text
Dealer = N

N = Dealer
W = first player after Dealer
S = opposite
E = Dealer-left
```

Therefore the canonical eligibility predicate is relative to the dealer, not a hard-coded seat index.

## 2. Ashkal in both bidding rounds

Under the adopted Saudi-source profile:

### First round

```text
PASS
HOKUM
SUN
ASHKAL
```

Ashkal is available to the eligible seat.

### Second round

```text
PASS_FINAL ("ولا")
SECOND_HOKUM
SUN
ASHKAL
```

Ashkal remains available to the eligible seat provided the player has not already ended their bidding participation with `PASS_FINAL`.

BalootAI explicitly describes the second round as allowing Ashkal for the eligible seat. citeturn0search0

> Note: an alternate published rules source excludes Ashkal from the second round. This project intentionally does not adopt that variant because the Rules Owner selected the Saudi-source baseline.

## 3. Ashkal actors

Ashkal has two distinct player identities:

```ts
type ContractActors = {
  buyerPlayerId: PlayerId;
  buyerTeamId: TeamId;
  exposedCardRecipientId: PlayerId;
};
```

For normal purchase:

```text
buyerPlayerId = bidder
exposedCardRecipientId = buyerPlayerId
```

For Ashkal:

```text
buyerPlayerId = ashkalCaller
exposedCardRecipientId = partnerOf(ashkalCaller)
```

The Saudi-source descriptions explicitly state that the partner receives the exposed card while the caller remains the buyer. citeturn0search0turn0search1

Therefore:

```text
buyerPlayerId !== exposedCardRecipientId
buyerTeamId === exposedCardRecipientTeamId
```

## 4. Contract

Ashkal is Sun-style:

```ts
contract = SUN
```

It is not a separate contract type for scoring.

Recommended representation:

```ts
type PurchaseKind =
  | "HOKUM"
  | "SUN"
  | "ASHKAL";
```

where:

```ts
ASHKAL → contract = SUN
```

`PurchaseKind` preserves the bidding history while `ContractType` drives card rules and scoring.

## 5. Action

The client sends:

```ts
type BiddingAction =
  | { type: "PASS" }
  | { type: "PASS_FINAL" }
  | { type: "BUY_HOKUM"; suit: Suit }
  | { type: "BUY_SUN" }
  | { type: "CALL_ASHKAL" };
```

The server validates:

```ts
rules.canCallAshkal(
  playerId,
  biddingState,
  dealerSeat
)
```

The client must never decide Ashkal eligibility.

## 6. Eligibility predicate

Conceptually:

```ts
function canCallAshkal(
  playerId: PlayerId,
  state: BiddingState,
): boolean {
  if (state.phase !== "BIDDING") return false;

  if (state.playerStatus[playerId] === "PASS_FINAL") {
    return false;
  }

  if (!isAshkalEligibleSeat(playerId, state.dealerSeat)) {
    return false;
  }

  if (!isAshkalWindowOpen(state)) {
    return false;
  }

  return true;
}
```

Seat eligibility:

```ts
isAshkalEligibleSeat(player, dealer) =
  player === dealer
  || player === relativeSeat(dealer, "LEFT")
```

No numeric seat assumptions are permitted.

## 7. Ashkal resolution

When accepted:

```text
CALL_ASHKAL
    ↓
validate eligible caller
    ↓
purchaseKind = ASHKAL
    ↓
contract = SUN
    ↓
buyerPlayerId = caller
    ↓
buyerTeamId = caller.team
    ↓
exposedCardRecipientId = caller.partner
    ↓
complete deal
    ↓
PLAYING
```

## 8. Dealing after Ashkal

Normal purchase:

```text
Buyer:
  exposed + 2 hidden

Other 3 players:
  3 hidden each
```

Ashkal:

```text
Caller / Buyer:
  3 hidden

Caller Partner:
  exposed + 2 hidden

Other 2 players:
  3 hidden each
```

Conservation remains:

```text
20 initial cards
+ 1 exposed
+ 11 completion cards
= 32
```

Final hand size:

```text
8 cards × 4 players = 32
```

## 9. Why actor separation is mandatory

Do not use:

```ts
purchaserId
```

as the sole identity.

Ashkal creates a legitimate state where:

```text
buyerPlayerId
!=
exposedCardRecipientId
```

If these are collapsed, the following systems become error-prone:

- dealing
- hidden-card ownership
- replay
- audit
- UI display
- contract history
- bot simulation
- reconnect
- scoring attribution

## 10. Team semantics

The caller remains the buyer/declarer.

The partner receives the exposed card, but this does not make the partner the buyer.

Therefore:

```ts
buyerTeamId = teamOf(buyerPlayerId)
```

and never:

```ts
buyerTeamId = teamOf(exposedCardRecipientId)
```

The two values happen to be equal because partners are on the same team, but their player identities must remain distinct.

## 11. Interaction with Double

After Ashkal has established the purchase:

```text
purchaseKind = ASHKAL
contract = SUN
buyerPlayerId = caller
```

The later doubling system operates on the resulting contract according to RD-03.

If the project allows the Ashkal purchase to be doubled, the responder identity remains tied to the contract history, not to the partner who received the exposed card.

The double/triple/four chain must therefore reference:

```ts
buyerPlayerId
initialDoublerTeamId
purchaseKind
contract
```

not `exposedCardRecipientId`.

## 12. Interaction with Projects

Ashkal is Sun for project eligibility.

Therefore the Rule Profile should evaluate:

```ts
contract === "SUN"
```

for project rules.

`purchaseKind === "ASHKAL"` remains useful for audit/replay and dealing behavior.

## 13. Interaction with Reverse Kaboot

Reverse Kaboot is a Sun-only special case.

The reverse-Kaboot predicate must evaluate the actual buyer/declarer identity:

```ts
buyerPlayerId
```

not the exposed-card recipient.

Therefore, in Ashkal:

```text
buyer = Ashkal caller
partner = exposed-card recipient
```

The engine must not accidentally treat the partner as the buyer when checking any buyer-relative rule.

## 14. PASS_FINAL

`PASS_FINAL` is a bidding-state concept.

If a player has reached the second-round `ولا` state:

```ts
playerStatus[playerId] = "PASS_FINAL"
```

that player cannot later call Ashkal in the same hand.

This prevents an illegal return into an already-closed bidding position.

## 15. Event model

Recommended authoritative event:

```ts
type AshkalCalledEvent = {
  type: "ASHKAL_CALLED";
  callerPlayerId: PlayerId;
  buyerPlayerId: PlayerId;
  buyerTeamId: TeamId;
  exposedCardRecipientId: PlayerId;
  contract: "SUN";
  purchaseKind: "ASHKAL";
};
```

Do not emit a generic `BUY_SUN` event only; the Ashkal distinction affects dealing and replay.

## 16. Replay invariant

Given the same:

```text
dealerSeat
bidding actions
seat order
```

the replay must reconstruct:

```text
caller
buyer
partner
exposed-card recipient
contract
```

deterministically.

## 17. Validation matrix

| Situation | Ashkal |
|---|---|
| Dealer, first round | YES |
| Dealer-left, first round | YES |
| Dealer-right | NO |
| Dealer's partner | NO unless that seat is independently eligible |
| Ineligible seat | NO |
| First-round eligible player says Ashkal | YES |
| Second-round eligible player says Ashkal | YES |
| Player already said PASS_FINAL | NO |
| After bidding closes | NO |
| Ashkal caller's partner receives exposed card | YES |
| Caller remains buyer | YES |
| Contract | SUN |

## 18. Rule Profile

```ts
type AshkalRuleProfile = {
  enabled: true;

  eligibleSeats: {
    firstRound: RelativeSeat[];
    secondRound: RelativeSeat[];
  };

  contract: "SUN";

  exposedCardRecipient: "PARTNER";

  callerIsBuyer: true;

  passFinalBlocksLaterAshkal: true;
};
```

Canonical values:

```ts
eligibleSeats.firstRound = ["DEALER", "DEALER_LEFT"];
eligibleSeats.secondRound = ["DEALER", "DEALER_LEFT"];

contract = "SUN";
exposedCardRecipient = "PARTNER";
callerIsBuyer = true;
passFinalBlocksLaterAshkal = true;
```

## 19. Source conflict handling

The Saudi-source baseline is canonical for this project.

A separate published rule set says Ashkal is not available in the second round. That is treated as an alternate ruleset, not as a contradiction requiring engine redesign. citeturn0search14

The engine therefore keeps Ashkal eligibility in `RuleProfile` rather than hard-coding it.

## 20. Final status

**RD-10: COMPLETE**

- Eligibility: CLOSED
- First-round Ashkal: CLOSED
- Second-round Ashkal: CLOSED — Saudi baseline
- Caller identity: CLOSED
- Buyer identity: CLOSED
- Exposed-card recipient: CLOSED
- Contract: CLOSED — SUN
- PASS_FINAL interaction: CLOSED
- Server validation: CLOSED
- Replay model: CLOSED
- Rule Profile: CLOSED

No additional Ashkal rule decision is required for the current Saudi-baseline profile.
