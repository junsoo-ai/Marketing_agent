from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Image, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── Brand colors ──────────────────────────────────────────────
BG       = colors.HexColor("#000403")
SURFACE  = colors.HexColor("#1B1E21")
SURFACE2 = colors.HexColor("#383B3E")
BORDER   = colors.HexColor("#414349")
WHITE    = colors.HexColor("#FFFFFF")
SECONDARY= colors.HexColor("#D7DCE5")
MUTED    = colors.HexColor("#A3A4B2")
ACCENT   = colors.HexColor("#17E6A1")
ACCENT2  = colors.HexColor("#32D3C3")
ACCENT_L = colors.HexColor("#94F1E8")

W, H = A4  # 595 x 842 pt
MARGIN = 28 * mm

# ── Background canvas callback ─────────────────────────────────
def dark_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # subtle top rule in accent
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1)
    canvas.line(MARGIN, H - 18*mm, W - MARGIN, H - 18*mm)
    # page number bottom right
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    page = doc.page
    canvas.drawRightString(W - MARGIN, 12*mm, f"{page:03d}")
    canvas.restoreState()

def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.restoreState()

# ── Styles ─────────────────────────────────────────────────────
def make_styles():
    eyebrow = ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=7.5, leading=10,
        textColor=ACCENT, spaceAfter=4, wordWrap="LTR", letterSpacing=1.6)

    h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=22, leading=26,
        textColor=WHITE, spaceBefore=6, spaceAfter=8)

    h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=15, leading=19,
        textColor=WHITE, spaceBefore=14, spaceAfter=6)

    h3 = ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=11, leading=14,
        textColor=ACCENT_L, spaceBefore=10, spaceAfter=4)

    body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=14,
        textColor=SECONDARY, spaceAfter=4)

    body_white = ParagraphStyle("body_white", fontName="Helvetica", fontSize=9.5, leading=14,
        textColor=WHITE, spaceAfter=4)

    kpi = ParagraphStyle("kpi", fontName="Helvetica-Bold", fontSize=32, leading=36,
        textColor=WHITE, spaceAfter=2)

    kpi_label = ParagraphStyle("kpi_label", fontName="Helvetica", fontSize=8, leading=11,
        textColor=MUTED, spaceAfter=8, wordWrap="LTR")

    kpi_accent = ParagraphStyle("kpi_accent", fontName="Helvetica-Bold", fontSize=28, leading=32,
        textColor=ACCENT, spaceAfter=2)

    mono = ParagraphStyle("mono", fontName="Courier", fontSize=8.5, leading=12,
        textColor=SECONDARY, spaceAfter=3)

    mono_accent = ParagraphStyle("mono_accent", fontName="Courier-Bold", fontSize=8.5, leading=12,
        textColor=ACCENT, spaceAfter=3)

    quote = ParagraphStyle("quote", fontName="Helvetica-Oblique", fontSize=11, leading=16,
        textColor=ACCENT_L, spaceBefore=6, spaceAfter=6, leftIndent=12, borderPad=8)

    caption = ParagraphStyle("caption", fontName="Helvetica", fontSize=7.5, leading=10,
        textColor=MUTED, spaceAfter=2)

    tag = ParagraphStyle("tag", fontName="Helvetica-Bold", fontSize=7, leading=9,
        textColor=BG, backColor=ACCENT, spaceAfter=4, borderPad=3, leftIndent=2)

    return dict(eyebrow=eyebrow, h1=h1, h2=h2, h3=h3, body=body,
                body_white=body_white, kpi=kpi, kpi_label=kpi_label,
                kpi_accent=kpi_accent, mono=mono, mono_accent=mono_accent,
                quote=quote, caption=caption, tag=tag)

S = make_styles()

# ── Helper: tinted panel table ─────────────────────────────────
def panel(content_rows, bg=SURFACE, accent_header=None):
    data = [[c] for c in content_rows]
    ts = [
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("TOPPADDING",  (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0),(-1,-1), 10),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING",(0,0), (-1,-1), 12),
        ("LINEABOVE",   (0,0), (-1, 0), 1, ACCENT if accent_header else BORDER),
        ("LINEBELOW",   (0,-1),(-1,-1), 0.5, BORDER),
    ]
    t = Table(data, colWidths=[W - 2*MARGIN])
    t.setStyle(TableStyle(ts))
    return t

def rule():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8, spaceBefore=4)

def spacer(h=6):
    return Spacer(1, h)

