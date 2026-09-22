# صكّة بلوت — Product Vision

**Document:** Product Vision  
**Version:** 0.1.0  
**Status:** Draft for Review  
**Product:** صكّة بلوت (Sakkah Baloot)  
**Platforms:** iOS, Android  
**Primary Locale:** Arabic (`ar-SA`)  
**Secondary Locale:** English (`en`)  
**Last Updated:** 2026-09-21

---

## 1. Executive Summary

صكّة بلوت هي لعبة بلوت سعودية متعددة اللاعبين للهواتف المحمولة، مصممة من البداية لتقديم تجربة لعب تنافسية واجتماعية عالية الجودة، مع واجهة حديثة، أداء مستقر، قواعد لعب موثوقة، ونظام Multiplayer قادر على التعامل مع الانقطاع وإعادة الاتصال دون إفساد المباراة.

المنتج ليس مجرد نسخة رقمية من طاولة بلوت. الهدف هو بناء منتج ألعاب Mobile-first تكون فيه:

- جودة اللعب الأساسية هي الأولوية.
- عدالة المباراة غير قابلة للتفاوض.
- السيرفر هو السلطة النهائية على حالة المباراة.
- تجربة المستخدم سريعة وواضحة.
- الجانب الاجتماعي جزء أساسي من المنتج.
- الهوية البصرية مرتبطة بالبلوت والسياق السعودي دون ازدحام بصري.
- كل قواعد اللعبة قابلة للاختبار وإعادة التشغيل بشكل حتمي.
- البنية التقنية تسمح بإضافة Ranked وSeasons وTournaments وغيرها دون إعادة بناء الـCore Engine.

---

## 2. Product Identity

### 2.1 Product Name

**صكّة بلوت**

الاسم الإنجليزي المستخدم في الكود والأنظمة:

`Sakkah`

الاسم الكامل:

`Sakkah Baloot`

### 2.2 Product Category

- Multiplayer Card Game
- Competitive Social Game
- Saudi Baloot

### 2.3 Platforms

الإطلاق الأساسي:

- iOS
- Android

الويب ليس منصة Gameplay أساسية في MVP، لكنه قد يستخدم لاحقًا للإدارة، الحساب، الدعوات، والمحتوى.

---

## 3. Product Vision

نبني لعبة بلوت يشعر اللاعب عند فتحها أنها:

1. حديثة.
2. سعودية الهوية دون مبالغة.
3. سريعة الاستجابة.
4. عادلة.
5. اجتماعية.
6. موثوقة في Multiplayer.
7. ممتعة حتى بعد مئات المباريات.

الرؤية ليست الوصول إلى أكبر عدد من الميزات، بل بناء **Core Gameplay ممتاز** ثم التوسع حوله.

---

## 4. Product Mission

تقديم تجربة بلوت رقمية موثوقة وممتعة على الجوال، تجمع بين:

- اللعب التنافسي.
- الجلسات الخاصة مع الأصدقاء.
- التواصل الاجتماعي.
- التقدم والإحصائيات.
- التخصيص البصري.
- المنافسة طويلة المدى.

---

## 5. Core Product Principles

### Principle 1 — Gameplay First

إذا تعارضت ميزة اجتماعية أو تجارية مع وضوح اللعب، تعطى الأولوية للعب.

### Principle 2 — Server Authority

لا يملك العميل القرار النهائي في:

- الدور.
- صحة الحركة.
- الأوراق المخفية.
- النتيجة.
- النقاط.
- الفائز.

العميل يرسل نية اللاعب، والسيرفر يتحقق منها وينفذها.

### Principle 3 — Fairness

كل اللاعبين يلعبون بنفس القواعد.

لا توجد عناصر مدفوعة تمنح:

- أوراقًا أفضل.
- معلومات إضافية.
- وقتًا إضافيًا غير متاح للآخرين.
- أفضلية مباشرة في نتيجة المباراة.

### Principle 4 — Mobile First

كل تجربة مصممة لشاشة الجوال ولمس الإصبع.

لا ننقل تصميم Desktop إلى Mobile.

### Principle 5 — Fast Interaction

الحركات الأساسية يجب أن تكون قصيرة وواضحة.

