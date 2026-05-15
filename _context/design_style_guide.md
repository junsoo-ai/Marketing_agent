# ClyptAI 디자인 스타일 가이드

> Version: 2026.05 · Updated for v1 launch

## 디자인 철학

> **"Density first; lines not boxes"**

참조 레퍼런스: **Bloomberg Terminal · TradeStation · Hyperdash · Linear**

### 4가지 핵심 원칙

1. **밀도 우선** — 박스(카드 그림자)보다 선(border)으로 구분
2. **액센트 절제** — Mint 컬러는 Primary Action과 Active Selection에만
3. **타이포그래피로 상태 표현** — 새 색상 추가 대신 font-weight + opacity 변화
4. **숫자는 Mono** — 모든 가격, 식별자, 수치는 JetBrains Mono

### 디스플레이 타이포 (마케팅 표면)

- **랜딩 헤로 / 히어로 헤드라인:** Clypt Bold, 0% kerning, 110% line height
- **대형 KPI 숫자:** Clypt Bold Stencil (스텐실 글리프로 차별화)
- **섹션 서브타이틀:** Clypt Regular, 0% kerning, 110% line height
- **본문/CTA/네비:** Public Sans Regular (본문 -1% kerning / CTA All Caps 0% kerning, 120% line height)
- **모든 숫자:** JetBrains Mono + tabular-nums (단, 디스플레이용 큰 숫자는 Clypt Bold Stencil 허용)

> ⚠️ **확인 필요:** Clypt 커스텀 패밀리(Bold / Bold Stencil / Regular)가 실제 deploy되어 있는지, 또는 Inter 같은 시스템 폰트로 fallback되는지 디자인 팀과 align 후 통일.

---

## 레이아웃 시스템

### 주요 화면별 그리드

**Dashboard (대시보드)**
- Desktop: LeftNav 220px + 메인 콘텐츠 (max-width 1400px, padding 40px)
- 핵심 섹션: 3가지 지표 (등급/레벨/리더보드), 포트폴리오, 활동 카드
- Tablet/Mobile: BottomTabBar로 전환, 단일 컬럼

**My Agent (내 에이전트)**
- Desktop ≥1280px: `[LeftNav 220] [AgentRail 240] [Conversation 1fr] [Activity Log 320]`
- Tablet 800–1279px: AgentRail 숨김 → topbar 드롭다운
- Mobile <800px: 단일 컬럼 + BottomTabBar + 드로어

**Trade (거래하기)**
- 고정 그리드: `[Chart 1fr] [OrderBook 240px] [Ticket 52/288px] [Agent Status 340px]`
- 최소 해상도: 1440×820px
- Ticket 컬럼: 에이전트 일시정지 시에만 활성화 (수동 거래)
- Hover로 52px → 288px 확장

**Leaderboard (리더보드)**
- 최대 너비 1240px, padding 36px
- My Position 카드 + 시즌 랭킹 테이블
- 모바일: 단일 컬럼 + 가로 스크롤 (테이블)

### 네비게이션 구조

- **Desktop:** LeftNav (220px 고정 사이드바) + TopBar (56px)
- **Mobile:** BottomTabBar (fixed bottom, safe-area-inset 대응)
- **공통 탭:** Dashboard / My Agent / Trade / Leaderboard

> Note: 이전 버전의 *Discover* (마켓플레이스) 탭은 v1에서 deprecated.

---

## 컴포넌트 패턴

### 버튼

**Primary (인버전)**
```
background: var(--fg)  →  color: var(--bg)
border-radius: 8–10px
font-weight: 600
height: 36–46px
```

**Accent (Mint)**
```
background: var(--accent)  →  color: var(--accent-on, #051210)
border-radius: 99px (pill) 또는 8px
```

**Ghost**
```
background: transparent
border: 1px solid var(--border-2)
color: var(--fg-2)
```

**Danger**
```
color: var(--bad)
border: 1px solid color-mix(in srgb, var(--bad) 32%, transparent)
```

