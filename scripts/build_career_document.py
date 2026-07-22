from __future__ import annotations

from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "john-dean-resume.pdf"
CAREER_SOURCE = ROOT / "src" / "lib" / "career.ts"

BRAND_DARK = HexColor("#00246B")
BRAND_LIGHT = HexColor("#CADCFC")
INK = HexColor("#18181B")
MUTED = HexColor("#52525B")
HAIRLINE = HexColor("#D4D4D8")
PAPER = colors.white

PAGE_WIDTH, PAGE_HEIGHT = letter
LEFT = 0.58 * inch
RIGHT = 0.58 * inch
TOP = 0.46 * inch
BOTTOM = 0.48 * inch


def register_fonts() -> tuple[str, str, str]:
    candidates = [
        (
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Italic.ttf",
        ),
        (
            "/Library/Fonts/Arial.ttf",
            "/Library/Fonts/Arial Bold.ttf",
            "/Library/Fonts/Arial Italic.ttf",
        ),
    ]

    for regular, bold, italic in candidates:
        if all(Path(path).exists() for path in (regular, bold, italic)):
            pdfmetrics.registerFont(TTFont("ResumeSans", regular))
            pdfmetrics.registerFont(TTFont("ResumeSans-Bold", bold))
            pdfmetrics.registerFont(TTFont("ResumeSans-Italic", italic))
            return "ResumeSans", "ResumeSans-Bold", "ResumeSans-Italic"

    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


FONT, FONT_BOLD, FONT_ITALIC = register_fonts()


class ResumeDocument(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=letter,
            leftMargin=LEFT,
            rightMargin=RIGHT,
            topMargin=TOP,
            bottomMargin=BOTTOM,
            title="John Dean Resume",
            author="John Dean",
            subject="Principal Architect and hands-on systems engineer",
            creator="flick.ing career document generator",
        )
        frame = Frame(
            LEFT,
            BOTTOM,
            PAGE_WIDTH - LEFT - RIGHT,
            PAGE_HEIGHT - TOP - BOTTOM,
            id="resume",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0.12 * inch,
        )
        self.addPageTemplates(
            PageTemplate(id="resume", frames=[frame], onPage=draw_page)
        )


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    canvas.setStrokeColor(HAIRLINE)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT, 0.33 * inch, PAGE_WIDTH - RIGHT, 0.33 * inch)

    canvas.setFont(FONT_BOLD, 6.6)
    canvas.setFillColor(BRAND_DARK)
    canvas.drawString(LEFT, 0.20 * inch, "JOHN DEAN / RESUME")
    canvas.setFont(FONT, 6.6)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(
        PAGE_WIDTH - RIGHT,
        0.20 * inch,
        f"FLICK.ING  |  {doc.page} OF 2",
    )
    canvas.restoreState()


styles = getSampleStyleSheet()

name_style = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=28,
    leading=29,
    textColor=INK,
    spaceAfter=2,
)
identity_style = ParagraphStyle(
    "Identity",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=7.5,
    leading=9,
    tracking=1.1,
    textColor=BRAND_DARK,
)
headline_style = ParagraphStyle(
    "Headline",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=11.2,
    leading=14,
    textColor=MUTED,
)
contact_style = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=7.8,
    leading=10.4,
    textColor=MUTED,
    alignment=TA_RIGHT,
)
summary_style = ParagraphStyle(
    "Summary",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=9.1,
    leading=12.2,
    textColor=INK,
    spaceAfter=0,
)
section_style = ParagraphStyle(
    "Section",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=8.3,
    leading=10,
    textColor=BRAND_DARK,
    tracking=1.05,
    spaceBefore=8,
    spaceAfter=5,
    keepWithNext=True,
)
role_style = ParagraphStyle(
    "Role",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=10.3,
    leading=11.8,
    textColor=INK,
)
date_style = ParagraphStyle(
    "Date",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=7.7,
    leading=9.2,
    textColor=BRAND_DARK,
    alignment=TA_RIGHT,
)
role_meta_style = ParagraphStyle(
    "RoleMeta",
    parent=styles["Normal"],
    fontName=FONT_ITALIC,
    fontSize=7.9,
    leading=10,
    textColor=MUTED,
)
bullet_style = ParagraphStyle(
    "Bullet",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=8.15,
    leading=10.7,
    textColor=INK,
    leftIndent=9,
    firstLineIndent=-9,
    spaceAfter=1.3,
)
cap_label_style = ParagraphStyle(
    "CapabilityLabel",
    parent=styles["Normal"],
    fontName=FONT_BOLD,
    fontSize=7.8,
    leading=9.4,
    textColor=INK,
)
cap_body_style = ParagraphStyle(
    "CapabilityBody",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=7.4,
    leading=9.2,
    textColor=MUTED,
)
small_style = ParagraphStyle(
    "Small",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=7.6,
    leading=10,
    textColor=MUTED,
)
education_style = ParagraphStyle(
    "Education",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=8.2,
    leading=10.6,
    textColor=INK,
)


