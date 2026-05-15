# ClyptAI 비즈니스 컨텍스트

> Version: 2026.05 · Updated for v1 launch

## 회사 개요

**회사명:** ClyptAI
**단계:** v1 (soft launch · 2026.05.12-13)
**카테고리:** AI 에이전트 트레이딩 인프라 (Crypto perpetual futures)
**핵심 가치 제안:** Retail 트레이더가 자기 자신의 AI 트레이딩 에이전트를 직접 만들고, Hyperliquid에서 비수탁으로 운영할 수 있게 하는 플랫폼

---

## 핵심 thesis

> **"Retail wants an adaptive agent they own, not a static strategy they consume."**

이 한 줄이 모든 제품 결정의 anchor.

- **adaptive**: 시장 변화에 LLM 추론으로 반응
- **they own**: 사용자가 직접 빌드하고 운영
- **not static**: 패턴매칭 템플릿이 아님
- **not consume**: 남의 전략 구독 모델이 아님

---

## 제품 설명

### 무엇을 하는 회사인가

ClyptAI는 retail 트레이더가 *자신만의 AI 에이전트*를 자연어와 GUI로 빌드하고, Hyperliquid 위에서 자동으로 perpetual futures 거래를 실행할 수 있게 하는 플랫폼이다.

사용자는:
1. 에이전트 캐릭터(이름, 스타일, 페르소나)를 설정
2. 데이터 소스·지표·리스크 한도를 정의
3. 배포 후 에이전트가 본인 규칙대로 자동 실행

모든 거래는 사용자의 Privy 비수탁 지갑에서 직접 서명되며, Hyperliquid의 Builder Code 프로그램을 통해 라우팅된다. 모든 동작은 실시간으로 Telegram 및 대시보드에 기록된다.

### 핵심 차별점 (Why ClyptAI)

1. **사용자 소유 에이전트** — 남의 전략을 구독하는 것이 아니라 본인이 빌드한 에이전트가 본인 규칙대로 실행
2. **Adaptive (vs. static)** — LLM 기반 추론으로 시장 조건 변화에 반응 (rule-based bot 한계 극복)
3. **Verified on-chain execution** — 모든 거래가 Hyperliquid 온체인에 기록, 조작 불가
4. **Non-custodial via Privy** — 자금이 ClyptAI를 거치지 않음. 사용자가 키 소유
5. **No silent moves** — 모든 진입·청산·이유가 Telegram + 활동 로그에 즉시 노출

---

## 제품 진화 (내부 컨텍스트)

> ⚠️ 외부 마케팅 카피에서 *pivot* 단어 사용 금지. 대신 "evolved", "sharpened", "based on user feedback" 사용.

ClyptAI는 두 번의 product iteration을 통해 현재 형태에 도달:

```
[Phase 1] Natural-language DIY trading templates
   ↓ Pattern matching이 brittle — 조건이 바뀌면 무너짐
[Phase 2] Python tools + 2-sided strategy marketplace
   ↓ IP / incentives / trust issues 본질적으로 해결 불가
[Phase 3 — Current] Adaptive agents users own and run
   ↓ Agent reasons, adapts, executes. v1 live.
```

**핵심 학습:**
- Retail은 *static strategy를 구독*하는 것이 아니라 *adaptive agent를 본인이 소유하고 운영*하는 것을 원함
- 두 페이즈 모두 "static" 한계로 실패 (rules가 static, 또는 strategy가 static)
- 현재 모델은 *user ownership + adaptive reasoning* 두 축으로 정렬

외부 노출 시 framing: *"We sharpened the product around our core thesis based on user feedback."*

---

## 주요 사용자 여정 (Pages)

| 화면 | 역할 |
|---|---|
| **Landing** | 마케팅, 신규 유저 획득, 웨이팅리스트 가입 |
| **Onboarding** | Privy 지갑 생성 (이메일 로그인), 에이전트 선택/빌드, 리스크 설정 |
| **Dashboard (대시보드)** | 자산, 에이전트 현황, 활동 로그, 3가지 지표 (등급/레벨/리더보드) |
| **My Agent (내 에이전트)** | 에이전트 관리, 활동 기록, Signal Desk |
| **Trade (거래하기)** | 실시간 차트 + 수동 거래 (에이전트 일시정지 시) |
| **Leaderboard (리더보드)** | 시즌 랭킹, P&L 기반 보상 |