**규칙:**
- 파괴적 액션(Pause, Close) → Danger 스타일
- 모든 버튼에 `cursor: pointer`
- Disabled: `opacity: 0.35–0.4`, `cursor: not-allowed`

### 카드

```css
background: var(--bg-card)       /* #10141b */
border: 1px solid var(--border)  /* #1a212d */
border-radius: 12–20px
/* 호버 시 */
border-color: var(--border-strong)  /* #313b4d */
transform: translateY(-1px)  /* 선택적 */
```

**원칙:** `box-shadow` 최소화. 그림자는 진짜 높이가 있을 때만(`--shadow-elev`).

### 인풋 필드

```css
background: var(--bg-input) 또는 var(--bg-card)
border: 1px solid var(--border-2)
border-radius: 8–10px
padding: 9–14px 12–16px
color: var(--fg)
font-size: 13.5–15.5px
outline: none
```

포커스 시: `border-color: var(--border-strong)` (별도 ring 없음)

### 레이블 / 아이브로우

```css
font-size: 10–11px
font-weight: 600
letter-spacing: 0.08–0.14em
text-transform: uppercase
color: var(--fg-4)
```

### 칩 / 배지

**상태 칩 (에이전트 상태)**
```
border-radius: 99px
padding: 5px 11px
display: inline-flex + gap
```

**Tier 칩 (JetBrains Mono)**
```
background: var(--bg-card)
border: 1px solid var(--border-2)
font-family: var(--font-mono)
font-size: 12–12.5px
border-radius: 99px
```

활성: mint 배경 틴트 + mint 테두리
비활성: `border-style: dashed`, opacity 0.65

### 모달 / 시트

```css
/* 오버레이 */
background: color-mix(in srgb, var(--bg) 70%, transparent)
backdrop-filter: blur(6px)

/* 패널 */
background: var(--bg-elev)
border: 1px solid var(--border-strong)
border-radius: 14–20px
box-shadow: var(--shadow-elev)
```

모바일에서는 Bottom Sheet: `border-radius: 14px 14px 0 0`

### 테이블 (거래 터미널, 리더보드)

```css
/* 헤더 */
font-size: 9px, font-weight: 600
letter-spacing: 0.08em, text-transform: uppercase
color: var(--fg-4)

/* 셀 */
font-family: var(--font-mono)
font-variant-numeric: tabular-nums
font-size: 11–11.5px
border-bottom: 1px solid var(--border)

/* 행 호버 */
background: var(--bg-hover)  /* rgba(180,200,230,0.04) */
```

### 진행 표시

**단계 표시 (온보딩, 3-Step Build/Configure/Deploy)**
```
3개의 flex bar (1px height each)
완료: background var(--fg) or var(--accent)
미완: background var(--border)
transition: all 220ms cubic-bezier(0.4, 0, 0.2, 1)
```

**Progress Bar (티어 진행률)**
```
height: 3–4px, border-radius: 99px
filled: var(--accent) or semantic color
background: var(--bg-2)
```

**Volume → Fee Tier Display**
- 사용자의 현재 티어 + 다음 티어까지 남은 거래량
- "30D Volume: $X / Next: $Y" 형식

---

## 스페이싱 & 반경 시스템

| 토큰 | 값 | 용도 |
|---|---|---|
| `--radius-xs` | 2px | 가장 날카로운 엣지 (CTA 버튼 일부) |
| `--radius-sm` | 4px | 인라인 배지, 코드 블록 |
| `--radius-md` | 6px | 작은 버튼 |
| `--radius-lg` | 8px | 일반 버튼, 인풋 |
| `--radius-xl` | 12px | 카드, 모달 작은 것 |
| `--radius-pill` | 9999px | 칩, 알약형 버튼 |

---

## 보더 시스템

```css
--border:        #1a212d   /* 기본 구분선 */
--border-2:      #232b3a   /* 인풋, 패널 간 구분 */
--border-strong: #313b4d   /* 버튼 아웃라인, 활성 경계 */
```

