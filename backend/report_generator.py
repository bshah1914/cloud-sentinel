"""
CloudLunar Enterprise — Report Generator
Generates PDF and CSV exports for Dashboard and Audit reports.
"""

import csv
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, PageBreak
)

# ── Severity colors ──────────────────────────────────────────────
SEVERITY_COLORS = {
    "CRITICAL": colors.HexColor("#EF4444"),
    "HIGH": colors.HexColor("#F97316"),
    "MEDIUM": colors.HexColor("#F59E0B"),
    "LOW": colors.HexColor("#EAB308"),
    "INFO": colors.HexColor("#22C55E"),
}

SEVERITY_BG = {
    "CRITICAL": colors.HexColor("#FEE2E2"),
    "HIGH": colors.HexColor("#FFEDD5"),
    "MEDIUM": colors.HexColor("#FEF3C7"),
    "LOW": colors.HexColor("#FEF9C3"),
    "INFO": colors.HexColor("#DCFCE7"),
}

PROVIDER_LABELS = {"aws": "Amazon Web Services", "azure": "Microsoft Azure", "gcp": "Google Cloud Platform"}


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="SectionTitle", fontSize=14, leading=18, spaceAfter=8,
                          textColor=colors.HexColor("#1E293B"), fontName="Helvetica-Bold"))
    ss.add(ParagraphStyle(name="SubTitle", fontSize=10, leading=14, spaceAfter=4,
                          textColor=colors.HexColor("#64748B"), fontName="Helvetica"))
    ss.add(ParagraphStyle(name="CellText", fontSize=8, leading=10, fontName="Helvetica"))
    ss.add(ParagraphStyle(name="CellBold", fontSize=8, leading=10, fontName="Helvetica-Bold"))
    return ss


def _header_table(account, provider, report_type):
    """Branded header block for the top of every PDF."""
    styles = _styles()
    data = [[
        Paragraph("CloudLunar Enterprise", styles["Title"]),
        Paragraph(f"{report_type} Report", styles["SectionTitle"]),
    ], [
        Paragraph(f"Account: {account}  |  Provider: {PROVIDER_LABELS.get(provider, provider).upper()}",
                  styles["SubTitle"]),
        Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", styles["SubTitle"]),
    ]]
    t = Table(data, colWidths=[4 * inch, 4 * inch])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _make_table(headers, rows, col_widths=None):
    """Helper to build a styled table with header row."""
    styles = _styles()
    header_row = [Paragraph(h, styles["CellBold"]) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), styles["CellText"]) for c in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t


# ── Dashboard findings (mirrors frontend logic) ─────────────────
def _compute_dashboard_findings(data):
    findings = []
    iam = data.get("iam_summary") or {}
    pub = data.get("public_summary") or {}

    if not iam.get("AccountMFAEnabled"):
        findings.append({"text": "Root account MFA is not enabled", "severity": "CRITICAL"})
    if iam.get("AccountAccessKeysPresent"):
        findings.append({"text": "Root account has active access keys", "severity": "CRITICAL"})
    if pub.get("rds", 0) > 0:
        findings.append({"text": f"{pub['rds']} publicly accessible RDS instance(s)", "severity": "HIGH"})
    if pub.get("elb_http", 0) > 0:
        findings.append({"text": f"{pub['elb_http']} ELB(s) using HTTP instead of HTTPS", "severity": "HIGH"})

    open_sgs = data.get("open_sgs", 0)
    if open_sgs > 0:
        findings.append({"text": f"{open_sgs} security group(s) open to the world (0.0.0.0/0)", "severity": "HIGH"})

    public_ips = data.get("public_ips") or []
    if len(public_ips) > 0:
        findings.append({"text": f"{len(public_ips)} instance(s) with public IP addresses", "severity": "MEDIUM"})

    no_mfa_users = [u for u in (data.get("iam_users") or []) if not u.get("has_mfa")]
    if no_mfa_users:
        findings.append({"text": f"{len(no_mfa_users)} IAM user(s) without MFA enabled", "severity": "MEDIUM"})

    if not findings:
        findings.append({"text": "No major security issues detected", "severity": "INFO"})

    return findings


