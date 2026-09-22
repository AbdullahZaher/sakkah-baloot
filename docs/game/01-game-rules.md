# صكّة بلوت — Game Rules Specification

**Document:** Game Rules  
**Version:** 0.1.0  
**Status:** Draft for Review  
**Depends On:**  
- `docs/product/01-product-vision.md`
- `docs/product/02-product-scope.md`

**Purpose:** تحويل قواعد البلوت إلى مواصفة قابلة للتنفيذ والاختبار دون ترك الحالات المهمة لتفسير الـUI أو الـAgent.

 > **Important:** هذا المستند هو Domain Specification وليس كودًا. القواعد المجمدة في Rule Freeze v1 هي سلطة التنفيذ. لا يجوز اختراع قواعد أو متغيرات خارج Rule Profile.

---

# 1. Rule Authority

## 1.1 لماذا نحتاج هذا الملف؟

لعبة البلوت تحتوي على اختلافات معروفة بين المجالس والنسخ الرقمية، خصوصًا في:

- تفاصيل الشراء.
- الأشكل.
- بعض حالات الإكة.
- المشاريع وأولويتها.
- الدبل والثري والفور.
- الكبوت.
- بعض حالات القطع والدق.
- بعض قواعد إعادة اليد.

لذلك لا يجوز أن نكتب:

> "طبّق قواعد البلوت المعتادة."

يجب أن يكون لكل حالة سلوك محدد.

## 1.2 Source Hierarchy

في صكّة، نريد **Rule Profile** محددًا بدل خلط قواعد عدة مصادر.

ترتيب أولوية المرجع:

1. القواعد الرسمية التي تعتمدها صكّة في نسخة الإطلاق.
2. اللائحة/القواعد السعودية المعتمدة التي يختارها المنتج كمرجع.
3. القواعد الموثقة في هذا المستند بعد اعتمادها.
4. اختلافات المجالس لا تدخل تلقائيًا في اللعبة الأساسية.

المصادر التي تمت مراجعتها أثناء إعداد هذه النسخة تشمل مرجعًا منشورًا للقوانين المعتمدة للاتحاد السعودي للرياضات الذهنية، ومراجع رقمية تفصيلية حديثة توضح مواضع اختلاف القواعد. هذه المصادر لا تعني أن كل تفاصيلها معتمدة تلقائيًا لصكّة.

## 1.3 Rule Profile

يجب أن يحتوي السيرفر مستقبلًا على مفهوم:

```ts
type RuleProfileId = string;
```

مثال:

```text
saudi-standard-v1
```

المباراة تحفظ `ruleProfileId` الذي لعبت به.

هذا مهم للـReplay وللمباريات القديمة إذا تغيرت القواعد مستقبلًا.

---

# 2. Game Definition

## 2.1 Players

- عدد اللاعبين: 4.
- عدد الفرق: 2.
- كل فريق يتكون من لاعبين.
- الشريكان يجلسان متقابلين.

المقاعد:

```text
        NORTH
          │
WEST ─────┼───── EAST
          │
        SOUTH
```

الفرق:

```text
Team A = NORTH + SOUTH
Team B = EAST + WEST
```

## 2.2 Direction

اتجاه اللعب:

**عكس عقارب الساعة** وفق ملف القواعد المعتمد للمشروع.

اللاعب الذي يبدأ أول أكلة هو اللاعب على يمين الموزع.

## 2.3 Deck

البلوت يستخدم 32 ورقة.

الرتب:

```text
A
K
Q
J
10
9
8
7
```

الأنواع:

```text
Hearts
Diamonds
Spades
Clubs
```

إجمالي الأوراق:

```text
4 suits × 8 ranks = 32 cards
```

---

# 3. Game Lifecycle

المباراة الكاملة تتكون من توزيعات/أيدي متتابعة حتى يتحقق شرط الفوز.

```text
WAITING_FOR_PLAYERS
    ↓
SEATING
    ↓
ROUND_STARTING
    ↓
DEALING
    ↓
BIDDING
    ↓
CONTRACT_SELECTED
    ↓
PROJECT_DECLARATION
    ↓
PLAYING
    ↓
SCORING
    ↓
ROUND_COMPLETE
    ↓
MATCH_END_CHECK (internal)
    │
    ├── Continue → ROUND_STARTING
    │
    └── End → MATCH_COMPLETE
```

المصطلح داخل النظام:

