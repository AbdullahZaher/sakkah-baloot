# Architecture Gates AD-01…AD-05

## AD-01 — PASS vs PASS_FINAL
Preserve semantic distinction. Final wire representation must be explicit and server-authoritative.

## AD-02 — GamePhase
Use stable phases:
`DEALING | FIRST_BIDDING | SECOND_BIDDING | ESCALATION_WINDOW | PLAYING | ROUND_RESOLVED | MATCH_FINISHED`
Do not create REDEAL, EXPOSED_ACE_PHASE, KABOOT_PHASE, or PROJECT_PHASE.

## AD-03 — COMPLETE_DEAL
Can remain an internal transition/event. Client receives only permitted information.

## AD-04 — MATCH_END_CHECK
Internal resolution step: ROUND_RESOLVED → score → match check → MATCH_FINISHED or next hand.

## AD-05 — Contract representation
```ts
type ContractState = {
  contract: "SUN" | "HOKUM";
  trumpSuit?: Suit;
  buyerPlayerId: PlayerId;
  buyerTeamId: TeamId;
  purchaseKind: "NORMAL" | "ASHKAL";
  multiplier: "NORMAL" | "DOUBLE" | "TRIPLE" | "FOUR";
  playMode: "OPEN" | "LOCKED";
  exposedCardRecipientId: PlayerId;
};
```
Do not collapse contract identity, purchase provenance, multiplier, and play mode into one enum.