# ═══════════════════════════════════════════════════════════════════
#  DASHBOARD PDF
# ═══════════════════════════════════════════════════════════════════
def generate_dashboard_pdf(data: dict, account: str, provider: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    styles = _styles()
    elements = []

    # Header
    elements.append(_header_table(account, provider, "Security Dashboard"))
    elements.append(HRFlowable(width="100%", color=colors.HexColor("#3B82F6"), thickness=2, spaceAfter=12))

    # ── Summary Card ──
    score = data.get("security_score", 0)
    score_color = "#22C55E" if score >= 80 else "#F59E0B" if score >= 50 else "#EF4444"
    elements.append(Paragraph(f'Security Score: <font color="{score_color}"><b>{score}/100</b></font>', styles["SectionTitle"]))
    elements.append(Spacer(1, 4))

    totals = data.get("totals", {})
    if totals:
        summary_rows = [[k.replace("_", " ").title(), str(v)] for k, v in totals.items() if v]
        if summary_rows:
            elements.append(_make_table(["Resource Type", "Count"], summary_rows, [3 * inch, 2 * inch]))
            elements.append(Spacer(1, 12))

    # ── Security Findings ──
    findings = _compute_dashboard_findings(data)
    if findings:
        elements.append(Paragraph("Security Findings", styles["SectionTitle"]))
        rows = []
        for f in findings:
            rows.append([f["severity"], f["text"]])
        t = _make_table(["Severity", "Finding"], rows, [1.5 * inch, 6.5 * inch])
        # Color severity cells
        for i, f in enumerate(findings):
            sev = f["severity"]
            bg = SEVERITY_BG.get(sev, colors.white)
            fg = SEVERITY_COLORS.get(sev, colors.black)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, i + 1), (0, i + 1), bg),
                ("TEXTCOLOR", (0, i + 1), (0, i + 1), fg),
            ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

    # ── Region Usage Matrix ──
    region_matrix = data.get("region_matrix") or {}
    if region_matrix:
        elements.append(Paragraph("Region Usage Matrix", styles["SectionTitle"]))
        all_types = set()
        for region_data in region_matrix.values():
            all_types.update(region_data.keys())
        all_types = sorted(all_types)
        headers = ["Region"] + [t.replace("_", " ").title() for t in all_types]
        rows = []
        for region, counts in sorted(region_matrix.items()):
            row = [region] + [str(counts.get(t, 0)) for t in all_types]
            rows.append(row)
        if rows:
            elements.append(_make_table(headers, rows))
            elements.append(Spacer(1, 12))

    # ── Public IPs ──
    public_ips = data.get("public_ips") or []
    if public_ips:
        elements.append(Paragraph(f"Public IP Addresses ({len(public_ips)})", styles["SectionTitle"]))
        headers = ["IP Address", "Resource", "Name", "Type", "Instance Type", "State", "Region"]
        rows = []
        for ip in public_ips:
            rows.append([
                ip.get("ip", ""), ip.get("resource", ""), ip.get("name", ""),
                ip.get("type", ""), ip.get("instance_type", ""),
                ip.get("state", ""), ip.get("region", ""),
            ])
        elements.append(_make_table(headers, rows))
        elements.append(Spacer(1, 12))

    # ── IAM Users ──
    iam_users = data.get("iam_users") or []
    if iam_users:
        elements.append(Paragraph(f"IAM Users ({len(iam_users)})", styles["SectionTitle"]))
        headers = ["User Name", "MFA Enabled", "Policies", "Groups", "Created"]
        rows = []
        for u in iam_users:
            rows.append([
                u.get("name", ""), "Yes" if u.get("has_mfa") else "No",
                str(u.get("policies_count", 0)),
                ", ".join(u.get("groups", [])) if u.get("groups") else "-",
                u.get("created", ""),
            ])
        elements.append(_make_table(headers, rows))

    doc.build(elements)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════