- `Game` = الصكة/المباراة الكاملة.
- `Round` أو `Hand` = توزيعة واحدة.
- `Trick` = أكلة واحدة.
- `Turn` = دور لاعب واحد.

---

# 4. Match Objective

الهدف الافتراضي:

**الوصول إلى 152 نقطة قيد.**

عند وصول أحد الفريقين إلى حد الفوز، يتم تطبيق قواعد الحسم الخاصة بالـRule Profile.

## 4.1 End Condition

الحالة الأساسية:

```ts
if (team.score >= 152) {
  evaluateMatchWinner();
}
```

إذا تجاوز الفريقان الحد في نفس التوزيعة، تتم المقارنة وفق قاعدة الـRule Profile المعتمدة.

إذا كان هناك تعادل نهائي، يتم تطبيق قاعدة التوزيعة الحاسمة المحددة في الـRule Profile.

---

# 5. Card Ranking

يجب عدم استخدام ترتيب واحد للبطاقات.

لدينا على الأقل:

1. Sun ranking.
2. Trump ranking.
3. Sequence/project ranking.

---

## 5.1 Sun Ranking

من الأقوى إلى الأضعف:

```text
A
10
K
Q
J
9
8
7
```

---

## 5.2 Trump Ranking

من الأقوى إلى الأضعف داخل نوع الحكم:

```text
J
9
A
10
K
Q
8
7
```

هذه قاعدة جوهرية:

> J الحكم أقوى من 9 الحكم، و9 الحكم أقوى من A الحكم.

---

# 6. Card Point Values

## 6.1 Sun / Non-Trump

القيم:

| Rank | Raw Points |
|---|---:|
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| J | 2 |
| 9 | 0 |
| 8 | 0 |
| 7 | 0 |

المجموع:

```text
120
```

ثم تضاف:

```text
+10 for the final trick
```

لإجمالي:

```text
130
```

**NOTE:** يجب تثبيت كيفية تحويل هذه الأبناط إلى نقاط القيد في ملف `06-scoring.md` وفق Rule Profile النهائي. لا يجوز للـUI تنفيذ التحويل بنفسه.

---

## 6.2 Trump

القيم داخل الحكم:

| Rank | Raw Points |
|---|---:|
| J | 20 |
| 9 | 14 |
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| 8 | 0 |
| 7 | 0 |

مجموع الورق قبل الأرض:

```text
152
```

ثم تضاف أرض آخر أكلة:

```text
+10
```

لإجمالي:

```text
162
```

---

# 7. Dealing

التوزيع الأساسي:

```text
3 cards
↓
2 cards
↓
5 cards per player
↓
one card exposed
↓
bidding
↓
remaining cards
```

في الصورة الأساسية للعبة:

- كل لاعب يحصل على 5 أوراق قبل الشراء.
- ورقة مكشوفة تحدد نوع الحكم المحتمل في الجولة الأولى.
- بعد تحديد العقد، تكتمل اليد إلى 8 أوراق.

التفاصيل التنفيذية الدقيقة للتوزيع يجب أن تكون في:

`docs/game/03-dealing.md`

ولا يجوز تكرار منطق التوزيع في أكثر من package.

---

# 8. Dealer

التوزيع ينتقل من لاعب إلى اللاعب التالي حسب اتجاه اللعب.

أول موزع في مباراة جديدة يجب أن يحدد بواسطة Rule Profile.

بعد ذلك:

```text
Dealer → next dealer
```

يجب أن يكون انتقال الموزع deterministic وموجودًا في GameState.

---

# 9. Bidding Overview

الشراء هو مرحلة مستقلة عن اللعب.

الحالة:

```text
BIDDING
```

وتنقسم إلى جولات حسب Rule Profile.

في النموذج الأساسي:

```text
Round 1
  ↓
Round 2
  ↓
No Contract
```

إذا لم يتم اختيار عقد وفق القواعد المعتمدة:

```text
HAND_CANCELLED / REDEAL
```

لكن تفاصيل إعادة اليد وانتقال الموزع يجب أن تكون صريحة في `03-dealing.md` و`04-bidding.md`.

---

# 10. Contract Types

صكّة تحتاج على الأقل إلى:

```ts
type Contract =
  | {
      type: 'SUN';
    }
  | {
      type: 'TRUMP';
      suit: Suit;
    }
  | {
      type: 'ASHKAL';
    };
```

**ASHKAL** يجب ألا يعامل كنوع ثالث مستقل في الـTrick Engine؛ بل يحتاج إلى تحويل واضح إلى contract semantics حسب القاعدة المعتمدة.

