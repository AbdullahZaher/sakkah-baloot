# Termination & Dealer Transition Matrix

| Trigger | Score | Match changed | Dealer | Next state |
|---|---:|---|---|---|
| Normal 8 tricks | resolved | Yes | Rotate Right | DEALING |
| Normal Kaboot | Kaboot | Yes | Rotate Right | DEALING |
| Reverse Kaboot | 88 | Yes | Rotate Right | DEALING |
| Gahwa | Match Win | Yes | N/A | MATCH_FINISHED |
| All Pass | 0–0 | No | Rotate Right | DEALING |
| Kasho/Bushat | 0–0 | No | Rotate Right | DEALING |
| Incident → Continue | unchanged | No | unchanged | prior phase |
| Incident → Cancel | policy-defined; default no round score | policy-defined | RuleProfile | DEALING |

Never create `GamePhase.REDEAL`.

```ts
type HandCancellation = {
  reason: HandCancellationReason;
  scoreAwarded: false;
  roundScore: null;
  matchScoreChanged: false;
  dealerTransition: DealerTransition;
  nextDealerPlayerId: PlayerId | null;
};
```

Termination must be idempotent: duplicate Kasho/cancellation cannot rotate the dealer twice.