class SectionRule(Flowable):
    def __init__(self, height=1):
        super().__init__()
        self.height = height

    def draw(self):
        self.canv.setStrokeColor(HAIRLINE)
        self.canv.setLineWidth(0.5)
        self.canv.line(0, 0, self._availWidth, 0)

    def wrap(self, available_width, available_height):
        self._availWidth = available_width
        return available_width, self.height


def section(title: str):
    return [Paragraph(title.upper(), section_style), SectionRule(), Spacer(1, 4)]


def role(
    company: str,
    title: str,
    dates: str,
    context: str,
    bullets: list[str],
    gap: float = 5,
):
    header = Table(
        [
            [
                Paragraph(f"{company}  <font color='#52525B'>/ {title}</font>", role_style),
                Paragraph(dates, date_style),
            ]
        ],
        colWidths=[5.65 * inch, 1.18 * inch],
        hAlign="LEFT",
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    content = [header, Paragraph(context, role_meta_style), Spacer(1, 2)]
    content.extend(Paragraph(f"- {item}", bullet_style) for item in bullets)
    content.append(Spacer(1, gap))
    return KeepTogether(content)


def capability(label: str, body: str):
    return Paragraph(
        f"<font name='{FONT_BOLD}'>{label}</font><br/><font color='#52525B'>{body}</font>",
        cap_body_style,
    )


def giphy_outcome() -> str:
    source = CAREER_SOURCE.read_text(encoding="utf-8")
    match = re.search(
        r'id: "giphy-2024",(?:(?!\n  \{\n    id:)[\s\S])*?outcomes: \[\s*"([^"]+)"',
        source,
    )
    if not match:
        raise RuntimeError("Could not find the canonical GIPHY outcome")
    return match.group(1)


def build_story():
    story = []

    header_left = [
        Paragraph("FLICK / 0XFLICKER", identity_style),
        Paragraph("John Dean", name_style),
        Paragraph(
            "Principal Architect | Production AI, Platforms, and Distributed Systems",
            headline_style,
        ),
    ]
    header_right = Paragraph(
        "Colorado / Remote<br/>"
        "<link href='mailto:me@0xflick.xyz' color='#00246B'>me@0xflick.xyz</link><br/>"
        "<link href='https://www.flick.ing' color='#00246B'>flick.ing</link>  |  "
        "<link href='https://github.com/0xFlicker' color='#00246B'>github.com/0xFlicker</link><br/>"
        "<link href='https://www.linkedin.com/in/john-dean-iii-27190945' color='#00246B'>LinkedIn / John Dean</link>",
        contact_style,
    )
    header = Table(
        [[header_left, header_right]],
        colWidths=[4.55 * inch, 2.28 * inch],
        hAlign="LEFT",
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.extend([header, Spacer(1, 8), SectionRule(), Spacer(1, 6)])

    story.append(
        Paragraph(
            "Principal Architect and hands-on systems engineer with 25+ years building and operating developer tools, embedded systems, consumer products, cloud platforms, MLOps, monetization, and production AI agents. Sets technical direction, validates critical paths in code, and owns the reliability, migration, cost, and incident consequences of architecture decisions.",
            summary_style,
        )
    )

    story.extend(section("Core strengths"))
    capabilities = Table(
        [
            [
                capability(
                    "Production AI systems",
                    "Agents, tools, identity, access, durable state, replay, and evaluation.",
                ),
                capability(
                    "Platforms + distributed systems",
                    "APIs, event models, service boundaries, observability, and cloud cost.",
                ),
            ],
            [
                capability(
                    "Technical leadership",
                    "Direction, reviews, migrations, mentoring, and critical-path validation.",
                ),
                capability(
                    "Product + operations",
                    "Consumer, monetization, experimentation, delivery, incidents, and on-call.",
                ),
            ],
        ],
        colWidths=[3.415 * inch, 3.415 * inch],
        hAlign="LEFT",
    )
    capabilities.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BOX", (0, 0), (-1, -1), 0.5, HAIRLINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, HAIRLINE),
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#F8FAFC")),
            ]
        )
    )
    story.append(capabilities)

    story.extend(section("Experience"))
    story.append(
        role(
            "GIPHY",
            "Principal Architect",
            "2024 - PRESENT",
            "GIPHY, a Shutterstock company | Colorado / Remote",
            [
                giphy_outcome(),
                "Introduced privacy-conscious targeting built on ethically sourced data and designed to comply with applicable global privacy regulations.",
                "Set technical direction across advertising, search, content delivery, consumer, partner, API, and integration systems, including design review, migrations, reliability, incident learning, and cost-aware operations.",
            ],
        )
    )
    story.append(
        role(
            "Shutterstock",
            "Software Engineer",
            "2022 - 2024",
            "Shutterstock Create | Colorado / Remote",
            [
                "Rejoined after the PicMonkey acquisition to integrate and evolve the browser-based creative platform and help deliver Shutterstock Create.",
                "Contributed to the team that created Shutterstock's first AI image-editing tool.",
                "Worked across product engineering, cloud infrastructure, Kubernetes, deployment, and production support; helped transition away from Shutterstock Editor.",
            ],
        )
    )
    story.append(
        role(
            "Verta",
            "Employee #6",
            "2020 - 2022",
            "Owned everything that touched the browser | Enterprise MLOps | Remote",
            [
                "Took over customer-facing product and web ownership from the CTO; owned every browser-facing surface from the React frontend through GraphQL resolvers and backend API integrations.",
                "Led three frontend contractors and maintained tests, builds, releases, enterprise integrations, customer support, and production on-call.",
            ],
        )
    )
    story.append(
        role(
            "Sandbox VR",
            "US salaried technical employee #4",
            "JUL 2019 - APR 2020",
            "Hired to lead cloud systems outside the in-store game servers | Remote",
            [
                "Led architecture, delivery, and operations across the web product, booking, subscriptions, global leaderboards, and marketing systems.",
                "Built and operated TypeScript, React, GraphQL, Google Cloud, Kubernetes, Firebase, Cloudflare Workers, and Stripe systems with 24/7 on-call responsibility.",
            ],
            gap=2,
        )
    )

    story.append(PageBreak())
    story.extend(section("Experience continued"))
    story.append(
        role(
            "Shutterstock",
            "Software Developer",
            "NOV 2015 - JUL 2019",
            "Shutterstock Editor and core marketplace",
            [
                "Helped build Shutterstock Editor with JavaScript, React, HTML Canvas, WebGL, and Node.js.",
                "Led internationalization, partner SDK development, and migration to AWS and Kubernetes while contributing to cart, checkout, and Perl-to-Node modernization; served rotating 24/7 on-call.",
            ],
        )
    )
    story.append(
        role(
            "Time Warner Cable",
            "Senior Developer / Feature Technical Lead",
            "NOV 2013 - NOV 2015",
            "Consumer Technology Group | Multi-room HTML5 DVR",
            [
                "Built core features in a performance-constrained embedded browser, led delivery across an onshore/offshore team, and contributed release tooling and Tier 4 beta support.",
            ],
        )
    )
    story.append(
        role(
            "Accenture",
            "Developer / Application Architect",
            "OCT 2011 - NOV 2013",
            "Embedded television and mobile client systems",
            [
                "Delivered an embedded HTML5 DVR interface and a native iOS operational-data application; designed a secure .NET WCF service for transformed data delivery.",
            ],
        )
    )
    story.append(
        role(
            "Nokia",
            "Software Test Engineer",
            "OCT 2005 - OCT 2011",
            "Carbide.c++ development tools | Austin, Texas",
            [
                "Built automated testing and Hudson/Jenkins CI systems, led a test team of up to six engineers, and developed Linux toolchain support for Qt/Symbian projects.",
            ],
        )
    )
    story.append(
        role(
            "Metrowerks / Motorola / Freescale",
            "Software Test Engineer / Factory Test Engineer",
            "MAR 2000 - OCT 2005",
            "CodeWarrior and embedded development boards | Austin, Texas",
            [
                "Built automated IDE, SDK, framework, factory, and system-integration tests across Mac and embedded platforms using C and assembly.",
            ],
            gap=2,
        )
    )

    story.extend(section("Selected independent systems"))
    story.append(
        role(
            "The House / Influence",
            "Creator and hands-on platform engineer",
            "CURRENT",
            "Production platform for persistent AI agents | <link href='https://thehouse.game' color='#00246B'>thehouse.game</link>",
            [
                "Builds and operates agent identity and revisions, multiplayer orchestration, MCP, OAuth, scoped permissions, durable event history, replay, results, analysis, PostgreSQL, background and render workers, deployment, and observability.",
            ],
            gap=3,
        )
    )
    story.append(
        role(
            "Morpheus",
            "Archived game modernization and software preservation",
            "ARCHIVED",
            "Cross-platform adventure runtime",
            [
                "Preserves a long-running, data-driven game runtime across browser, Electron, PhoneGap, and later Next.js work; source history survives while the original backend and hosted services do not.",
            ],
            gap=3,
        )
    )
    story.append(
        role(
            "Selected open source",
            "CaptEmulation to 0xFlicker",
            "ONGOING",
            "Developer libraries, autonomous systems, serverless platforms, and protocol tooling",
            [
                "Work includes Mold/service-builder dependency injection, autonomous game agents, a bounded top-N DynamoDB ranker, Bitcoin inscriptions tooling, and smart-contract infrastructure.",
            ],
            gap=1,
        )
    )

    story.extend(section("Education + technologies"))
    education = Table(
        [
            [
                Paragraph(
                    "<b>The University of Texas at Austin</b><br/>Bachelor of Science in Computer Engineering",
                    education_style,
                ),
                Paragraph("1995 - 2000", date_style),
            ]
        ],
        colWidths=[5.65 * inch, 1.18 * inch],
        hAlign="LEFT",
    )
    education.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.extend(
        [
            education,
            Spacer(1, 4),
            Paragraph(
                "<b>Selected technologies:</b> TypeScript, JavaScript, React, Node.js, GraphQL, PostgreSQL, AWS, Google Cloud, Kubernetes, Docker, CI/CD, observability, OAuth, MCP, HTML5, WebGL",
                small_style,
            ),
        ]
    )
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = ResumeDocument(str(OUTPUT))
    document.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