---

# 11. Sun

في الصن:

- لا يوجد نوع حكم.
- ترتيب جميع الأنواع هو ترتيب الصن.
- اللاعب ملزم باتباع النوع إذا كان لديه منه.
- إذا لم يكن لديه النوع المفتوح، يستطيع اختيار أي ورقة وفق قواعد اللعب.

---

# 12. Trump

في الحكم:

- نوع محدد يصبح Trump.
- أوراق Trump تستخدم ترتيب الحكم.
- عند عدم امتلاك النوع المفتوح، قد يصبح لعب الحكم إجباريًا حسب حالة الأكلة.
- إذا كان هناك حكم على الطاولة، ترتيب الحكم يحدد الفائز.

---

# 13. Follow Suit

قاعدة أساسية:

```text
if player.hasSuit(ledSuit):
    player MUST play ledSuit
```

إذا لم يملك النوع:

```text
player may play according to contract-specific rules
```

لا يجوز أن يقرر العميل `legalMoves`.

بل:

```text
Game Engine → getLegalMoves(state, playerId)
```

هو المصدر الوحيد.

---

# 14. Trick Resolution

كل أكلة تحتوي على 4 أوراق:

```text
Trick
├── Play 1
├── Play 2
├── Play 3
└── Play 4
```

بعد الورقة الرابعة:

```text
resolveTrick()
```

الـwinner يحدد بواسطة:

1. Trump cards الموجودة، إن وجدت.
2. Otherwise cards of led suit.
3. ترتيب الورق المناسب للعقد.

ثم:

```text
winner → next trick leader
```

---

# 15. First Trick

بداية الأكلة الأولى:

```text
leader = playerRightOfDealer
```

المشتري ليس بالضرورة هو الذي يبدأ الأكلة الأولى.

---

# 16. Subsequent Tricks

بعد كل أكلة:

```text
winnerOfPreviousTrick
        ↓
leaderOfNextTrick
```

ولا يسمح لأي لاعب آخر بفتح الأكلة.

---

# 17. Last Trick

الفريق الذي يفوز بالأكلة الأخيرة يحصل على:

```text
Earth bonus
```

قيمة الأرض:

```text
+10 raw points
```

ويجب ألا تضاف هذه القيمة أكثر من مرة.

---

# 18. Projects

المشاريع نظام مستقل عن Trick Resolution.

المشروع يجب أن يمثل كـDomain object:

```ts
interface Project {
  type: ProjectType;
  cards: CardId[];
  owner: PlayerId;
  team: TeamId;
  declaredAtTrick: number;
  revealedAtTrick: number | null;
}
```

الأنواع الأساسية:

```text
SERA
FIFTY
HUNDRED
FOUR_HUNDRED
BALOOT
```

لكن صلاحية كل نوع وقيمته وأولويته يجب أن تعتمد على Rule Profile.

---

# 19. Sequence Rules

الترتيب المستخدم في المشاريع:

```text
A
K
Q
J
10
9
8
7
```

مثال:

```text
A-K-Q
```

تسلسل صحيح.

أما:

```text
A-10-K
```

فليس تسلسلًا.

---

# 20. Project Non-Overlap

القاعدة الأساسية:

> لا يجوز للورقة نفسها أن تدخل في مشروعين مستقلين.

مثال:

إذا استخدمت:

```text
10♥ J♥ Q♥
```

في Sera، لا يمكن استخدام إحدى هذه الأوراق في مشروع آخر في نفس اليد.

الـEngine يجب أن يتحقق من ذلك.

---

# 21. Project Limits

وفق Rule Profile الأساسي:

- يوجد حد لعدد المشاريع التي يمكن أن يحتسبها الفريق.
- المشاريع المتداخلة لا تحتسب كأنها مشاريع مستقلة بلا حدود.
- ترتيب المشاريع المتنافسة يجب أن يحسم أي مشروع يثبت.

التفاصيل الدقيقة للأولوية والتعادل ستثبت في ملف `06-scoring.md` بعد اعتماد Rule Profile النهائي.

---

# 22. Project Declaration

المشروع يجب ألا يكون مجرد قيمة مخفية في يد اللاعب.

له Lifecycle:

```text
UNDECLARED
    ↓
DECLARED
    ↓
REVEALED
    ↓
VALIDATED
    ↓
COUNTED / REJECTED
```

لا يجوز للاعب تعديل المشروع بعد الإعلان.

---