---

## 핵심 개념

### 에이전트 (Agent)
사용자가 직접 빌드하는 AI 트레이더 페르소나.

**구성 요소:**
- **Name** (에이전트 이름)
- **Style** (트레이딩 스타일: trend / scalping / reversal 등 + 성격: patient / active / cold 등)
- **Sources** (어떤 데이터를 보는지)
- **Indicators** (어떤 지표를 사용하는지)
- **Risk caps** (포지션 크기, 일일 손실 한도, 절대 금지 행동)

**디폴트 프리셋 (Built-in):**

| 에이전트 | 전략 | 성격 |
|---------|------|------|
| **Aurelius** | Trend Following | Patient |
| **Kaito** | Scalping | Active |
| **Compass** | Reversal | Cold |

→ 사용자는 프리셋에서 시작하거나 처음부터 직접 빌드.

### 에이전트 일과 — Five Moments

에이전트의 하루는 5단계 루프로 구성:

| 단계 | 의미 |
|------|------|
| **Watch** | 차트·지표·시장 흐름을 실시간 관찰 |
| **Signal** | 사용자 규칙이 충족되면 자동 실행 |
| **Wait** | 규칙이 안 맞으면 진입 안 함, 계속 대기 |
| **Enter** | 한도 안에서 자동 진입, stop/target 사전 설정 |
| **Sleep** | 밤새 관찰·기록·필요 시 일시정지, 아침 리포트 |

### 사용자 온보딩 — Three Steps

```
1. Build (제작):     에이전트 이름·스타일 정하기
2. Configure (설정): 소스·지표·리스크 한도 선택
3. Deploy (배포):    본인이 다른 일 하는 동안 자동 작동
```

→ "Three steps. The agent does the rest."

### 실행 모드 (v1)

v1은 **auto-execution 단독**:
- 사용자가 사전 설정한 조건이 충족되면 에이전트가 자동 실행
- 모든 거래는 사용자가 미리 정한 risk caps 내에서만
- 모든 동작은 로그되어 Telegram + 대시보드에 실시간 노출
- **Pause 버튼**으로 언제든 즉시 중단

향후 roadmap:
- **Signal approval mode** (사용자가 각 신호 사전 승인 옵션)
- 단, v1 카피에서는 *signal-and-approve* 톤 사용 금지

---

## 비즈니스 모델

### 수수료 구조 — Hyperliquid Builder Code

모든 거래는 Hyperliquid의 Builder Code 프로그램을 통해 라우팅. 사용자가 거래당 내는 수수료는 **all-in flat fee** (별도 추가 없음).

#### 수수료 분배

```
거래당 수수료 = ClyptAI Builder Fee + Hyperliquid Taker Fee

T0 baseline:
   ClyptAI: 0.05%
   Hyperliquid: 0.045%
   = Total 0.095% (all-in)

T9 (최고 티어):
   ClyptAI: 0.018%
   Hyperliquid: 0.045%
   = Total 0.063% (all-in)
```

→ 에이전트는 봇이라 **taker 기준**으로 설계.
→ Hyperliquid taker 수수료(0.045%)는 고정. ClyptAI 빌더 수수료가 거래량에 따라 자동 인하.

#### Volume Tier 시스템 (30일 누적 거래량 기준)

| 티어 | 30D Volume | ClyptAI Fee | All-in Total | 영문 호칭 | 한글 호칭 |
|------|-----------|-------------|-------------|----------|---------|
| T0 | < $50K | 0.050% | 0.095% | Scout | 스카우트 |
| T1 | ≥ $50K | 0.048% | 0.093% | Operator | 오퍼레이터 |
| T2 | ≥ $250K | 0.045% | 0.090% | Strategist | 스트래티지스트 |
| T3 | ≥ $1M | 0.042% | 0.087% | Specialist | 스페셜리스트 |
| T4 | ≥ $5M | 0.038% | 0.083% | Veteran | 베테랑 |
| T5 | ≥ $25M | 0.034% | 0.079% | Pro | 프로 |
| T6 | ≥ $100M | 0.030% | 0.075% | Elite | 엘리트 |
| T7 | ≥ $250M | 0.026% | 0.071% | Prime | 프라임 |
| T8 | ≥ $500M | 0.022% | 0.067% | Apex | 에이펙스 |
| T9 | ≥ $1B+ | 0.018% | 0.063% | Sovereign | 소버린 |