#  DASHBOARD CSV
# ═══════════════════════════════════════════════════════════════════
def generate_dashboard_csv(data: dict, account: str, provider: str) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)

    w.writerow(["CloudLunar Enterprise — Dashboard Report"])
    w.writerow([f"Account: {account}", f"Provider: {provider}",
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
    w.writerow([])

    # Totals
    w.writerow(["=== Resource Totals ==="])
    w.writerow(["Resource Type", "Count"])
    for k, v in (data.get("totals") or {}).items():
        w.writerow([k.replace("_", " ").title(), v])
    w.writerow([])

    # Security Score
    w.writerow(["Security Score", data.get("security_score", 0)])
    w.writerow([])

    # Findings
    findings = _compute_dashboard_findings(data)
    w.writerow(["=== Security Findings ==="])
    w.writerow(["Severity", "Finding"])
    for f in findings:
        w.writerow([f["severity"], f["text"]])
    w.writerow([])

    # Region Matrix
    region_matrix = data.get("region_matrix") or {}
    if region_matrix:
        all_types = set()
        for rd in region_matrix.values():
            all_types.update(rd.keys())
        all_types = sorted(all_types)
        w.writerow(["=== Region Usage Matrix ==="])
        w.writerow(["Region"] + [t.replace("_", " ").title() for t in all_types])
        for region, counts in sorted(region_matrix.items()):
            w.writerow([region] + [counts.get(t, 0) for t in all_types])
        w.writerow([])

    # Public IPs
    public_ips = data.get("public_ips") or []
    if public_ips:
        w.writerow(["=== Public IP Addresses ==="])
        w.writerow(["IP", "Resource", "Name", "Type", "Instance Type", "State", "Region"])
        for ip in public_ips:
            w.writerow([ip.get("ip"), ip.get("resource"), ip.get("name"),
                         ip.get("type"), ip.get("instance_type"), ip.get("state"), ip.get("region")])
        w.writerow([])

    # IAM Users
    iam_users = data.get("iam_users") or []
    if iam_users:
        w.writerow(["=== IAM Users ==="])
        w.writerow(["User Name", "MFA Enabled", "Policies", "Groups", "Created"])
        for u in iam_users:
            w.writerow([u.get("name"), "Yes" if u.get("has_mfa") else "No",
                         u.get("policies_count", 0),
                         ", ".join(u.get("groups", [])) if u.get("groups") else "",
                         u.get("created", "")])

    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════
#  AUDIT PDF
# ═══════════════════════════════════════════════════════════════════
def generate_audit_pdf(audit_data: dict, account: str, provider: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    styles = _styles()
    elements = []

    # Header
    elements.append(_header_table(account, provider, "Security Audit"))
    elements.append(HRFlowable(width="100%", color=colors.HexColor("#EF4444"), thickness=2, spaceAfter=12))

    # Summary
    total = audit_data.get("total", 0)
    summary = audit_data.get("summary", {})
    elements.append(Paragraph(f"Total Findings: <b>{total}</b>", styles["SectionTitle"]))
    elements.append(Spacer(1, 4))

    if summary:
        rows = [[sev, str(cnt)] for sev, cnt in summary.items() if cnt > 0]
        if rows:
            t = _make_table(["Severity", "Count"], rows, [2 * inch, 2 * inch])
            for i, row in enumerate(rows):
                sev = row[0]
                bg = SEVERITY_BG.get(sev, colors.white)
                fg = SEVERITY_COLORS.get(sev, colors.black)
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, i + 1), (0, i + 1), bg),
                    ("TEXTCOLOR", (0, i + 1), (0, i + 1), fg),
                ]))
            elements.append(t)
            elements.append(Spacer(1, 12))

    # Findings table
    findings = audit_data.get("findings") or []
    if findings:
        elements.append(Paragraph("Detailed Findings", styles["SectionTitle"]))
        headers = ["Severity", "Title", "Region", "Resource", "Description"]
        rows = []
        for f in findings:
            rows.append([
                f.get("severity", ""),
                f.get("title", ""),
                f.get("region", "-"),
                f.get("resource", "-"),
                f.get("description", f.get("issue", "")),
            ])

        t = _make_table(headers, rows, [1 * inch, 2 * inch, 1.2 * inch, 2 * inch, 3.5 * inch])

        # Color severity column
        for i, f in enumerate(findings):
            sev = f.get("severity", "")
            bg = SEVERITY_BG.get(sev, colors.white)
            fg = SEVERITY_COLORS.get(sev, colors.black)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, i + 1), (0, i + 1), bg),
                ("TEXTCOLOR", (0, i + 1), (0, i + 1), fg),
            ]))
        elements.append(t)

    doc.build(elements)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════
#  AUDIT CSV
# ═══════════════════════════════════════════════════════════════════
def generate_audit_csv(audit_data: dict, account: str, provider: str) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)

    w.writerow(["CloudLunar Enterprise — Audit Report"])
    w.writerow([f"Account: {account}", f"Provider: {provider}",
                f"Total Findings: {audit_data.get('total', 0)}",
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
    w.writerow([])

    # Summary
    summary = audit_data.get("summary", {})
    if summary:
        w.writerow(["=== Severity Summary ==="])
        w.writerow(["Severity", "Count"])
        for sev, cnt in summary.items():
            w.writerow([sev, cnt])
        w.writerow([])

    # Findings
    findings = audit_data.get("findings") or []
    w.writerow(["=== Findings ==="])
    w.writerow(["Severity", "Title", "Issue", "Group", "Region", "Resource", "Description", "Details"])
    for f in findings:
        w.writerow([
            f.get("severity", ""), f.get("title", ""), f.get("issue", ""),
            f.get("group", ""), f.get("region", ""), f.get("resource", ""),
            f.get("description", ""), f.get("details", ""),
        ])

    return buf.getvalue()