**원칙:** 실선 1px만. `border-style: dashed`는 비활성/점선 상태에만.

---

## 차트 & 데이터 시각화

### LiveSpark (소형 스파크라인)
- 실시간 틱 (1.6–2s 간격)
- 마지막 점에 pulse 애니메이션 dot
- fill 옵션: 선형 그라디언트 (상단 불투명 → 하단 투명)

### LivePrice (큰 차트)
- 수평 그리드: `rgba(180,200,230,0.04)` dashed
- 마지막 가격 라벨: 플래시 (상승 → good 배경, 하락 → bad 배경) 380ms
- Y축 레이블: 우측, JetBrains Mono 9.5px

### 캔들스틱 (거래 터미널)
- 상승: `var(--good)`, 하락: `var(--bad)`
- wick: strokeWidth 0.7px
- body: 캔들 너비의 68%
- MA 라인: `var(--accent)` 0.8px, opacity 0.55

### Equity Curve
- Gradient fill: 상단 28% 불투명 → 하단 0%
- 상승 stroke: `#34d399`, 하락: `#f87171`
- 결정론적 생성 (seed 기반, 새로고침에도 동일 모양)

---

## 상태 색상 시스템

### 에이전트 상태 (v1)

| 상태 | 컬러 | 사용 케이스 |
|---|---|---|
| Trading (활성 거래중) | `var(--good)` #4dd9a3 | 에이전트가 거래 실행 중 |
| Watching (관찰중) | `var(--accent)` #94f1e8 | 에이전트가 시장 모니터링 |
| Waiting (대기중) | `var(--info)` #7dafff | 조건 충족 대기 |
| Halted (정지됨) | `var(--bad)` #ff5e5e | 사용자가 일시정지 또는 risk cap 도달 |
| Idle (비활성) | `var(--fg-4)` #5d6878 | 배포되지 않은 에이전트 |

> Note: 이전 버전의 *Thinking* (사고중) / *Scanning* (스캔중) 같은 별도 상태는 v1에서 *Watching* 으로 통합.

### 거래 결과

| 결과 | 컬러 | 사용 케이스 |
|---|---|---|
| Profit (수익) | `var(--good)` #4dd9a3 | +x.x% realized |
| Loss (손실) | `var(--bad)` #ff5e5e | -x.x% realized |
| Pending | `var(--warn)` #ffb347 | Order placed, awaiting fill |

---

## 아이콘 시스템

- **스타일:** stroke (아웃라인), `stroke-width: 1.6–1.7`
- **크기:** 14–20px
- **색상:** `currentColor` (부모에서 상속)
- **Viewport:** `0 0 24 24`
- **strokeLinecap:** `round`, **strokeLinejoin:** `round`

활성 상태: `stroke-width: 1.9` (더 굵게)

---

## 로고 사이즈 (앱·마케팅 표면 기준)

브랜드 마크는 8개 모듈 옥타곤 radial 시스템. 컨텍스트별 권장 사이즈:

| 컨텍스트 | 심볼 사이즈 | 비고 |
|---|---|---|
| 랜딩페이지 | 31×31 | 풀 로고 시 워드마크 영역 76px, 심볼-텍스트 갭 12px |
| 워크스페이스 사이드바 | 22×22 | 풀 로고 시 워드마크 영역 87px |
| 파비콘 | 24×24 (32×32 박스) | 단색, 패딩 4px |

**클리어 스페이스:** 심볼 너비를 `x`로 두고, 사방으로 최소 `x` 만큼 여백 확보. 클리어 스페이스 내에 텍스트나 다른 그래픽 침범 금지.

**사용 금지:** 회전, 색상 적용, 비율 왜곡, 가로 압축, 심볼-텍스트 간격 임의 변경, 심볼을 워드마크 위에 적층(stack), 스트로크/아웃라인 변형 — 모두 금지. 디테일은 `brand_guidelines.md` 참조.

---

## 반응형 브레이크포인트