#### 추가 보상

- **시즌 리더보드 Top 3** → 다음 시즌 -50% 수수료
- **거래량 누적** 자동 인하 (volume-driven discount)

### 수익 구조 원칙

- ✅ **Win or lose, same fee** (이기든 지든 동일)
- ✅ **No subscription** (구독료 0)
- ✅ **No profit share** (수익 분배 0)
- ✅ **The more you trade, the less you pay us** (거래량 ↑ → 수수료 ↓)

→ 사용자 거래 활동과 ClyptAI 인센티브 정렬. 헤지펀드 모델(거래량 클수록 더 떼감)과 반대.

---

## 인프라

### 지갑 — Privy

- **Privy** 임베디드 지갑 (이메일 로그인, 시드 구문 없음)
- **Non-custodial**: 사용자가 키 소유, ClyptAI는 자산 보유 안 함
- 외부 지갑 연결도 가능 (MetaMask, WalletConnect, Phantom 등 향후)
- 사용자가 언제든 자금 export 가능 (다른 지갑으로 이전)

### 거래소 — Hyperliquid 중심

**현재 (v1):**
- **Hyperliquid** 단독 (Builder Code 통합)
- 모든 perpetual futures 거래 라우팅

**Roadmap:**
- **Q3 2026:** Multi-venue routing (Hyperliquid + Aevo)
- **Q4 2026:** Prediction market agent (Polymarket 추가)

### AI 인프라

- **Anthropic Claude Partner Network 멤버**
- Claude 기반 LLM 추론 시스템
- 에이전트는 자연어로 소통하고 거래 결정 (rule-based 봇이 아님)

### 데이터 소스

- Hyperliquid 주문북·funding rates·체결 데이터
- On-chain 데이터 (TBD specific providers)
- Macro·뉴스 데이터 (TBD)

---

## 리스크 관리 시스템

### 사용자 설정 가능한 한도

- **일일 최대 손실** (Max Daily Loss): 사용자 정의
- **최대 포지션 크기** (Max Position Size): 사용자 정의
- **절대 금지 행동** (Never-do list): 특정 자산·시간대·전략 금지 설정
- **Risk presets:** Conservative / Moderate / Aggressive

### 안전장치

- **Pause 버튼**으로 모든 에이전트 즉시 정지 + resting orders 취소
- **All trades within pre-set limits** — 한도 밖 거래 불가
- **Real-time logging** — 모든 동작이 Telegram + 활동 로그에 즉시 기록
- **Manual override** — 일시정지 후 수동 거래 가능 (Trade 페이지)

---

## 타겟 유저

### 페르소나 우선순위 (v1)

**1. 바쁜 개인 투자자 (Primary)**
- 시장을 지켜볼 시간이 없음
- 본인 규칙대로 자동 실행되길 원함
- "Markets don't sleep. You can."

**2. 세미프로 트레이더 (Primary)**
- 자기만의 거래 규칙을 정확히 실행하고 싶음
- 수동 거래 + 에이전트 hybrid 활용
- 본인의 trading thesis를 에이전트로 구현

**3. 크립토 입문자 (Secondary)**
- 복잡한 설정 없이 시작하고 싶음
- 디폴트 프리셋 (Aurelius/Kaito/Compass)으로 출발
- 작은 자본으로 학습

**4. KOL / 인플루언서 (Tertiary)**
- 본인 에이전트 공유 (leaderboard 통해 인지도 ↑)
- 자신의 트레이딩 thesis를 콘텐츠화
- v1에서는 카피 트레이딩 수익 분배 모델 없음 — 인지도 + 리더보드 보상만

---

## 현재 지표 (v1 launch 기준 · 2026.05)

| 지표 | 값 |
|---|---|
| 웨이팅리스트 | 800+ |
| Soft launch | 2026.05.12-13 |
| 통합 거래소 | Hyperliquid |
| 지갑 인프라 | Privy (non-custodial) |
| AI 파트너십 | Anthropic Claude Partner Network |
| 제품 버전 | v1 |
| 시드 라운드 | $3M (raising at $20M post) |