# 23. Project Timing

يجب أن تكون نافذة الإعلان والكشف server-authoritative.

الـClient لا يرسل:

```text
"I have a project"
```

بعد انتهاء نافذة الإعلان.

بل يرسل action ضمن نافذة مسموحة:

```text
DECLARE_PROJECT
```

والسيرفر يتحقق من:

- المرحلة.
- الأكلة.
- اللاعب.
- البطاقات.
- صحة المشروع.
- توقيت الإعلان.

---

# 24. Baloot

البلوت مشروع خاص بالحكم.

يجب أن يتم تعريفه كحالة Domain مستقلة:

```text
BALOOT_CANDIDATE
        ↓
DECLARED
        ↓
VALIDATED
        ↓
COUNTED
```

ويجب منع إعلانه إذا لم تتحقق الشروط.

**تفاصيل قيمة البلوت وتوقيت إعلانه ستثبت في `06-scoring.md` و`05-playing.md` بعد اعتماد Rule Profile.**

---

# 25. Doubling

الدبل ليس Action عاديًا أثناء اللعب.

هو انتقال في Contract/Scoring State:

```text
NORMAL
   ↓
DOUBLED
   ↓
TRIPLE
   ↓
QUADRUPLE
   ↓
GAHWA
```

ولكن ليس كل انتقال مسموحًا في كل نوع عقد.

الـRule Profile يجب أن يحدد:

- من يملك حق الدبل.
- متى يمكن الدبل.
- من يرد.
- هل يمكن الثري.
- هل يمكن الفور.
- متى تصبح اليد مقفلة.
- كيف تتغير قيمة المشاريع.
- كيف تحسب القهوة.

---

# 26. Match Scoring vs Raw Points

يجب فصل مفهومين:

## Raw Points

الأبناط الناتجة عن الأوراق والأرض والمشاريع حسب طريقة الحساب.

## Score / Qaid

النقاط التي تضاف إلى سجل الصكة.

لا يجوز استخدام متغير واحد لكلا المفهومين.

مثال:

```ts
interface HandRawScore {
  teamA: number;
  teamB: number;
}

interface HandQaidScore {
  teamA: number;
  teamB: number;
}
```

---

# 27. Purchaser Success

نجاح المشتري لا يقرر من خلال عدد الأكلات فقط.

يجب أن يعتمد على:

```text
raw card points
+
earth
+
valid projects
+
valid baloot
+
contract
+
doubling state
```

ثم تتم المقارنة وفق scoring rules.

---

# 28. Purchaser Failure

إذا فشل المشتري وفق Rule Profile:

- فريق المشتري يحصل على النتيجة المقررة للفشل.
- الفريق الآخر يحصل على قيمة اللعب المقررة.
- المشاريع والبلوت والدبل تطبق وفق قواعدها.
- لا يسمح للعميل بحساب النتيجة.

---

# 29. Important Scoring Principle

لا تستخدم هذا:

```ts
if (opponentPoints > purchaserPoints) {
  purchaserLost = true;
}
```

بشكل مجرد.

بل يجب أن يكون لدينا:

```ts
evaluateContractResult({
  contract,
  rawPoints,
  projects,
  baloot,
  doubling,
})
```

ثم:

```ts
type ContractResult =
  | 'SUCCESS'
  | 'DRAW'
  | 'FAILURE';
```

---

# 30. Score Conversion

التحويل من الأبناط إلى نقاط القيد يجب أن يكون deterministic.

لا تستخدم floating point في منطق النقاط.

يفضل:

```ts
type RawPoints = number;
type QaidPoints = number;
```

مع قواعد تحويل صريحة واختبارات Boundary Tests.

أمثلة Boundary Tests:

```text
just below threshold
exact threshold
just above threshold
```

---

# 31. Match End

بعد حساب اليد:

```text
updateScores()
        ↓
checkMatchEnd()
        ↓
if finished:
    MATCH_COMPLETE
else:
    next dealer
    ↓
next hand
```

لا يتحقق العميل من نهاية الصكة.

---

# 32. Tie Handling

أي تعادل يجب أن يكون له تعريف واضح.

لدينا أنواع مختلفة من التعادل:

1. تعادل أثناء حساب يد.
2. تعادل عند الوصول إلى حد الفوز.
3. تعادل في المشاريع.
4. تعادل في اختيار الفائز بالأكلة.
5. تعادل في حالات الدبل.

كل واحدة يجب أن تكون حالة منفصلة.

