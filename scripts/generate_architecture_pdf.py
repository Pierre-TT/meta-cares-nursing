from __future__ import annotations

import json
import re
import subprocess
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PATH = OUTPUT_DIR / "meta-cares-architecture-and-functionalities-2026-03-10.pdf"

ROLE_ORDER = [
    "Auth/Public",
    "Nurse",
    "Coordinator",
    "Patient",
    "Admin",
    "Billing office",
    "System",
]

STACK_ORDER = [
    "Frontend",
    "State and data",
    "Backend and platform",
    "Data and APIs",
    "Testing and tooling",
]


@dataclass
class RouteEntry:
    role: str
    path: str
    component: str
    file_path: str


@dataclass
class MigrationEntry:
    name: str
    domain: str
    tables: list[str]
    functions: list[str]


def register_fonts() -> tuple[str, str, str]:
    candidates = {
        "MetaSans": Path("C:/Windows/Fonts/segoeui.ttf"),
        "MetaSansBold": Path("C:/Windows/Fonts/segoeuib.ttf"),
        "MetaSansItalic": Path("C:/Windows/Fonts/segoeuii.ttf"),
    }

    for font_name, font_path in candidates.items():
        if font_path.exists():
            pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
        else:
            return ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique")

    return ("MetaSans", "MetaSansBold", "MetaSansItalic")


FONT_NAME, FONT_BOLD, FONT_ITALIC = register_fonts()