---

## 경쟁 포지셔닝

### vs. Rule-based Trading Bots (3Commas, Pionex)
- **기존 봇:** Rule-based execution. 패턴매칭이 brittle. 시장 regime 변화에 무너짐. 2021년에 작동했지만 지금 안 됨.
- **ClyptAI:** LLM 기반 adaptive reasoning. 시장 조건 변화에 따라 행동 조정. "Reads the tape, not just the chart."

### vs. AI Agent Tokens (Aixbt, Virtuals)
- **AI agent tokens:** 인사이트·코멘트 게시. 실제 거래 안 함. 토론용.
- **ClyptAI:** Actually executes. Hyperliquid 위에서 실거래. 단순 신호가 아닌 실행 레이어.

### vs. HL Frontends (Vooi, Phantom)
- **HL frontends:** Hyperliquid를 그냥 wrapping한 거래 인터페이스. 빌더 코드 통합 정도.
- **ClyptAI:** Builder code 활용은 동일하지만 **agent 레이어**가 추가. 자동화 + 추론 + 사용자 통제까지.

### 핵심 차별화 매트릭스

| 기능 | 일반 봇 | AI Token | HL Frontend | **ClyptAI** |
|------|--------|----------|-------------|------------|
| Reasons in plain language | ❌ | ✅ | ❌ | ✅ |
| Actually executes trades | ✅ | ❌ | ✅ | ✅ |
| Custom persona + tone | ❌ | ✅ | ❌ | ✅ |
| Retail-friendly UX | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Non-custodial wallet | ❌ | ⚠️ | ✅ | ✅ |
| Gamified retention | ❌ | ❌ | ❌ | ✅ |

→ ClyptAI는 **6개 모두 충족하는 유일한 옵션**.

---

## 신뢰 시그널 (마케팅에 일관 노출)

마케팅 자산에 반복 노출되어야 하는 신뢰 요소:

- ✅ **Built on Hyperliquid via Builder Code program**
- ✅ **Non-custodial via Privy** ("Your keys, your funds")
- ✅ **Member of Anthropic Claude Partner Network**
- ✅ **All trades verified on-chain**
- ✅ **No silent moves** (모든 거래 로그)
- ✅ **Pause anytime** (언제든 일시정지)
- ✅ **The more you trade, the less you pay us** (수수료 인하)

---

## 브랜드 내러티브 키워드

### 영문
- **Gateway to Agent Trading**
- **Adaptive (not static)**
- **Build your own** (not consume someone else's)
- **Your rules trigger. The agent acts.**
- **Verified on-chain execution**
- **Non-custodial** (Your keys, your funds)
- **No silent moves**
- **Markets don't sleep. You can.**

### 한글
- **에이전트 트레이딩의 시작**
- **본인이 정한 규칙대로** (남의 전략 구독 아님)
- **본인의 규칙이 발동. 에이전트가 실행.**
- **온체인에서 직접 실행**
- **비수탁 · Privy** (본인의 키, 본인의 자산)
- **모든 거래는 기록됨**
- **시장은 잠들지 않아요. 본인은 자도 됩니다.**

---

## 카피 작성 시 주의 (요약)

### 절대 사용 금지
- ❌ Em-dash (—) — AI 생성 시그널
- ❌ "당신" (한글) — "본인" 또는 주어 생략
- ❌ "Pivot" (외부 카피) — "evolved" 또는 "sharpened"
- ❌ "Signal-and-approve" 톤 — v1은 auto-execution
- ❌ "Guaranteed returns" / "Beat the market" — 과장
- ❌ "Revolutionary" / "Industry-first" — 과장

### 적극 사용
- ✅ 두 박자 리듬 ("X. Y." 패턴)
- ✅ 구체적 수치 + 출처
- ✅ 사용자 통제 강조 ("your rules", "pause anytime")
- ✅ 자동 실행 정직하게 표현 ("trade alerts as they happen")
- ✅ 비수탁 + 온체인 trust signal 반복 노출

---

## 버전 히스토리

- **v1 (2026.05):** Auto-execution + Builder Code + Privy + T0-T9 티어. 800+ 웨이팅, soft launch
- **v0.4 (이전 beta):** Subscription + KOL marketplace 모델 (deprecated)
