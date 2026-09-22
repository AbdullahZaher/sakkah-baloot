# RD-01 Amendment — Ashkal Exposed-Card Exception

**Project:** صكّة بلوت (Sakkah Baloot)  
**Status:** APPROVED  
**Related:** RD-01, RD-10

## Canonical rule

The general exposed-card rule remains:

```text
Normal purchase:
Buyer receives exposed card + 2 hidden cards.
Other players receive 3 hidden cards.
```

Ashkal is an explicit exception:

```text
Ashkal Caller
  = Buyer / Declarer

Caller Partner
  = Exposed-card Recipient
  = Exposed card + 2 hidden cards

Caller
  = 3 hidden cards
```

This follows the adopted Saudi-source baseline. BalootAI explicitly states that in Ashkal the caller remains the buyer while the caller's partner receives the exposed card. citeturn0search0

## Technical requirement

Do not model exposed-card ownership as:

```ts
exposedCardRecipientId = buyerPlayerId;
```

Instead:

```ts
type ContractActors = {
  buyerPlayerId: PlayerId;
  buyerTeamId: TeamId;
  exposedCardRecipientId: PlayerId;
};
```

Normal purchase:

```ts
exposedCardRecipientId = buyerPlayerId;
```

Ashkal:

```ts
exposedCardRecipientId = partnerOf(buyerPlayerId);
```

## Conservation invariant

Ashkal does not change deck conservation:

```text
20 initial
+ 1 exposed
+ 11 completion
= 32
```

Final state:

```text
4 players × 8 cards = 32
```

## Scope

This amendment changes only the identity of the exposed-card recipient in Ashkal. It does not change:

- the 32-card deck
- card rankings
- contract scoring
- project values
- Baloot
- Kaboot
- match target
- global counter-clockwise direction