def command_output(*args: str) -> str:
    try:
        completed = subprocess.run(
            args,
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except Exception:
        return "unavailable"

    return completed.stdout.strip() or "unavailable"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def classify_route(path: str) -> str:
    if path.startswith("/nurse"):
        return "Nurse"
    if path.startswith("/coordinator"):
        return "Coordinator"
    if path.startswith("/patient"):
        return "Patient"
    if path.startswith("/admin"):
        return "Admin"
    if path.startswith("/billing"):
        return "Billing office"
    if path.startswith("/login") or path.startswith("/register") or path.startswith("/forgot-password") or path.startswith("/reset-password") or path.startswith("/onboarding"):
        return "Auth/Public"
    return "System"


def prettify_domain(slug: str) -> str:
    return slug.replace("_", " ").strip().title()


def component_export_index() -> dict[str, str]:
    index: dict[str, str] = {}
    export_pattern = re.compile(r"export\s+(?:default\s+)?function\s+([A-Za-z0-9_]+)")

    for file_path in ROOT.glob("src/pages/**/*.tsx"):
        content = read_text(file_path)
        for match in export_pattern.finditer(content):
            index.setdefault(match.group(1), str(file_path.relative_to(ROOT)).replace("\\", "/"))

    return index


def extract_routes() -> list[RouteEntry]:
    app_text = read_text(ROOT / "src" / "App.tsx")
    route_pattern = re.compile(r'path="([^"]+)"\s+element={<([A-Za-z0-9_]+)')
    component_to_file = component_export_index()
    routes: list[RouteEntry] = []

    for path, component in route_pattern.findall(app_text):
        routes.append(
            RouteEntry(
                role=classify_route(path),
                path=path,
                component=component,
                file_path=component_to_file.get(component, "unresolved"),
            )
        )

    deduped = {(route.path, route.component): route for route in routes}
    return sorted(deduped.values(), key=lambda route: (ROLE_ORDER.index(route.role), route.path))


def extract_migrations() -> list[MigrationEntry]:
    entries: list[MigrationEntry] = []
    table_pattern = re.compile(
        r"create\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?\"?([a-zA-Z0-9_]+)\"?",
        re.IGNORECASE,
    )
    function_pattern = re.compile(
        r"create\s+or\s+replace\s+function\s+(?:public\.)?([a-zA-Z0-9_]+)",
        re.IGNORECASE,
    )

    for file_path in sorted((ROOT / "supabase" / "migrations").glob("*.sql")):
        content = read_text(file_path)
        filename = file_path.name
        domain_slug = re.sub(r"^\d+_", "", filename).removesuffix(".sql")
        entries.append(
            MigrationEntry(
                name=filename,
                domain=prettify_domain(domain_slug),
                tables=sorted(set(table_pattern.findall(content))),
                functions=sorted(set(function_pattern.findall(content))),
            )
        )

    return entries


def list_files(glob_pattern: str) -> list[Path]:
    return sorted(ROOT.glob(glob_pattern))


def load_package_json() -> dict:
    return json.loads(read_text(ROOT / "package.json"))


def dependency_groups(package_json: dict) -> dict[str, str]:
    deps = package_json.get("dependencies", {})
    dev_deps = package_json.get("devDependencies", {})

    return {
        "Frontend": ", ".join(
            [
                f"React {deps.get('react', '')}",
                f"React DOM {deps.get('react-dom', '')}",
                f"Vite {dev_deps.get('vite', '')}",
                f"TypeScript {dev_deps.get('typescript', '')}",
            ]
        ),
        "State and data": ", ".join(
            [
                f"React Router {deps.get('react-router-dom', '')}",
                f"TanStack Query {deps.get('@tanstack/react-query', '')}",
                f"Zustand {deps.get('zustand', '')}",
            ]
        ),
        "Backend and platform": ", ".join(
            [
                f"Supabase JS {deps.get('@supabase/supabase-js', '')}",
                "Supabase Auth",
                "Supabase Postgres",
                "Supabase Storage",
                "Supabase Edge Functions",
            ]
        ),
        "Data and APIs": ", ".join(
            [
                f"date-fns {deps.get('date-fns', '')}",
                f"Recharts {deps.get('recharts', '')}",
                "Open-Meteo Forecast API",
                "Optional OpenAI Chat Completions in the ai-voice-note function",
            ]
        ),
        "Testing and tooling": ", ".join(
            [
                f"Vitest {dev_deps.get('vitest', '')}",
                f"Testing Library {dev_deps.get('@testing-library/react', '')}",
                f"Tailwind CSS {dev_deps.get('tailwindcss', '')}",
                f"ESLint {dev_deps.get('eslint', '')}",
            ]
        ),
    }


def inventory_snapshot() -> dict[str, int]:
    page_files = [path for path in list_files("src/pages/**/*.tsx") if ".test." not in path.name]
    hook_files = [path for path in list_files("src/hooks/*.ts*") if ".test." not in path.name]
    lib_files = [path for path in list_files("src/lib/*.ts*") if ".test." not in path.name]
    component_files = [path for path in list_files("src/components/**/*.tsx") if ".test." not in path.name]
    design_system_files = [path for path in list_files("src/design-system/*.tsx") if ".test." not in path.name]
    test_files = list_files("src/**/*.test.ts*")
    migrations = list_files("supabase/migrations/*.sql")
    edge_functions = list((ROOT / "supabase" / "functions").glob("*"))

    return {
        "pages": len(page_files),
        "hooks": len(hook_files),
        "lib_modules": len(lib_files),
        "components": len(component_files),
        "design_system": len(design_system_files),
        "test_files": len(test_files),
        "migrations": len(migrations),
        "edge_functions": len([path for path in edge_functions if path.is_dir()]),
    }


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="MetaTitle",
            fontName=FONT_BOLD,
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#0F5A8A"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MetaSubTitle",
            fontName=FONT_NAME,
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#475569"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            fontName=FONT_BOLD,
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=8,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubSection",
            fontName=FONT_BOLD,
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#1573AE"),
            spaceBefore=4,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            fontName=FONT_NAME,
            fontSize=9.3,
            leading=13,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletMeta",
            fontName=FONT_NAME,
            fontSize=9.3,
            leading=13,
            leftIndent=14,
            firstLineIndent=-8,
            bulletIndent=0,
            spaceAfter=4,
            textColor=colors.HexColor("#0F172A"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallMeta",
            fontName=FONT_NAME,
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#475569"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableMeta",
            fontName=FONT_NAME,
            fontSize=8.2,
            leading=11,
            textColor=colors.HexColor("#0F172A"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableMetaBold",
            fontName=FONT_BOLD,
            fontSize=8.2,
            leading=11,
            textColor=colors.white,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CenterMeta",
            fontName=FONT_BOLD,
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0F5A8A"),
        )
    )
    return styles


STYLES = build_styles()


def para(text: str, style_name: str = "Body") -> Paragraph:
    safe = escape(text).replace("\n", "<br/>")
    return Paragraph(safe, STYLES[style_name])


def bullet(text: str) -> Paragraph:
    safe = escape(text).replace("\n", "<br/>")
    return Paragraph(safe, STYLES["BulletMeta"], bulletText="•")


def meta_table(rows: list[list[str | Paragraph]], col_widths: list[float], repeat_rows: int = 1) -> LongTable:
    processed_rows: list[list[Paragraph]] = []

    for row_index, row in enumerate(rows):
        processed_row: list[Paragraph] = []
        for value in row:
            if isinstance(value, Paragraph):
                processed_row.append(value)
            else:
                style = "TableMetaBold" if row_index < repeat_rows else "TableMeta"
                processed_row.append(para(value, style))
        processed_rows.append(processed_row)

    table = LongTable(processed_rows, colWidths=col_widths, repeatRows=repeat_rows)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, repeat_rows - 1), colors.HexColor("#0F5A8A")),
                ("TEXTCOLOR", (0, 0), (-1, repeat_rows - 1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#94A3B8")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, repeat_rows), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, repeat_rows), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def metric_box_rows(metrics: list[tuple[str, str]]) -> Table:
    cells: list[list[Paragraph]] = []
    row: list[Paragraph] = []

    for label, value in metrics:
        content = Paragraph(
            f"<para align='center'><font name='{FONT_BOLD}' size='16' color='#0F5A8A'>{escape(value)}</font><br/><font name='{FONT_NAME}' size='8' color='#475569'>{escape(label)}</font></para>",
            STYLES["Body"],
        )
        row.append(content)
        if len(row) == 4:
            cells.append(row)
            row = []

    if row:
        while len(row) < 4:
            row.append(para("", "Body"))
        cells.append(row)

    table = Table(cells, colWidths=[42 * mm] * 4)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def architecture_diagram() -> Drawing:
    drawing = Drawing(500, 230)
    palette = {
        "blue": colors.HexColor("#DFF0FF"),
        "green": colors.HexColor("#E8F7E4"),
        "amber": colors.HexColor("#FFF6DB"),
        "text": colors.HexColor("#0F172A"),
        "border": colors.HexColor("#94A3B8"),
    }

    boxes = [
        (18, 152, 132, 50, palette["blue"], "Web UI", ["React 19, Vite", "Tailwind, design-system"]),
        (184, 152, 132, 50, palette["green"], "Role shells", ["Auth guards", "layouts, routing"]),
        (350, 152, 132, 50, palette["amber"], "State layer", ["React Query", "Zustand, UI stores"]),
        (100, 58, 150, 58, palette["green"], "Supabase backend", ["Auth, Postgres", "Storage, migrations"]),
        (300, 58, 150, 58, palette["blue"], "Domain services", ["HAD, billing, consent", "clinical modules"]),
        (184, 10, 132, 32, palette["amber"], "External providers", ["Open-Meteo, OpenAI", "connector facades"]),
    ]

    for x, y, width, height, fill, title, subtitle_lines in boxes:
        drawing.add(Rect(x, y, width, height, rx=8, ry=8, strokeColor=palette["border"], fillColor=fill))
        drawing.add(String(x + 8, y + height - 16, title, fontName=FONT_BOLD, fontSize=10, fillColor=palette["text"]))
        for index, line in enumerate(subtitle_lines):
            drawing.add(
                String(
                    x + 8,
                    y + height - 30 - (index * 10),
                    line,
                    fontName=FONT_NAME,
                    fontSize=7.3,
                    fillColor=palette["text"],
                )
            )

    arrows = [
        (150, 176, 184, 176),
        (316, 176, 350, 176),
        (250, 152, 250, 116),
        (316, 152, 376, 116),
        (250, 58, 250, 42),
        (376, 58, 316, 42),
    ]

    for x1, y1, x2, y2 in arrows:
        drawing.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#1573AE"), strokeWidth=1.1))

    return drawing


def flow_diagram() -> Drawing:
    drawing = Drawing(500, 175)
    blocks = [
        (15, 110, 92, 42, "#DFF0FF", ["1. Restore session"]),
        (125, 110, 92, 42, "#E8F7E4", ["2. Load profile"]),
        (235, 110, 92, 42, "#FFF6DB", ["3. Resolve role", "shell"]),
        (345, 110, 92, 42, "#DFF0FF", ["4. Fetch page", "data"]),
        (125, 35, 92, 42, "#E8F7E4", ["5. Supabase", "tables and RPCs"]),
        (235, 35, 92, 42, "#FFF6DB", ["6. Render", "snapshots"]),
        (345, 35, 92, 42, "#E8F7E4", ["7. Audit and", "offline queue"]),
    ]

    for x, y, width, height, fill, label_lines in blocks:
        drawing.add(
            Rect(
                x,
                y,
                width,
                height,
                rx=8,
                ry=8,
                strokeColor=colors.HexColor("#94A3B8"),
                fillColor=colors.HexColor(fill),
            )
        )
        for index, line in enumerate(label_lines):
            drawing.add(
                String(
                    x + 8,
                    y + 24 - (index * 10),
                    line,
                    fontName=FONT_NAME,
                    fontSize=8,
                    fillColor=colors.HexColor("#0F172A"),
                )
            )

    for x1, y1, x2, y2 in [
        (107, 131, 125, 131),
        (217, 131, 235, 131),
        (327, 131, 345, 131),
        (391, 110, 391, 77),
        (327, 56, 345, 56),
        (217, 56, 235, 56),
        (171, 110, 171, 77),
        (171, 77, 171, 56),
    ]:
        drawing.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#1573AE"), strokeWidth=1.1))

    return drawing


def append_section_header(story: list, title: str) -> None:
    story.append(Paragraph(escape(title), STYLES["Section"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1")))
    story.append(Spacer(1, 4))


def route_matrix(routes: list[RouteEntry]) -> dict[str, list[RouteEntry]]:
    grouped: dict[str, list[RouteEntry]] = defaultdict(list)
    for route in routes:
        grouped[route.role].append(route)
    return grouped


def migration_summary(entries: list[MigrationEntry]) -> tuple[int, int]:
    table_count = sum(len(entry.tables) for entry in entries)
    function_count = sum(len(entry.functions) for entry in entries)
    return table_count, function_count


def role_capability_rows(grouped_routes: dict[str, list[RouteEntry]]) -> list[list[str]]:
    return [
        ["Role", "Coverage", "Representative routes"],
        [
            "Auth/Public",
            "Login, self-registration, password recovery and onboarding flow before users enter a role shell.",
            ", ".join(route.path for route in grouped_routes.get("Auth/Public", [])[:5]),
        ],
        [
            "Nurse",
            "Daily dashboard, route planning, patient file access, visit execution, wound care, BelRAI, billing, HAD, teleconsultation, education and operational utilities.",
            ", ".join(route.path for route in grouped_routes.get("Nurse", [])[:6]) + ", ...",
        ],
        [
            "Coordinator",
            "Operational dashboard, planning, team orchestration, live map, messaging, absences, shifts, reconciliation, caseload and HAD command center.",
            ", ".join(route.path for route in grouped_routes.get("Coordinator", [])[:6]) + ", ...",
        ],
        [
            "Patient",
            "Patient home, health summaries, treatments, documents, appointments, messages, diary, hospital mode and self-service profile management.",
            ", ".join(route.path for route in grouped_routes.get("Patient", [])[:6]) + ", ...",
        ],
        [
            "Admin",
            "Platform dashboard, users, security, audit, RGPD, data governance, consents, incidents, certificates, backup/recovery and settings.",
            ", ".join(route.path for route in grouped_routes.get("Admin", [])[:6]) + ", ...",
        ],
        [
            "Billing office",
            "Billing dashboard, queueing, eFact batches, rejections, corrections, reconciliation, reporting, agreements, patient accounts and tariff simulation.",
            ", ".join(route.path for route in grouped_routes.get("Billing office", [])[:6]) + ", ...",
        ],
    ]


def add_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont(FONT_NAME, 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(18 * mm, 11 * mm, "Meta Cares architecture report")
    canvas.drawRightString(192 * mm, 11 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_story() -> list:
    package_json = load_package_json()
    dependencies = dependency_groups(package_json)
    inventory = inventory_snapshot()
    routes = extract_routes()
    grouped_routes = route_matrix(routes)
    migrations = extract_migrations()
    total_tables, total_functions = migration_summary(migrations)
    branch = command_output("git", "branch", "--show-current")
    commit = command_output("git", "rev-parse", "--short", "HEAD")
    generation_date = datetime.now().strftime("%Y-%m-%d %H:%M")
    directories = [
        ("src/pages", "Role-oriented page components for nurse, coordinator, patient, admin, billing and shared flows."),
        ("src/layouts", "Role shells with navigation, profile entry points and responsive chrome."),
        ("src/hooks", "React Query hooks and UI behavior hooks for domain access."),
        ("src/lib", "Typed domain modules, Supabase access helpers and workflow logic."),
        ("src/components", "Feature-specific widgets split by role."),
        ("src/design-system", "Reusable primitives such as Button, Card, Avatar, Modal, GradientHeader and StatRing."),
        ("src/stores", "Zustand stores for auth, UI theme/sidebar state and i18n."),
        ("supabase/migrations", "Schema evolution, seed data and connector-related backend extensions."),
        ("supabase/functions/ai-voice-note", "Edge Function that parses voice notes, extracts vitals and can optionally enhance SOAP output with OpenAI."),
        ("docs", "Compliance and operational documentation; currently includes the welcome-pack audit."),
    ]

    story: list = []

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("Meta Cares Nursing App", STYLES["MetaTitle"]))
    story.append(Paragraph("Architecture and functionality deep dive", STYLES["MetaTitle"]))
    story.append(
        Paragraph(
            f"Repository-scanned PDF generated on {escape(generation_date)} from {escape(str(ROOT))}.",
            STYLES["MetaSubTitle"],
        )
    )
    story.append(
        Paragraph(
            "This document describes the current codebase architecture, user-facing capabilities, domain modules, backend shape and operational caveats. It is based on direct repository inspection rather than product marketing copy.",
            STYLES["Body"],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        metric_box_rows(
            [
                ("Roles", "5"),
                ("Routes", str(len(routes))),
                ("Pages", str(inventory["pages"])),
                ("Hooks", str(inventory["hooks"])),
                ("Lib modules", str(inventory["lib_modules"])),
                ("Components", str(inventory["components"])),
                ("Test files", str(inventory["test_files"])),
                ("Migrations", str(inventory["migrations"])),
            ]
        )
    )
    story.append(Spacer(1, 12))
    story.append(para(f"Git branch: {branch}", "SmallMeta"))
    story.append(para(f"Git commit: {commit}", "SmallMeta"))
    story.append(para("Primary runtime: React SPA served by Vite, backed by Supabase services.", "SmallMeta"))
    story.append(PageBreak())

    append_section_header(story, "Executive summary")
    story.extend(
        [
            para(
                "Meta Cares is a multi-role healthcare operations SPA for Belgian home nursing. The application is organized as one React codebase that branches into dedicated role shells for nurses, coordinators, patients, administrators and the billing office."
            ),
            para(
                "The frontend is opinionated around React Router for role segmentation, React Query for server state, Zustand for session/UI/i18n state, and a custom design system layered over Tailwind CSS 4. The backend contract is centered on Supabase Auth, Postgres tables, Storage and one checked-in Edge Function."
            ),
            para(
                "Functionally, the codebase goes well beyond a generic CRUD app. It models daily tours, patient files, visits, wound care, BelRAI, eAgreement, consent tracking, hourly pilot billing, billing autopilot, HAD episodes, administrative compliance views, patient self-service and real weather context for nurses."
            ),
            para(
                "The strongest architectural pattern in the repo is the separation between page shells and domain modules: pages are mostly presentation and orchestration, while hooks and lib modules own data fetching, transformation, queueing and workflow logic. The main readiness caveat is external connector maturity: the audit document still flags several Belgian healthcare surfaces as mock, fallback or not yet production-proven."
            ),
        ]
    )

    append_section_header(story, "Architecture at a glance")
    story.append(architecture_diagram())
    story.append(Spacer(1, 8))
    story.extend(
        [
            bullet("A single browser SPA hosts all roles and relies on route guards plus role-specific layouts to shape each experience."),
            bullet("React Query is the main data-fetching layer; domain hooks call typed lib modules that in turn talk to Supabase."),
            bullet("Supabase provides authentication, the typed database contract, storage for profile images and the voice-note Edge Function runtime."),
            bullet("Cross-cutting services include localStorage-backed offline queues, audit logging via a `log_data_access` RPC, geolocation-backed weather and browser speech recognition."),
            bullet("Belgian healthcare connector surfaces exist in the UI and backend model, but the compliance audit still marks some of them as partial or fallback implementations."),
        ]
    )

    append_section_header(story, "Source basis and methodology")
    story.extend(
        [
            bullet("Primary entry points read: `src/App.tsx`, `src/main.tsx`, layouts, stores, hooks, domain libraries, pages and the Supabase migrations."),
            bullet("Operational caveats sourced from `docs/welcome-pack-compliance-audit.md`, which documents structural coverage as well as remaining connector and governance gaps."),
            bullet("The report describes the checked-in application shape as of 2026-03-10. It does not claim that every workflow is production-certified unless the repo evidence supports it."),
        ]
    )

    append_section_header(story, "Technology stack")
    stack_rows = [["Layer", "Observed stack"]] + [[layer, dependencies[layer]] for layer in STACK_ORDER]
    story.append(meta_table(stack_rows, [42 * mm, 128 * mm]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Repository structure", STYLES["SubSection"]))
    directory_rows = [["Path", "Purpose"]] + [[path, description] for path, description in directories]
    story.append(meta_table(directory_rows, [44 * mm, 126 * mm]))
    story.append(Spacer(1, 10))
    story.extend(
        [
            para("Two source folders currently exist as placeholders rather than active architecture pillars: `src/features` and `src/services` are present but empty."),
            para("Styling is implemented with Tailwind CSS 4 plus custom CSS variables in `src/index.css`. The app defines its own design tokens, glass effects, brand gradients, motion helpers and touch-target rules instead of using a third-party component framework."),
            para("Internationalization is built in at the store level. `src/stores/i18nStore.ts` ships French, Dutch and German translation maps and persists locale selection in localStorage."),
        ]
    )

    append_section_header(story, "Frontend architecture")
    story.extend(
        [
            Paragraph("Shell and navigation model", STYLES["SubSection"]),
            bullet("`src/main.tsx` mounts a `QueryClientProvider` around the app and keeps the entry point minimal."),
            bullet("`src/App.tsx` owns the route tree, enables React Router future flags and wraps pages in `AnimatePresence`, `Suspense` and `PageSkeleton`."),
            bullet("Every major role has a dedicated layout: nurse and patient use mobile-first bottom-tab shells, while coordinator, admin and billing also expose larger-screen sidebars."),
            bullet("The design system exports reusable primitives such as Button, Card, Badge, Avatar, Modal, GradientHeader, StatRing and AnimatedPage so role pages share motion and visual language."),
            Paragraph("State and rendering model", STYLES["SubSection"]),
            bullet("`authStore` is the session authority. It restores Supabase Auth state, reads the `profiles` row, exposes role-aware home/profile routes and centralizes logout and session sync."),
            bullet("`uiStore` persists theme selection and toggles the dark class at the document root. `i18nStore` persists locale and serves translations through a small Zustand store."),
            bullet("React Query defaults are conservative but app-wide: five-minute stale time, one retry and no refetch-on-window-focus."),
            bullet("Pages stay thin by leaning on hooks such as `usePlatformData`, `useHadData`, `useBillingAutopilot`, `useNurseClinicalData`, `useHourlyPilotData` and `useEHealthCompliance`."),
        ]
    )
    story.append(Paragraph("Client flow", STYLES["SubSection"]))
    story.append(flow_diagram())

    story.append(PageBreak())
    append_section_header(story, "Backend and Supabase architecture")
    story.extend(
        [
            para(
                "The codebase treats Supabase as the primary backend platform. `src/lib/supabase.ts` creates a typed client from `VITE_SUPABASE_URL` and a publishable/anon key, with browser-local session persistence enabled."
            ),
            para(
                "Schema shape is encoded in `src/lib/database.types.ts` and evolved through SQL migrations. The migration set now covers the core platform schema, initial data seeding, HAD, BelRAI, wound assessments, eAgreement, hourly pilot billing, eHealth compliance extensions, data-access logging scope and nurse professional profile fields."
            ),
            bullet("Authentication: Supabase Auth session + `profiles` table + client-side route guards."),
            bullet("Data persistence: Postgres tables across clinical, planning, billing, admin and compliance domains."),
            bullet("Storage: profile image uploads are written to the public `profile-images` bucket."),
            bullet("Edge compute: the checked-in `ai-voice-note` function performs vital extraction, act-code suggestion, clinical alert generation and optional OpenAI-enhanced SOAP summarization."),
            bullet("Auditability: domain modules call `queueDataAccessLog`, which wraps the `log_data_access` RPC and enriches payloads with browser surface metadata."),
        ]
    )

    story.append(Paragraph("Migration footprint", STYLES["SubSection"]))
    story.append(
        metric_box_rows(
            [
                ("SQL migrations", str(len(migrations))),
                ("Tables created", str(total_tables)),
                ("Functions declared", str(total_functions)),
                ("Edge functions", str(inventory["edge_functions"])),
                ("Test files", str(inventory["test_files"])),
                ("Role shells", "5"),
                ("Locales", "3"),
                ("Weather provider", "Open-Meteo"),
            ]
        )
    )
    story.append(Spacer(1, 8))
    story.extend(
        [
            para("The migration inventory shows a domain-structured backend rather than a generic single-table design. Clinical and operational objects are spread across core platform entities, HAD episode tables, wound and BelRAI assessments, hourly billing lines/summaries, consent/audit logs and eAgreement workflows."),
            para("The repo evidence is strong on schema breadth. The production-readiness gap is not missing modeling; it is connector proof, operational governance evidence and keeping live deployments synchronized with the checked-in migrations."),
        ]
    )

    story.append(PageBreak())
    append_section_header(story, "Functional coverage by role")
    story.append(meta_table(role_capability_rows(grouped_routes), [26 * mm, 85 * mm, 57 * mm]))
    story.append(Spacer(1, 10))

    role_sections = [
        (
            "Nurse experience",
            [
                "Dashboard combines tour metrics, quick actions, HAD prioritization, weather alerts and compliance widgets.",
                "Operational flow covers tour lists, maps, patient identification, full patient detail, live visit execution and visit summaries.",
                "Clinical modules include wound care, Katz, BelRAI, Vitalink-facing screens, consent, eAgreement, teleconsultation and HAD episode handling.",
                "Support modules include reports, journal, schedule, chat, incidents, mileage, emergency, inventory, education, drug check, handover, scanner, settings and profile.",
                "Smart assistance surfaces include voice notes, smart visit briefing, route optimization and weather/health alerting.",
            ],
        ),
        (
            "Coordinator experience",
            [
                "Coordinator routes cover a command-center style dashboard, planning, team, billing/reconciliation, map, messaging, absences, shifts, caseload, quality and continuity.",
                "The planning page has explicit UI for manual visit creation, auto-assignment, optimization and HAD-aware prioritization.",
                "The HAD command center extends beyond dashboard metrics into episode detail, operations status and cross-team coordination.",
            ],
        ),
        (
            "Patient experience",
            [
                "Patient home focuses on ETA tracking, medication reminders, daily timeline, quick communication actions, health vitals and an AI health tip.",
                "Additional patient modules cover treatments, documents, family information, messages, appointments, costs, parameters, questionnaire, diary, hospital mode and profile management.",
                "The patient shell is designed as a self-service portal rather than a simplified read-only dashboard.",
            ],
        ),
        (
            "Admin experience",
            [
                "Admin covers platform command-center dashboards, users, security, audit, RGPD, data governance, consents, incidents, nomenclature, MyCareNet, certificates, pilot billing, backups, settings and profile management.",
                "Admin data is normalized through dashboard sections and eHealth compliance snapshots, making the admin layer more configuration- and insight-driven than CRUD-centric.",
                "Pilot billing is modeled as a real feature area, including admin-level hourly overview and schema-aware fallback handling.",
            ],
        ),
        (
            "Billing office experience",
            [
                "Billing office covers the operational pipeline from work queue to eFact batches, rejections, corrections, agreements, patient accounts, reconciliation and reporting.",
                "Specialized helper logic exists for billing autopilot, agreements, simulator flows, mutuality reference data and billing-focused audit/settings pages.",
                "The role shell is not a copy of admin or nurse; it has its own dashboard and domain language oriented around revenue, acceptance, rejections and export readiness.",
            ],
        ),
    ]

    for title, items in role_sections:
        story.append(Paragraph(title, STYLES["SubSection"]))
        for item in items:
            story.append(bullet(item))

    story.append(PageBreak())
    append_section_header(story, "Domain modules and cross-cutting services")
    domain_rows = [
        ["Module or area", "What it does"],
        [
            "Platform snapshots",
            "Maps dashboard sections for admin, coordinator, billing and patient-home data. Provides empty/fallback snapshots and profile mapping utilities.",
        ],
        [
            "HAD (`src/lib/had.ts`)",
            "Large domain module for Hospitalization at Home episodes, teams, care plans, medication orders, measurements, alerts, tasks, logistics and visit links.",
        ],
        [
            "BelRAI (`src/lib/belrai*.ts`)",
            "BelRAI model and Supabase bridge with local draft persistence and patient resolution support.",
        ],
        [
            "Nurse clinical (`src/lib/nurseClinical.ts`)",
            "Visit summaries, vitals, wound assessments, geofencing/location events, hourly pilot summaries and related clinical/billing data transforms.",
        ],
        [
            "eAgreement and consent",
            "eAgreement registry, MyCareNet-facing status interpretation, patient consent snapshots, therapeutic link checks and consent sync history.",
        ],
        [
            "eHealth compliance",
            "Admin compliance snapshot built from consent data, sync logs and data-access logs.",
        ],
        [
            "Billing autopilot",
            "Prioritizes hourly billing dossiers into ready, blocked, review and recovery lanes with navigation targets.",
        ],
        [
            "Smart visit briefing",
            "Aggregates risk items, care focus, wound trends, medications, HAD detail, consents and recent notes into a visit-readiness briefing.",
        ],
        [
            "Offline clinical sync",
            "Queues wound assessments locally, tracks pending BelRAI drafts and flushes data when connectivity returns.",
        ],
        [
            "Weather",
            "Fetches live forecast data from Open-Meteo, enriches it into nurse-facing operational and patient-risk alerts and uses browser geolocation when available.",
        ],
        [
            "Profile management",
            "Cross-role profile editing, local avatar upload to Supabase Storage, password changes and nurse-only professional fields such as INAMI, BCE and company details.",
        ],
    ]
    story.append(meta_table(domain_rows, [48 * mm, 122 * mm]))
    story.append(Spacer(1, 10))
    story.extend(
        [
            para("One of the codebase's strengths is that high-value workflows are not buried inside pages. Most business rules live in standalone modules, which makes the route layer easier to reason about and keeps domain logic testable."),
            para("The module set also shows the app's intended operating model: direct care delivery, operational coordination, billing intelligence and compliance/connector administration all live in the same product boundary."),
        ]
    )

    append_section_header(story, "Data flow narratives")
    flow_items = [
        "Authentication bootstrap: the browser restores a Supabase session, `authStore.initialize()` loads the `profiles` row, and role-aware home/profile paths determine the correct shell.",
        "Dashboard composition: page hook -> React Query cache -> lib module -> Supabase query -> normalized snapshot -> design-system cards and charts.",
        "Visit assistance: route/tour and patient pages combine patient records, clinical history, wound assessments, HAD context, consents and agreements to produce smart briefings and visit summaries.",
        "Offline wound capture: a wound assessment can be queued into localStorage, surfaced in an offline snapshot and flushed to Supabase once the browser is online again.",
        "Voice-note pipeline: browser speech recognition yields transcript text, the `ai-voice-note` Edge Function extracts vitals and act-code suggestions locally, then can optionally call OpenAI to tighten SOAP formatting.",
        "Operational weather: geolocation or Brussels fallback -> Open-Meteo API -> normalized snapshot -> nurse weather card with route-risk and patient-risk messages.",
    ]
    for item in flow_items:
        story.append(bullet(item))

    story.append(PageBreak())
    append_section_header(story, "Integrations and connector posture")
    integration_rows = [
        ["Integration surface", "Observed status in code"],
        [
            "Supabase Auth / Postgres / Storage",
            "Core platform backbone. The app depends on these services directly for session, profile, data and avatar storage.",
        ],
        [
            "Open-Meteo weather",
            "Live provider integrated for nurse-facing weather and health alerts.",
        ],
        [
            "OpenAI",
            "Optional enhancement path inside the voice-note Edge Function; the function still works with deterministic local extraction when no API key is present.",
        ],
        [
            "Browser APIs",
            "SpeechRecognition, geolocation, localStorage and online/offline events are used directly in the client.",
        ],
        [
            "Belgian healthcare services",
            "Surface area exists for BelRAI, Vitalink, eHealthBox, MyCareNet, eAgreement and consent sync. The welcome-pack audit still says several connector surfaces remain partial, mock or fallback-based.",
        ],
    ]
    story.append(meta_table(integration_rows, [48 * mm, 122 * mm]))
    story.append(Spacer(1, 10))
    story.extend(
        [
            para("The repo evidence supports a broad connector strategy, but not full connector certification. The architecture is prepared for Belgian healthcare service integration; the operational audit still treats some of those surfaces as not fully production-proven."),
            para("That distinction matters for any external architecture review: the system boundary is broad and well-modeled, but live connector readiness should be assessed environment by environment rather than inferred solely from screen availability."),
        ]
    )

    append_section_header(story, "Quality, testing and maintainability signals")
    quality_items = [
        f"The repo currently contains {inventory['test_files']} colocated test files across stores, hooks, lib modules, admin, billing, coordinator, shared profile and design-system areas.",
        "React Query defaults are centralized instead of repeated ad hoc at the page level, reducing data-fetch drift.",
        "The design system centralizes cards, buttons, tabs, modals, headers, skeletons, avatars and animation wrappers, which lowers UI duplication.",
        "Typed Supabase access (`database.types.ts`) and typed domain modules reduce implicit JSON handling in the page layer.",
        "Data access logging is part of the normal data layer rather than an afterthought, which is important for healthcare auditability.",
        "The repo also includes a compliance audit document that already calls out the difference between structural presence and production-readiness proof.",
    ]
    for item in quality_items:
        story.append(bullet(item))

    story.append(PageBreak())
    append_section_header(story, "Known limitations and readiness caveats")
    caveats = [
        "The welcome-pack audit explicitly states that some healthcare-facing screens still rely on mock data, static examples or fallback behavior. The examples named there are Vitalink, eHealthBox, nurse eFact, admin MyCareNet, NFC identity and parts of planning, billing, messaging and security dashboards.",
        "The same audit notes that the repository does not yet contain full onboarding or governance evidence such as project dossiers, sector approval records, connector runbooks or continuity evidence required by the welcome pack.",
        "Connector maturity should therefore be described as mixed: the app has broad functional coverage and strong domain modeling, but external Belgian healthcare service readiness is not uniformly proven by the repo alone.",
        "Because the product uses a single frontend for five roles, environment setup quality matters. Broken schemas or partially deployed migrations can disable entire feature areas even when the UI is implemented correctly.",
        "The codebase is architecturally ambitious and already useful for product walkthroughs, internal demos and structured platform development. Production certification still depends on deployed backend state, connector hardening and compliance evidence outside the code.",
    ]
    for item in caveats:
        story.append(bullet(item))

    story.append(PageBreak())
    append_section_header(story, "Appendix A: full route inventory")
    route_rows: list[list[str]] = [["Role", "Path", "Component", "Source file"]]
    for route in routes:
        route_rows.append([route.role, route.path, route.component, route.file_path])
    story.append(meta_table(route_rows, [25 * mm, 55 * mm, 34 * mm, 56 * mm]))

    story.append(PageBreak())
    append_section_header(story, "Appendix B: migration inventory")
    migration_rows: list[list[str | Paragraph]] = [["Migration", "Domain", "Created tables", "Declared functions"]]
    for entry in migrations:
        migration_rows.append(
            [
                entry.name,
                entry.domain,
                ", ".join(entry.tables) if entry.tables else "None detected",
                ", ".join(entry.functions) if entry.functions else "None detected",
            ]
        )
    story.append(meta_table(migration_rows, [46 * mm, 38 * mm, 56 * mm, 40 * mm]))

    return story


def build_pdf() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="Meta Cares architecture and functionalities",
        author="Codex",
        subject="Repository-driven architecture report",
    )
    story = build_story()
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    return OUTPUT_PATH


def main() -> None:
    output = build_pdf()
    print(output)


if __name__ == "__main__":
    main()