def eyebrow_row(label, num=""):
    data = [[Paragraph(label, S["eyebrow"]),
             Paragraph(num, ParagraphStyle("rnum", fontName="Courier",
                 fontSize=7.5, textColor=MUTED, alignment=TA_RIGHT, leading=10))]]
    t = Table(data, colWidths=[W-2*MARGIN-40, 40])
    t.setStyle(TableStyle([
        ("TOPPADDING",  (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING", (0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
    ]))
    return t

def two_col(left_items, right_items, ratio=(1,1)):
    cw = [(W-2*MARGIN) * ratio[i]/sum(ratio) - 6 for i in range(2)]
    data = [[left_items, right_items]]
    t = Table(data, colWidths=cw, rowHeights=None)
    t.setStyle(TableStyle([
        ("VALIGN",      (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",  (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("LEFTPADDING", (0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("COLPADDING",  (0,0),(-1,-1), 6),
    ]))
    return t

def data_card(value, label, accent=False):
    vstyle = S["kpi_accent"] if accent else S["kpi"]
    return [Paragraph(value, vstyle), Paragraph(label, S["kpi_label"])]

def metric_table(rows, col_headers=None):
    """rows: list of (label, value) tuples"""
    tdata = []
    if col_headers:
        tdata.append([Paragraph(h, S["eyebrow"]) for h in col_headers])
    for label, value in rows:
        tdata.append([
            Paragraph(label, S["body"]),
            Paragraph(value, ParagraphStyle("tv", fontName="Courier-Bold",
                fontSize=9.5, textColor=WHITE, leading=13, alignment=TA_RIGHT))
        ])
    cw = [W - 2*MARGIN - 120, 120]
    t = Table(tdata, colWidths=cw)
    ts_rules = [
        ("BACKGROUND", (0,0), (-1,-1), SURFACE),
        ("TOPPADDING",  (0,0),(-1,-1), 7),
        ("BOTTOMPADDING",(0,0),(-1,-1), 7),
        ("LEFTPADDING", (0,0),(-1,-1), 10),
        ("RIGHTPADDING",(0,0),(-1,-1), 10),
        ("LINEBELOW",   (0,0),(-1,-2), 0.5, BORDER),
        ("LINEABOVE",   (0,0),(-1, 0), 1,   ACCENT),
        ("VALIGN",      (0,0),(-1,-1), "MIDDLE"),
    ]
    if col_headers:
        ts_rules += [("BACKGROUND",(0,0),(-1,0), colors.HexColor("#0d1108"))]
    t.setStyle(TableStyle(ts_rules))
    return t

# ── Build story ────────────────────────────────────────────────
def build():
    out = "/Users/junsoopark/Documents/Marketing_Agent/_ir_deck/clyptai-seed-deck.pdf"
    cover_img = "/Users/junsoopark/Documents/Marketing_Agent/_ir_deck/cover.png"

    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=22*mm, bottomMargin=20*mm,
        title="ClyptAI — Seed Round Deck",
        author="ClyptAI",
        subject="The production OS for quantitative trading",
    )

    story = []

    # ── COVER ──────────────────────────────────────────────────
    if os.path.exists(cover_img):
        img = Image(cover_img, width=W - 2*MARGIN, height=(W - 2*MARGIN) * 9/16)
        story.append(img)
    else:
        story.append(Paragraph("CLYPTAI", S["h1"]))

    story.append(spacer(10))
    story.append(Paragraph("THE PRODUCTION OS FOR QUANTITATIVE TRADING", S["eyebrow"]))
    story.append(Paragraph("Seed Round — Confidential", S["body"]))
    story.append(spacer(4))
    story.append(Paragraph("www.clypt.ai · ethankim@clypt.ai", S["mono"]))
    story.append(PageBreak())

    # ── 001 · MVP REALITY ─────────────────────────────────────
    story.append(eyebrow_row("LESSONS FROM MVP", "001"))
    story.append(Paragraph("The Reality", S["h1"]))
    story.append(Paragraph("Users Want Access, NOT DIY Tools", S["h3"]))
    story.append(spacer(6))

    pivot_data = [
        [Paragraph("01  HYPOTHESIS", S["eyebrow"]),
         Paragraph("02  REALITY", S["eyebrow"]),
         Paragraph("03  STRATEGIC PIVOT", S["eyebrow"])],
        [Paragraph("Retail wants to <i>build</i> strategies using AI", S["body_white"]),
         Paragraph("Retail wants <i>access</i> to verified, expert-built strategies", S["body_white"]),
         Paragraph("AI agent <i>recommends</i> alpha; users choose execution", S["body_white"])],
    ]
    cw3 = [(W - 2*MARGIN - 12) / 3] * 3
    pt = Table(pivot_data, colWidths=cw3)
    pt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
        ("BACKGROUND",    (0,0),(-1, 0), colors.HexColor("#0d1108")),
        ("TOPPADDING",    (0,0),(-1,-1), 10),
        ("BOTTOMPADDING", (0,0),(-1,-1), 10),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
        ("LINEBEFORE",    (1,0),( 1,-1), 0.5, BORDER),
        ("LINEBEFORE",    (2,0),( 2,-1), 0.5, BORDER),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    story.append(pt)
    story.append(spacer(12))
    story.append(Paragraph("MVP PERFORMANCE (1.5-MONTH)", S["eyebrow"]))
    story.append(spacer(4))
    story.append(metric_table([
        ("Total Trading Volume", "$129.7M"),
        ("Total Commission",     "$30.1K"),
        ("Clients",              "25"),
    ]))
    story.append(PageBreak())

    # ── 002 · PROBLEM: RETAIL ─────────────────────────────────
    story.append(eyebrow_row("THE PROBLEM (RETAIL INVESTORS)", "002"))
    story.append(Paragraph("The Alpha Access Gap", S["h1"]))
    story.append(Paragraph("Retail is locked out and left with noise", S["h3"]))
    story.append(spacer(8))

    for header, body_text in [
        ("ACCESS WALL",
         "Institutional-grade strategies (Sharpe >2.0) are locked inside billion-dollar hedge funds. "
         "Retail has no legitimate path in."),
        ("TRUST DEFICIT",
         "Retail is left with unverified influencers and low-quality automated bots. "
         "Noise with no way to separate signal."),
    ]:
        story.append(panel([
            Paragraph(header, S["eyebrow"]),
            Paragraph(body_text, S["body_white"]),
        ], accent_header=True))
        story.append(spacer(6))
    story.append(PageBreak())

    # ── 003 · PROBLEM: QUANTS ────────────────────────────────
    story.append(eyebrow_row("THE PROBLEM (QUANT RESEARCHERS & TRADERS)", "003"))
    story.append(Paragraph("Structural Barriers", S["h1"]))
    story.append(Paragraph("Fragmented Infrastructure & Verification Crisis", S["h3"]))
    story.append(spacer(8))

    for header, body_text in [
        ('"RESEARCH-PRODUCTION" GAP',
         "Quants struggle to turn research code into execution code across fragmented systems. "
         "Research code ≠ Production code."),
        ("THE VERIFICATION CRISIS",
         "LLM-powered tools silently leak future data into backtests. "
         "Seemingly profitable strategies collapse in live trading."),
    ]:
        story.append(panel([
            Paragraph(header, S["eyebrow"]),
            Paragraph(body_text, S["body_white"]),
        ], accent_header=True))
        story.append(spacer(6))
    story.append(PageBreak())

    # ── 004 · SOLUTION ───────────────────────────────────────
    story.append(eyebrow_row("THE SOLUTION (INFRASTRUCTURE)", "004"))
    story.append(Paragraph("Two-Sided Ecosystem", S["h1"]))
    story.append(Paragraph("The rail that connects Pro Quants to Retail users", S["h3"]))
    story.append(spacer(8))

    modules = [
        ("DISCOVER", "Coming Q2 2026", "AI Agent autonomously scans and filters alpha, replacing months of manual analyst research."),
        ("CREATE",   "Live",           "Pro Quants build alpha on Zero-Gap OS. 100% Strategy Ownership."),
        ("ACCESS",   "Live",           "Ledger-verified strategies with live P&L, not cherry-picked backtests."),
        ("SUBSCRIBE","Live",           "Backtest, Subscribe and Deploy with zero set-up."),
    ]
    cw2 = [(W - 2*MARGIN - 6) / 2] * 2
    mod_rows = []
    for i in range(0, len(modules), 2):
        row = []
        for mod in modules[i:i+2]:
            name, status, desc = mod
            status_color = ACCENT if status == "Live" else ACCENT2
            cell = Table([
                [Paragraph(name, S["eyebrow"])],
                [Paragraph(f"({status})", ParagraphStyle("st", fontName="Courier",
                    fontSize=7.5, textColor=status_color, leading=10))],
                [Paragraph(desc, S["body"])],
            ], colWidths=[cw2[0]-20])
            cell.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
                ("TOPPADDING",    (0,0),(-1,-1), 10),
                ("BOTTOMPADDING", (0,0),(-1,-1), 10),
                ("LEFTPADDING",   (0,0),(-1,-1), 10),
                ("RIGHTPADDING",  (0,0),(-1,-1), 10),
                ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
            ]))
            row.append(cell)
        if len(row) == 1:
            row.append("")
        mod_rows.append(row)

    mt = Table(mod_rows, colWidths=cw2)
    mt.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("COLPADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(mt)
    story.append(PageBreak())

    # ── 005 · PRODUCT WORKFLOW ───────────────────────────────
    story.append(eyebrow_row("PRODUCT", "005"))
    story.append(Paragraph("Create → Verify → Deploy → Monetize", S["h1"]))
    story.append(Paragraph("4-step workflow — no rewrites, no fragmentation", S["h3"]))
    story.append(spacer(10))

    steps = [
        ("01", "CREATE",   "Research & Strategy creation in Jupyter environment with LLM agent."),
        ("02", "VERIFY",   "Backtest and validation using the same codebase."),
        ("03", "DEPLOY",   "Zero-gap deployment. NO rewrites."),
        ("04", "MONETIZE", "Strategy monetization via the marketplace."),
    ]
    for num, title, desc in steps:
        row_data = [[
            Paragraph(num, ParagraphStyle("stepnum", fontName="Courier-Bold",
                fontSize=11, textColor=ACCENT, leading=14)),
            [Paragraph(title, ParagraphStyle("steptitle", fontName="Helvetica-Bold",
                fontSize=11, textColor=WHITE, leading=14, spaceAfter=2)),
             Paragraph(desc, S["body"])],
        ]]
        rt = Table(row_data, colWidths=[32, W-2*MARGIN-32])
        rt.setStyle(TableStyle([
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
            ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
            ("TOPPADDING",    (0,0),(-1,-1), 10),
            ("BOTTOMPADDING", (0,0),(-1,-1), 10),
            ("LEFTPADDING",   (0,0),(-1,-1), 10),
            ("RIGHTPADDING",  (0,0),(-1,-1), 10),
            ("LINEABOVE",     (0,0),(-1, 0), 0.5, BORDER),
        ]))
        story.append(rt)
        story.append(spacer(3))
    story.append(PageBreak())

    # ── 006 · TEMPORAL INTEGRITY ─────────────────────────────
    story.append(eyebrow_row("BUILT FOR TEMPORAL INTEGRITY", "006"))
    story.append(Paragraph("Why AI-Era Backtests Fail — and Why Ours Don't", S["h1"]))
    story.append(spacer(8))

    cw2h = [(W - 2*MARGIN - 6) / 2] * 2
    def ti_panel(label, body_text, bg=SURFACE):
        c = Table([
            [Paragraph(label, S["eyebrow"])],
            [Paragraph(body_text, S["body"])],
        ], colWidths=[cw2h[0]-20])
        c.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), bg),
            ("TOPPADDING",    (0,0),(-1,-1), 12),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ("LEFTPADDING",   (0,0),(-1,-1), 12),
            ("RIGHTPADDING",  (0,0),(-1,-1), 12),
            ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
        ]))
        return c

    top_row = Table([[
        ti_panel("01  INDUSTRY PROBLEM",
                 "Most LLM-powered trading tools generate strategies that look great in backtests "
                 "but fail in live trading. The root cause is lookahead bias — research code silently uses future data."),
        ti_panel("02  OUR DESIGN",
                 "Clypt's engine is built on a rolling-buffer architecture. By design, strategies can only "
                 "access data points that would have been available at the moment of decision.", bg=SURFACE2),
    ]], colWidths=cw2h)
    top_row.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 0),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("COLPADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(top_row)
    story.append(spacer(6))

    moat = panel([
        Paragraph("03  WHY THIS IS A MOAT", S["eyebrow"]),
        Paragraph(
            "Other AI trading tools can generate strategies. They can't guarantee the backtests are honest. "
            "<b>We can.</b>",
            ParagraphStyle("moat", fontName="Helvetica-Bold", fontSize=13,
                           textColor=WHITE, leading=18)),
    ], bg=colors.HexColor("#0a1a10"), accent_header=True)
    story.append(moat)
    story.append(PageBreak())

    # ── 007 · TRACTION ───────────────────────────────────────
    story.append(eyebrow_row("POST PIVOT TRACTION", "007"))
    story.append(Paragraph("Early Traction & Activated Pipeline", S["h1"]))
    story.append(spacer(8))

    # Platform signals
    story.append(Paragraph("01  PLATFORM SIGNALS", S["eyebrow"]))
    sig_data = [
        [Paragraph("Organic Growth\nZero Marketing Spend", S["body_white"]),
         Paragraph("500+", S["kpi"]),
         Paragraph("5%", S["kpi"])],
        ["",
         Paragraph("Users", S["kpi_label"]),
         Paragraph("Paid Conversion Rate", S["kpi_label"])],
    ]
    st = Table(sig_data, colWidths=[W-2*MARGIN-200, 100, 100])
    st.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
        ("TOPPADDING",    (0,0),(-1,-1), 12),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 12),
        ("RIGHTPADDING",  (0,0),(-1,-1), 12),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ("LINEABOVE",     (0,0),(-1, 0), 1, BORDER),
    ]))
    story.append(st)
    story.append(spacer(8))

    # Partner
    story.append(Paragraph("01  PLATFORM SIGNALS — FIRST STRATEGIC PARTNER", S["eyebrow"]))
    partner_data = [
        [Paragraph("First Strategic Partner\ngoing live Q2 2026", S["body_white"]),
         Paragraph("$30M", S["kpi_accent"]),
         Paragraph("CONTRACT SIGNED", ParagraphStyle("badge", fontName="Helvetica-Bold",
             fontSize=7, textColor=BG, backColor=ACCENT, leading=9, alignment=TA_CENTER))],
        ["",
         Paragraph("AUM Committed", S["kpi_label"]),
         ""],
        ["",
         Paragraph("~$12.5M", S["kpi_accent"]),
         Paragraph("Q2 2026", S["kpi_accent"])],
        ["",
         Paragraph("Projected Y1 Revenue\n(base case, 10% rev share)", S["kpi_label"]),
         Paragraph("Expected Go-Live", S["kpi_label"])],
    ]
    prt = Table(partner_data, colWidths=[W-2*MARGIN-220, 120, 100])
    prt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), colors.HexColor("#0a1a10")),
        ("TOPPADDING",    (0,0),(-1,-1), 8),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 12),
        ("RIGHTPADDING",  (0,0),(-1,-1), 12),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
    ]))
    story.append(prt)
    story.append(Paragraph("*** Additional partner discussions underway in SEA region.", S["caption"]))
    story.append(PageBreak())

    # ── 008 · TEAM ───────────────────────────────────────────
    story.append(eyebrow_row("WHY CLYPT?", "008"))
    story.append(Paragraph("Founded by Market Maker & AI Architect", S["h1"]))
    story.append(Paragraph("Market Insight · Technical Depth", S["h3"]))
    story.append(spacer(10))

    team = [
        ("Ethan Kim", "CEO",     "Veteran Crypto Market Maker across multiple projects"),
        ("Jaden Park","CTO",     "Former AI Lead, Korea Ministry of National Defense"),
        ("Jason Park","Advisor", "Director & Senior Quantitative Analyst, Merrill Lynch NY"),
        ("Rick Kim",  "Advisor", "Machine Learning Engineer, Google DeepMind"),
    ]
    cw4 = [(W - 2*MARGIN - 18) / 4] * 4
    team_row = []
    for name, role, bg_text in team:
        cell = Table([
            [Paragraph(name, ParagraphStyle("tname", fontName="Helvetica-Bold",
                fontSize=11, textColor=WHITE, leading=14))],
            [Paragraph(role, ParagraphStyle("trole", fontName="Courier",
                fontSize=8, textColor=ACCENT, leading=10))],
            [rule()],
            [Paragraph(bg_text, S["caption"])],
        ], colWidths=[cw4[0]-20])
        cell.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
            ("TOPPADDING",    (0,0),(-1,-1), 12),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ("LEFTPADDING",   (0,0),(-1,-1), 10),
            ("RIGHTPADDING",  (0,0),(-1,-1), 10),
            ("LINEABOVE",     (0,0),(-1, 0), 2, ACCENT),
        ]))
        team_row.append(cell)

    tt = Table([team_row], colWidths=cw4)
    tt.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 0),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("COLPADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(tt)
    story.append(PageBreak())

    # ── 009 · MARKET ─────────────────────────────────────────
    story.append(eyebrow_row("MARKET OPPORTUNITY", "009"))
    story.append(Paragraph("Fast-Growing Algorithmic Trading Market", S["h1"]))
    story.append(spacer(8))

    tam_rows = [
        ("Independent quant developers",                "500K+ × $3K/yr"),
        ("Small-mid hedge funds & family offices",      "17K+ × $100K/yr"),
        ("Quant Infrastructure Spend",                  "$1.5B+"),
        ("Global Algorithmic Trading Market (10.5% CAGR)", "$20B+"),
        ("Institutional Quant Research & Infrastructure",   "$10B+"),
        ("Global Crypto Asset Liquidity Pool",          "$3.3T+"),
    ]
    story.append(metric_table(tam_rows, col_headers=["SEGMENT", "SIZE"]))
    story.append(spacer(6))
    story.append(Paragraph(
        "Retail demand and B2B opportunity are not yet captured in these figures.",
        S["caption"]))
    story.append(PageBreak())

    # ── 010 · MARKET GAP ─────────────────────────────────────
    story.append(eyebrow_row("CURRENT LANDSCAPE", "010"))
    story.append(Paragraph("Market Gap", S["h1"]))
    story.append(Paragraph(
        "No platform combines a code-native environment, AI-driven alpha discovery, "
        "and a strategy marketplace in a single stack.", S["body"]))
    story.append(spacer(8))

    comp_rows = [
        ["COMPETITOR",    "POSITION",                      "GAP"],
        ["Composer",      "Rule-based / Template, DIY",    "No code-native, no AI"],
        ["WorldQuant BRAIN","Code-native",                 "Builder-only, no marketplace"],
        ["NautilusTrader","Code-native",                   "Builder-only"],
        ["QuantConnect",  "Code-native, AI-assisted",      "Builder-only"],
        ["3Commas",       "Rule-based, DIY",               "No code-native"],
        ["Freqtrade",     "Rule-based, DIY",               "No code-native"],
        ["Clypt ✦",       "Code-native + AI + Full-stack", "Category creator"],
    ]
    comp_style_rows = []
    for i, row in enumerate(comp_rows):
        if i == 0:
            comp_style_rows.append([Paragraph(c, S["eyebrow"]) for c in row])
        elif i == len(comp_rows) - 1:
            comp_style_rows.append([Paragraph(c, ParagraphStyle("clypt_row",
                fontName="Helvetica-Bold", fontSize=9, textColor=ACCENT, leading=13))
                for c in row])
        else:
            comp_style_rows.append([Paragraph(c, S["body"]) for c in row])

    cw3c = [120, 180, W-2*MARGIN-300-12]
    ct = Table(comp_style_rows, colWidths=cw3c)
    ct.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1),    SURFACE),
        ("BACKGROUND",    (0,0),(-1, 0),    colors.HexColor("#0d1108")),
        ("BACKGROUND",    (0,-1),(-1,-1),   colors.HexColor("#0a1a10")),
        ("TOPPADDING",    (0,0),(-1,-1),    7),
        ("BOTTOMPADDING", (0,0),(-1,-1),    7),
        ("LEFTPADDING",   (0,0),(-1,-1),    10),
        ("RIGHTPADDING",  (0,0),(-1,-1),    10),
        ("LINEABOVE",     (0,0),(-1, 0),    1.5, ACCENT),
        ("LINEBELOW",     (0,0),(-1,-2),    0.5, BORDER),
        ("LINEBELOW",     (0,-1),(-1,-1),   1,   ACCENT),
        ("VALIGN",        (0,0),(-1,-1),    "MIDDLE"),
    ]))
    story.append(ct)
    story.append(PageBreak())

    # ── 011 · ROADMAP ────────────────────────────────────────
    story.append(eyebrow_row("ROADMAP", "011"))
    story.append(Paragraph("From Temporal Integrity to Institutional Platform", S["h1"]))
    story.append(spacer(10))

    roadmap = [
        ("Past (2025)", "Temporal Integrity Engine",  "Done", MUTED),
        ("Q1 2026",     "Private Beta & Creator Onboarding", "Complete", SECONDARY),
        ("Q2 2026",     "AI Alpha Agent Integration & Prediction Market (Risk Management Layer)", "In Progress", ACCENT),
        ("Q3 2026",     "US Equities, Forex, Options, Risk Engine", "Upcoming", ACCENT2),
        ("Q4 2026",     "B2B Institutional Solution", "Upcoming", ACCENT_L),
    ]
    for period, milestone, status, clr in roadmap:
        rd = Table([[
            Paragraph(period, ParagraphStyle("rperiod", fontName="Courier-Bold",
                fontSize=10, textColor=clr, leading=13, alignment=TA_CENTER)),
            Paragraph(milestone, S["body_white"]),
        ]], colWidths=[90, W-2*MARGIN-90])
        rd.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
            ("BACKGROUND",    (0,0),(0,-1),  colors.HexColor("#0d1108")),
            ("TOPPADDING",    (0,0),(-1,-1), 12),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ("LEFTPADDING",   (0,0),(-1,-1), 12),
            ("RIGHTPADDING",  (0,0),(-1,-1), 12),
            ("LINEABOVE",     (0,0),(-1, 0), 0.5, BORDER),
            ("LINEBEFORE",    (1,0),(1,-1),  0.5, BORDER),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ]))
        story.append(rd)
        story.append(spacer(2))
    story.append(PageBreak())

    # ── 012 · FUNDRAISING ───────────────────────────────────
    story.append(eyebrow_row("FUNDRAISING & USE OF FUNDS", "012"))
    story.append(Paragraph("$5M Seed Round", S["h1"]))
    story.append(Paragraph("Seizing the First-Mover Advantage", S["h3"]))
    story.append(spacer(8))

    alloc = [
        ("Data & Infrastructure",  "20%", "$1M",  "Institutional data feeds; high-concurrency architecture"),
        ("Growth & Operations",    "40%", "$2M",  "Global Quant Leagues; community expansion (KOLs); Lead Quant hire"),
        ("Product & Engineering",  "40%", "$2M",  "Team expansion; core platform development"),
    ]
    for cat, pct, amt, desc in alloc:
        ad = Table([[
            Paragraph(pct, ParagraphStyle("apct", fontName="Helvetica-Bold",
                fontSize=22, textColor=WHITE, leading=26, alignment=TA_CENTER)),
            [Paragraph(cat, ParagraphStyle("acat", fontName="Helvetica-Bold",
                fontSize=10, textColor=ACCENT, leading=13)),
             Paragraph(desc, S["body"])],
            Paragraph(amt, ParagraphStyle("aamt", fontName="Courier-Bold",
                fontSize=18, textColor=ACCENT, leading=22, alignment=TA_RIGHT)),
        ]], colWidths=[60, W-2*MARGIN-130, 70])
        ad.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
            ("TOPPADDING",    (0,0),(-1,-1), 12),
            ("BOTTOMPADDING", (0,0),(-1,-1), 12),
            ("LEFTPADDING",   (0,0),(-1,-1), 12),
            ("RIGHTPADDING",  (0,0),(-1,-1), 12),
            ("LINEABOVE",     (0,0),(-1, 0), 0.5, BORDER),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ]))
        story.append(ad)
        story.append(spacer(3))

    story.append(spacer(10))
    story.append(Paragraph("MILESTONE TRANCHES", S["eyebrow"]))
    story.append(spacer(4))
    milestones = [
        ("$1M", "Proprietary \"Clypt LLM\" Deploy"),
        ("$2M", "Trading Volume: $10B in 12 months"),
        ("$2M", "Launch Institutional Terminal v1.0"),
    ]
    mcw = [(W - 2*MARGIN - 12) / 3] * 3
    mcells = []
    for amt, label in milestones:
        c = Table([
            [Paragraph(amt, ParagraphStyle("mamt", fontName="Helvetica-Bold",
                fontSize=26, textColor=WHITE, leading=30))],
            [Paragraph("MILESTONE", ParagraphStyle("mlbl", fontName="Courier",
                fontSize=7, textColor=ACCENT, leading=9))],
            [Paragraph(label, S["caption"])],
        ], colWidths=[mcw[0]-20])
        c.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
            ("TOPPADDING",    (0,0),(-1,-1), 14),
            ("BOTTOMPADDING", (0,0),(-1,-1), 14),
            ("LEFTPADDING",   (0,0),(-1,-1), 12),
            ("RIGHTPADDING",  (0,0),(-1,-1), 12),
            ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
        ]))
        mcells.append(c)
    mt2 = Table([mcells], colWidths=mcw)
    mt2.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 0),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("COLPADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(mt2)
    story.append(PageBreak())

    # ── 013 · BUSINESS MODEL ────────────────────────────────
    story.append(eyebrow_row("BUSINESS MODEL", "013"))
    story.append(Paragraph("Four Revenue Streams", S["h1"]))
    story.append(spacer(8))

    bm_items = [
        ("SaaS Subscription",
         "Free · Pro $29/mo · Premium $200/mo · Enterprise TBD",
         "Monthly access to ClyptQ Engine & Cloud Infrastructure"),
        ("Marketplace Fees",
         "Bronze 20% · Silver 10% · Gold 2.5%",
         "Volume-prioritized to capture top strategy creators"),
        ("Exchange Partner Rebates",
         "Revenue share",
         "B2B partnerships with exchanges for driving trading volume"),
        ("Institutional Data",
         "Alt-data licensing",
         "Retail flow data, strategy metrics & on-chain signals sold to institutional subscribers"),
    ]
    bm_cw = [(W - 2*MARGIN - 12) / 2] * 2
    bm_rows = []
    for i in range(0, len(bm_items), 2):
        row = []
        for title, pricing, desc in bm_items[i:i+2]:
            c = Table([
                [Paragraph(title, S["h3"])],
                [Paragraph(pricing, S["mono_accent"])],
                [Paragraph(desc, S["body"])],
            ], colWidths=[bm_cw[0]-20])
            c.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
                ("TOPPADDING",    (0,0),(-1,-1), 14),
                ("BOTTOMPADDING", (0,0),(-1,-1), 14),
                ("LEFTPADDING",   (0,0),(-1,-1), 12),
                ("RIGHTPADDING",  (0,0),(-1,-1), 12),
                ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
            ]))
            row.append(c)
        if len(row) == 1:
            row.append("")
        bm_rows.append(row)

    bmt = Table(bm_rows, colWidths=bm_cw)
    bmt.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("COLPADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(bmt)
    story.append(PageBreak())

    # ── 014 · CATEGORY LEADERSHIP ───────────────────────────
    story.append(eyebrow_row("WHY WE ARE POSITIONED TO BE THE CATEGORY LEADER", "014"))
    story.append(Paragraph("Four Structural Advantages", S["h1"]))
    story.append(spacer(8))

    advantages = [
        ("01  AI DEFENSIBILITY",    "Engineered for the AI Era",
         "As LLMs commoditize strategy generation, the scarce resource becomes verified alpha. "
         "Clypt's rolling-buffer architecture prevents lookahead bias, every strategy carries live P&L "
         "(not cherry-picked backtests), and agent/subscriber decisions compound into proprietary training data."),
        ("02  HEDGING INTELLIGENCE","LLM-Powered Hedging & Proprietary Data",
         "LLMs integrate prediction market data to monitor macro risks, automatically recommending hedge "
         "positions to offset potential portfolio losses. Retail flow data and capital flows enrich "
         "institutional trading models."),
        ("03  CREATOR ECONOMY",     "Verified Creator Economy for Quants",
         "Elite quants connect directly to retail capital — strategies become on-chain IP. Builders retain "
         "100% ownership; retail gets access to manipulation-free strategies. Clypt handles infrastructure "
         "and distribution; quants become ledger-verified 'influencers.'"),
        ("04  ASSET EXPANSION",     "Friction-less Expansion into Other Asset Classes",
         "Modular, asset-agnostic architecture. Expanding into RWAs, US equities, FX, and options is not "
         "an engineering problem — it is a capital problem."),
    ]
    adv_cw = [(W - 2*MARGIN - 6) / 2] * 2
    adv_rows = []
    for i in range(0, len(advantages), 2):
        row = []
        for eyebrow_txt, title, body_txt in advantages[i:i+2]:
            c = Table([
                [Paragraph(eyebrow_txt, S["eyebrow"])],
                [Paragraph(title, ParagraphStyle("atitle", fontName="Helvetica-Bold",
                    fontSize=11, textColor=WHITE, leading=14, spaceAfter=4))],
                [Paragraph(body_txt, S["body"])],
            ], colWidths=[adv_cw[0]-20])
            c.setStyle(TableStyle([
                ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
                ("TOPPADDING",    (0,0),(-1,-1), 14),
                ("BOTTOMPADDING", (0,0),(-1,-1), 14),
                ("LEFTPADDING",   (0,0),(-1,-1), 12),
                ("RIGHTPADDING",  (0,0),(-1,-1), 12),
                ("LINEABOVE",     (0,0),(-1, 0), 1.5, ACCENT),
            ]))
            row.append(c)
        adv_rows.append(row)

    advt = Table(adv_rows, colWidths=adv_cw)
    advt.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("COLPADDING",    (0,0),(-1,-1), 6),
    ]))
    story.append(advt)
    story.append(PageBreak())

    # ── THANK YOU ───────────────────────────────────────────
    story.append(spacer(60))
    story.append(Paragraph("Thank you.", ParagraphStyle("ty", fontName="Helvetica-Bold",
        fontSize=40, textColor=WHITE, leading=46, alignment=TA_CENTER)))
    story.append(spacer(20))
    story.append(HRFlowable(width="60%", thickness=1, color=ACCENT,
        hAlign="CENTER", spaceAfter=16))
    story.append(Paragraph("www.clypt.ai",
        ParagraphStyle("tylink", fontName="Courier", fontSize=11,
            textColor=ACCENT, leading=14, alignment=TA_CENTER)))
    story.append(Paragraph("ethankim@clypt.ai",
        ParagraphStyle("tyemail", fontName="Courier", fontSize=10,
            textColor=MUTED, leading=13, alignment=TA_CENTER)))

    # ── Build ─────────────────────────────────────────────────
    doc.build(story, onFirstPage=cover_bg, onLaterPages=dark_bg)
    print(f"PDF saved: {out}")

if __name__ == "__main__":
    build()