مثال:

`Select Card → Play`

وليس سلسلة تأكيدات غير ضرورية.

### Principle 6 — Recoverability

انقطاع الإنترنت لا يعني تلقائيًا خسارة المباراة.

يجب أن يدعم النظام:

- Reconnect
- State resynchronization
- Session recovery
- Timeout handling

### Principle 7 — Deterministic Core

قواعد اللعبة والحسابات يجب أن تكون deterministic قدر الإمكان.

نفس:

`Initial State + Actions`

يجب أن ينتج نفس:

`Final State`

### Principle 8 — Observable Systems

كل مباراة يجب أن تكون قابلة للتحليل من خلال:

- Logs
- Events
- Metrics
- Replays
- Error reporting

مع احترام الخصوصية.

### Principle 9 — Accessible by Default

المعلومات المهمة لا تعتمد على اللون وحده.

### Principle 10 — Scope Discipline

أي ميزة جديدة يجب أن تمر عبر تقييم واضح:

- هل تخدم Core Experience؟
- هل تحتاجها في MVP؟
- هل تزيد التعقيد؟
- هل تؤثر على Fairness؟
- هل تؤثر على الأداء أو الشبكة؟

---

## 6. Target Audience

### Primary Audience

لاعبو البلوت في السعودية والمنطقة العربية، خصوصًا مستخدمي الجوال الذين يعرفون قواعد البلوت أو لديهم استعداد لتعلمها.

### Secondary Audience

- اللاعبون الجدد على البلوت.
- مجموعات الأصدقاء والعائلة.
- اللاعبون الذين يفضلون المنافسة Ranked.
- اللاعبون الذين يهتمون بالتخصيص والإحصائيات.

### New Player Requirement

لا يجب افتراض أن كل مستخدم يعرف البلوت.

يجب أن يوفر المنتج مسارًا واضحًا للتعلم من خلال:

- Tutorial
- Practice/Bot game
- Rule explanations
- Contextual hints

---

## 7. Core Player Experience

الدورة الأساسية للمستخدم:

```text
Open App
  ↓
Home
  ↓
Quick Match / Private Room
  ↓
Matchmaking
  ↓
Game
  ↓
Round
  ↓
Score Update
  ↓
Game Result
  ↓
Rematch / Home
```

يجب أن يكون الانتقال من فتح التطبيق إلى بداية مباراة قصيرة قدر الإمكان للمستخدم العائد.

---

## 8. Core Gameplay Pillars

### 8.1 Clear

اللاعب يعرف دائمًا:

- من دوره.
- ماذا يمكنه أن يفعل.
- كم تبقى من الوقت.
- النتيجة.
- حالة الفريق.
- ما الذي حدث في الـTrick الحالي.

### 8.2 Responsive

الحركة الأساسية يجب أن تستجيب فورًا بصريًا، حتى لو كان تأكيد السيرفر يأتي لاحقًا.

يجب التفريق بين:

- UI feedback
- Authoritative game state

### 8.3 Social

المنتج يدعم:

- Friends
- Private rooms
- Quick reactions
- Chat
- Match history
- Rematch

لكن الأدوات الاجتماعية لا يجب أن تغطي معلومات اللعب المهمة.

### 8.4 Competitive

في المراحل اللاحقة:

- Ranked
- Rating
- Leaderboards
- Seasons
- Achievements

لكن المنافسة لا تدخل في MVP قبل تثبيت Core Gameplay.

---

## 9. MVP Definition

### 9.1 Must Have

MVP يجب أن يحتوي على:

#### Account

- Authentication
- Profile
- Username
- Basic avatar

#### Match

- Quick Match
- Four players
- Team assignment
- Match room
- Ready state

#### Gameplay

- Full core game loop
- Sun
- Hokm
- Card dealing
- Turns
- Legal move validation
- Trick resolution
- Scoring
- Round result
- Game result
- Timer

#### Multiplayer

- WebSocket connection
- Server authoritative state
- Reconnect
- State synchronization
- Disconnect handling
- Duplicate action protection

#### Post Game

- Result screen
- Basic statistics
- Rematch
- Return to home

#### Basic Social