---

# 33. Invalid Actions

كل Action يمكن رفضه.

أمثلة:

```text
PLAY_CARD when not player's turn
PLAY_CARD for card not owned
PLAY_ILLEGAL_CARD
BID after bidding closed
DECLARE_PROJECT after declaration window
DOUBLE after double window
RECONNECT with invalid session
```

كل رفض يجب أن يحتوي على Error Code.

مثال:

```ts
type GameErrorCode =
  | 'NOT_YOUR_TURN'
  | 'CARD_NOT_IN_HAND'
  | 'ILLEGAL_CARD'
  | 'BIDDING_CLOSED'
  | 'INVALID_CONTRACT'
  | 'PROJECT_WINDOW_CLOSED'
  | 'ACTION_ALREADY_PROCESSED';
```

---

# 34. Timeouts

الـtimeout لا يعتبر Client Action.

مثال:

```text
TURN_DEADLINE_REACHED
        ↓
Game Engine determines legal timeout behavior
        ↓
Apply server-generated action
```

السيرفر هو من يقرر انتهاء الوقت.

---

# 35. Disconnects

Disconnect لا يغير GameState فورًا إلا إذا انتهت فترة السماح المحددة.

الحالة:

```text
CONNECTED
    ↓
DISCONNECTED
    ↓
RECONNECT_WINDOW
    │
    ├── Reconnected → CONNECTED
    │
    └── Timeout → DEFAULT_ACTION / FORFEIT
```

السلوك النهائي يجب أن يكون Rule/Server Policy وليس UI behavior.

---

# 36. Duplicate Actions

كل Action يجب أن يحمل:

```ts
clientActionId: string;
```

السيرفر يحتفظ بالحركات المقبولة حديثًا.

إذا وصل نفس الـAction مرة ثانية:

```text
return previous result
```

بدل تنفيذها مرتين.

---

# 37. Ordering

الأحداث المهمة تحمل:

```ts
sequence: number;
```

مثال:

```text
100 GAME_STATE
101 CARD_PLAYED
102 TURN_CHANGED
103 CARD_PLAYED
```

لا يسمح للعميل بتطبيق event رقم 103 قبل التحقق من حالة 102.

---

# 38. Hidden Information

يجب عدم إرسال:

- أوراق الخصوم.
- ترتيب Deck الكامل.
- RNG seed السري أثناء اللعب.
- معلومات غير مسموح للاعب معرفتها.

Client state يجب أن يكون Player View:

```text
Full Server State
       ↓
Player Projection
       ↓
Client
```

وليس:

```text
Full Game State
       ↓
Every Client
```

---

# 39. Determinism

القاعدة الأساسية:

```text
Initial State
+
Ordered Actions
+
Rule Profile
=
Deterministic Result
```

يجب أن يستطيع الاختبار:

```ts
const finalA = replay(initialState, actions);
const finalB = replay(initialState, actions);

expect(finalA).toEqual(finalB);
```

---

# 40. Randomness

Shuffle يجب أن يستخدم RNG واضحًا وقابلًا للاختبار.

ممنوع أن يكون منطق الاختبار معتمدًا على:

```ts
Math.random()
```

بدون إمكانية حقن RNG.

مثال:

```ts
interface RandomSource {
  next(): number;
}
```

Production:

```text
Secure/approved RNG
```

Tests:

```text
Seeded RNG
```

---

# 41. State Invariants

في كل حالة يجب أن تكون هناك invariants.

## Deck

```text
Total cards = 32
```

## Hands

قبل اكتمال التوزيع:

```text
Known + unknown = 32
```

بعد اكتمال التوزيع:

```text
sum(hand sizes) = 32
```

## Trick

```text
0 <= trick.cards.length <= 4
```

## Player

لا يمتلك نفس Card ID مرتين.

## Turn

لا يوجد أكثر من لاعب واحد current turn.

---

# 42. Impossible States

يجب أن يفشل الـEngine بصراحة إذا حاول الوصول إلى حالة غير ممكنة.

أمثلة:

```text
5 cards in a completed trick
same card in two hands
current player does not exist
trump undefined during trump gameplay
score negative
round finished with unresolved trick
```

لا نعالجها بإخفائها في UI.

---

# 43. Rule Profile Configuration

يجب أن تكون القواعد القابلة للاختلاف configuration/domain policy وليست magic numbers.

مثال:

```ts
interface RuleProfile {
  id: RuleProfileId;

  winningScore: number;

  players: number;

  cards: number;

  allowSun: boolean;

  allowHokm: boolean;

  allowAshkal: boolean;

  biddingRounds: number;

  projectRules: ProjectRules;

  doublingRules: DoublingRules;

  redealRules: RedealRules;
}
```

لكن لا يجوز أن تكون كل قاعدة configuration فقط.

القواعد الجوهرية يجب أن تكون business logic قابلة للاختبار.

---

# 44. Digital Game vs Physical Table

في التطبيق يمكن إزالة بعض الأخطاء البشرية.

مثال:

في الطاولة الواقعية قد ينسى اللاعب إعلان مشروع.

في التطبيق:

- يمكن اكتشاف المشروع آليًا.
- يمكن إظهار نافذة إعلان في الوقت القانوني.
- يمكن منع الإعلان بعد انتهاء النافذة.

لكن يجب أن نقرر هل المنتج يريد:

1. محاكاة الطاولة الواقعية حرفيًا.
2. أو تجربة رقمية تمنع الأخطاء البشرية.

الافتراضي لصكّة:

**تجربة رقمية واضحة وعادلة، مع الحفاظ على جوهر القواعد.**

---

# 45. Bot Compatibility

Bot يجب أن يستخدم نفس:

```text
getLegalActions()
applyAction()
evaluateState()
```

التي يستخدمها اللاعب.

لا يجوز أن يكون للـBot Rules خاصة تمنحه معلومات غير متاحة للاعب.

Bot يمكنه اتخاذ قرارات أفضل، لكنه لا يحصل على Hidden Information.

---

# 46. Replay Compatibility

كل مباراة تحفظ:

```text
ruleProfileId
gameId
initialStateReference
orderedActions
finalResult
```

إذا تغيرت القواعد لاحقًا:

```text
old replay → old rule profile
new game   → new rule profile
```

لا نعيد تفسير مباراة قديمة باستخدام قواعد جديدة.

---

# 47. Testing Requirements

لكل قاعدة يجب أن توجد اختبارات.

## Example

```text
Sun ranking
A > 10 > K > Q > J > 9 > 8 > 7
```

Tests:

```text
A beats 10
10 beats K
K beats Q
...
```

## Trump

```text
J > 9 > A > 10 > K > Q > 8 > 7
```

## Follow Suit

```text
Has led suit → cannot play another suit.
No led suit → legal alternatives depend on contract state.
```

---

# 48. Property Tests

يجب اختبار خصائص عامة:

### Property 1

لا توجد بطاقة مكررة.

### Property 2

كل مباراة صحيحة تبدأ بـ4 لاعبين.

### Property 3

كل Trick يحتوي على ≤4 أوراق.

### Property 4

كل Card Played كانت موجودة في يد اللاعب قبل اللعب.

### Property 5

كل Turn ينتقل إلى لاعب صحيح.

### Property 6

Replay deterministic.

### Property 7

Score never becomes negative.

### Property 8

Completed game cannot accept gameplay actions.

---

# 49. Simulation Requirements

قبل Gameplay UI يجب تشغيل محاكاة كبيرة.

مثال:

```text
100,000 simulated hands
```

ثم:

```text
assert:
no duplicate cards
no invalid state
no invalid turn
no score corruption
no unresolved trick
```

الرقم النهائي للمحاكاة يحدد في QA strategy، لكن الـEngine يجب أن يكون قابلًا لذلك من البداية.

---

# 50. Rule Conflict Policy

إذا وجدت وثيقتان تعطيان نتيجتين مختلفتين:

```text
DO NOT GUESS
```

بل:

```text
OPEN_DECISION
```

ثم:

1. تحديد التعارض.
2. تحديد المصادر.
3. اختيار Rule Profile.
4. تحديث الوثيقة.
5. إضافة regression tests.
6. تحديث replay/version policy.

---

# 51. Frozen Rule Variants / Historical Open Decisions

كانت هذه الوثيقة تحتوي سابقًا على قائمة Open Decisions. تم إغلاقها ضمن Rule Freeze v1. أي تغيير لاحق يتطلب Rule Freeze revision جديدًا.

التنفيذ يعتمد على:
- `docs/02-RULE-PROFILE-SA.md`
- `docs/RD-20-RULE-FREEZE-v1.md`
- `docs/game/01-game-rules.md` through `docs/game/10-legal-move-specification.md`

لا توجد قرارات قواعد مفتوحة مصرح للـAgent بافتراضها داخل Domain Engine.