| 이름 | 범위 | 레이아웃 변화 |
|---|---|---|
| Mobile | ≤800px | BottomTabBar, 단일 컬럼, 드로어 |
| Tablet | 801–1099px | NowRail 숨김 (버튼으로 대체) |
| Desktop | 1100–1279px | NowRail 표시, AgentRail 없음 |
| Wide | ≥1280px | 모든 패널 표시 (4컬럼) |

---

## 스크롤바 스타일링

```css
::-webkit-scrollbar { width: 8–10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--border-2);
  border-radius: 4–99px;
}
::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
```

---

## 텍스트 선택 (Selection)

```css
::selection {
  background: var(--accent);
  color: var(--accent-on);
}
```

---

## 다크/라이트 테마 전환

- HTML 루트에 `data-theme="dark"` 또는 `data-theme="light"` 속성으로 전환
- localStorage `clypt-theme` 키에 저장
- 전환 토글: TopBar 우측 상단 (달/해 아이콘)

---

## 온보딩 전용 스타일

온보딩 페이지는 앱 내부와 다른 별도 색상 시스템 사용:

```css
/* 라이트 기반 */
--ob-bg: #faf9f7        /* 따뜻한 오프화이트 */
--ob-accent: #cc785c    /* 코퍼 (구리) 액센트 */
--ob-fg: #1a1815        /* 거의 검정 */

/* 다크 기반 */
--ob-bg: #1f1d1a
--ob-accent: #e08d6f
```

**이유:** 온보딩은 마케팅과 앱 사이의 전환점. 따뜻하고 안심감을 주는 톤이 필요.

---

## v1 신규 UI 패턴

### Five Moments Card (랜딩 페이지)

5개 에이전트 일과 시각화:
- 좌측 사이드바: Watch / Signal / Wait / Enter / Sleep (각 한 단어, mono 폰트)
- 우측 메인: 선택된 단계의 헤딩 + 서브카피
- 활성 항목: `font-weight: 600` + accent 라인 (왼쪽 4px)
- 비활성: `opacity: 0.4`

### Three Steps Card (How It Works)

3개 단계 패널:
- Build / Configure / Deploy
- 각 패널 = 카드 형태 (border + radius 12px)
- 상단 mini visual + 하단 텍스트 (heading + description)
- 균등 분할 그리드 (1fr 1fr 1fr)

### Volume Tier Display (Dashboard)

3축 시스템 표시:
- **등급 (Volume → Fee):** Scout/Operator/Strategist/... 티어명 + 진행 바
- **레벨 (Volume → Roster + Skin):** LV1/2/3... 게이미피케이션
- **리더보드 순위 (P&L → Fee):** 시즌 랭킹

### Telegram Connect Banner

상단 dismissible 배너:
- 좌측: monospace 영문 카피 ("모든 시그널을 Telegram 메시지로 받으세요")
- 우측: CONNECT → 버튼 + x dismiss
- 한 번 connect 또는 dismiss하면 안 보임

---

## 카피 톤 (디자인 표면에서)

> 디자인 표면에 들어가는 모든 카피는 `brand_guidelines.md`의 한글/영문 톤 가이드 따름.

### 핵심 원칙 (요약)

- ❌ Em-dash (—) 사용 금지 → 마침표, 쉼표, 가운뎃점(·) 사용
- ❌ "당신" 사용 금지 → "본인" 또는 주어 생략
- ❌ "Pivot" 외부 노출 금지 → "evolved" / "sharpened"
- ✅ Five Moments 두 박자 리듬 ("X. Y." 패턴)
- ✅ 자동 실행 정직하게 표현 (signal-and-approve 톤 X)
- ✅ 브랜드 명사 영문 유지 (Telegram, Privy, Hyperliquid 등)

---

## 버전 히스토리

- **v1 (2026.05):** Discover 마켓플레이스 deprecated. Five Moments / Three Steps / Volume Tier 패턴 신규 추가. 에이전트 상태 통합 (Watching).
- **v0.4 (이전 beta):** Subscription 모델 UI (Pro/Pro Trader plan), KOL Discover marketplace (deprecated)