- Basic chat
- Basic mute
- Basic report

---

## 10. MVP Exclusions

لن تدخل العناصر التالية في أول Gameplay milestone إلا بعد تثبيت الأساس:

- Voice chat
- Tournaments
- Clans
- Battle Pass
- Advanced cosmetics
- Spectator mode
- Complex seasonal progression
- Marketplace
- Advanced moderation automation
- 3D environments
- Open-world/social hub
- Cross-platform web gameplay

هذه ليست قرارات نهائية ضد الميزات؛ هي قرارات نطاق.

---

## 11. Post-MVP Roadmap

### V1

- Friends
- Ranked
- Leaderboards
- Seasons
- Achievements
- Emotes
- Cosmetic customization
- Better statistics
- Notifications

### V2

- Voice chat
- Tournaments
- Spectator mode
- Advanced replay
- Clans
- Events
- Advanced cosmetics

### Future

- Social spaces
- Creator/community features
- Competitive events
- Additional game modes if justified by product data

---

## 12. Competitive Integrity

المباراة التنافسية يجب أن تكون قابلة للتحقق.

المبادئ:

1. Hidden information remains server-side.
2. Client cannot assign score.
3. Client cannot select whose turn it is.
4. Client cannot force a card play.
5. Client cannot modify match state.
6. Server validates every gameplay action.
7. Important actions are recorded.
8. Suspicious patterns can be investigated from server events.

---

## 13. Monetization Principles

المنتج يمكن أن يستخدم Monetization من خلال عناصر تجميلية وخدمات اختيارية، لكن Core Gameplay يجب ألا يتحول إلى Pay-to-Win.

Possible monetization categories:

- Card backs
- Table themes
- Avatars
- Avatar frames
- Emotes
- Profile decorations
- Seasonal cosmetics
- Optional premium membership if justified

لا يتم اعتماد أي نموذج تجاري نهائي قبل دراسة:

- الاقتصاد الداخلي.
- الأسعار.
- سياسات المنصات.
- تأثيره على retention.
- تأثيره على fairness.

---

## 14. Social Safety

بما أن اللعبة Multiplayer، يجب أن تتضمن من البداية أساسيات السلامة:

- Mute
- Block
- Report
- Username validation
- Abuse reporting
- Rate limits
- Basic moderation tooling

أي نظام Chat يجب أن يكون قابلًا للتعطيل من الإعدادات.

---

## 15. Performance Goals

الأهداف الأولية:

### Client

- Smooth 60 FPS gameplay where device capability allows.
- Minimal dropped frames during card animations.
- Fast initial game screen.
- No unnecessary network-driven UI rerenders.

### Networking

- Low-latency action delivery.
- Server-side timestamps for authoritative timers.
- Robust reconnect.

### Server

- Deterministic game processing.
- No blocking database calls during critical gameplay actions where avoidable.
- Redis or in-memory active-room state as appropriate.
- Persistent storage asynchronously where safe.

الأرقام النهائية للـSLOs ستحدد في وثيقة Scalability بعد اختبار حقيقي.

---

## 16. Reliability Goals

Core game should tolerate:

- Temporary client disconnect.
- App backgrounding.
- Network switching.
- Server process restart with appropriate recovery strategy.
- Duplicate client requests.
- Delayed packets.
- Out-of-order messages where protocol design allows them.

The client must never assume that receiving a local UI event means the server accepted the action.

---

## 17. Design Direction

### Desired Character

- Premium
- Modern
- Saudi
- Calm
- Social
- Readable
- Game-first

### Avoid

- Excessive ornamentation.
- Heavy gradients everywhere.
- Oversized HUD.
- Tiny text.
- Excessive popups.
- Generic casino visual language.
- Cluttered table.
- UI that competes with the cards.

### Visual Priorities

1. Cards
2. Current turn
3. Table/trick
4. Score
5. Players
6. Secondary actions
7. Social controls

---

## 18. Audio Direction

Audio should communicate:

- Card interaction.
- Turn changes.
- Match found.
- Important game events.
- Round/game result.

Audio must be:

- Short.
- Distinct.
- Non-intrusive.
- Configurable.

Users can independently control:

- Music
- Effects
- Voice/chat audio
- Haptics

---

## 19. Accessibility

Initial requirements:

- RTL support.
- Arabic typography.
- Sufficient contrast.
- Reduced motion option.
- Haptic toggle.
- Audio toggle.
- Clear card/suit identification without relying on color only.
- Accessible labels for major interactive elements.

---

## 20. Localization

Arabic is the primary product language.

The system must support:

```text
ar-SA
en
```

Localization must cover:

- UI strings.
- Error messages.
- Notifications.
- Tutorial.
- Accessibility labels.
- Store metadata where applicable.

The game engine itself must not depend on human-language strings.

Bad:

```ts
if (message === "دورك") {}
```

Good:

```ts
if (event.type === "TURN_CHANGED") {}
```

---

## 21. Analytics Principles

Analytics should measure product behavior without becoming part of game logic.

Important initial events:

```text
app_opened
auth_completed
home_viewed
matchmaking_started
match_found
game_started
card_played
round_completed
game_completed
game_abandoned
disconnect_detected
reconnect_started
reconnect_success
reconnect_failed
rematch_requested
report_submitted
```

Gameplay events must avoid exposing unnecessary private information.

---

## 22. Architecture Constraints

The intended high-level flow is:

```text
Mobile UI
    ↓
Game Client
    ↓
WebSocket
    ↓
Authoritative Game Server
    ↓
Game Engine
```

The Game Engine must not import:

- React
- React Native
- Expo
- Supabase
- Redis
- PostgreSQL
- WebSocket libraries

The Game Engine is pure domain logic.

---

## 23. Technology Direction

### Mobile

- Expo
- React Native
- TypeScript
- React Native Skia
- Reanimated
- Gesture Handler

### Game Server

- Node.js
- TypeScript
- WebSocket-based transport

### Data

- PostgreSQL
- Supabase for database/auth/platform services
- Redis for active/ephemeral state where appropriate

### Testing

- Unit tests
- Integration tests
- Simulation tests
- Property-based tests where useful
- End-to-end tests

Exact library selection is documented separately in the technical architecture.

---

## 24. Product Decision Rules

When evaluating a new feature:

1. Does it improve the core player experience?
2. Does it improve retention without damaging fairness?
3. Does it introduce unnecessary complexity?
4. Does it require changes to the Game Engine?
5. Does it introduce security risk?
6. Does it require new persistent data?
7. Does it affect multiplayer synchronization?
8. Can it be postponed without blocking the core game?

If the answer to the last question is yes, the feature should normally remain outside the MVP.

---

## 25. Definition of Done for Product Decisions

A product feature is considered specified only when we know:

- Why it exists.
- Who uses it.
- What problem it solves.
- Where it appears.
- What actions are possible.
- What happens on success.
- What happens on failure.
- What happens offline.
- What analytics are required.
- What server behavior is required.
- What data is persisted.
- What security concerns exist.
- What tests are required.

---

## 26. Open Decisions

The following items intentionally remain open until the corresponding design/research phase:

- Final scoring details and rule variant.
- Exact matchmaking algorithm.
- Exact rating algorithm.
- Season duration.
- Monetization pricing.
- Voice provider.
- Final analytics provider.
- Final crash/error monitoring provider.
- Hosting topology.
- Initial scale targets.
- Final visual identity.
- Final card artwork.

These must not be invented by implementation agents.

---

## 27. Product North Star

The product should make a player think:

> "أقدر أدخل، ألعب بلوت بشكل واضح وعادل، وأستمتع مع الشباب بدون ما أحارب الواجهة أو الاتصال."

Everything else is secondary to achieving that experience.

---

## 28. Current Status

This document defines the initial product direction.

It is **not** permission to implement every feature listed above.

Before production coding begins, the following documents must be reviewed and approved:

1. Product Scope
2. Game Rules
3. Card System
4. Dealing
5. Bidding
6. Playing
7. Scoring
8. Game State
9. Actions
10. State Transitions
11. UX Flow
12. Technical Architecture

Changes to core game rules after implementation begins require:

- Documentation update.
- Engine change.
- Regression tests.
- Multiplayer compatibility review.
- Replay compatibility review.
