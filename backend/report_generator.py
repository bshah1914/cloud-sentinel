"""
CloudSentinel Enterprise — PDF & CSV Report Generator v3
Tight, professional layout with zero wasted space.
"""

import csv
import io
import math
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String, Circle

# ── Constants ────────────────────────────────────────────────────
PW, PH = A4  # 595 x 842
M = 18 * mm  # margin
UW = PW - 2 * M  # usable width ~450pt

C = {  # color palette
    "pri": "#7C3AED", "acc": "#06B6D4", "dark": "#0F172A",
    "bg": "#F8FAFC", "bdr": "#E2E8F0", "mut": "#94A3B8",
    "txt": "#1E293B", "wh": "#FFFFFF",
    "red": "#EF4444", "org": "#F97316", "yel": "#F59E0B",
    "grn": "#10B981", "blu": "#3B82F6",
}
H = lambda c: colors.HexColor(c)

SEV_C = {"CRITICAL": C["red"], "HIGH": C["org"], "MEDIUM": C["yel"], "LOW": "#EAB308", "INFO": C["grn"]}
SEV_BG = {"CRITICAL": "#FEF2F2", "HIGH": "#FFF7ED", "MEDIUM": "#FFFBEB", "LOW": "#FEFCE8", "INFO": "#F0FDF4"}

PROV = {"aws": "Amazon Web Services", "azure": "Microsoft Azure", "gcp": "Google Cloud Platform"}
RES_NAME = {
    "instances": "EC2 Instances", "security_groups": "Security Groups",
    "vpcs": "VPCs", "subnets": "Subnets", "lambdas": "Lambda Functions",
    "buckets": "S3 Buckets", "rds": "RDS Databases", "elbs": "Load Balancers",
    "snapshots": "EBS Snapshots", "network_interfaces": "NICs",
}


# ── Styles ───────────────────────────────────────────────────────
def _ss():
    s = getSampleStyleSheet()
    a = s.add
    a(ParagraphStyle("T1", fontSize=20, leading=24, fontName="Helvetica-Bold", textColor=H(C["pri"]), alignment=TA_CENTER))
    a(ParagraphStyle("T2", fontSize=9, leading=11, fontName="Helvetica", textColor=H(C["mut"]), alignment=TA_CENTER))
    a(ParagraphStyle("H2", fontSize=11, leading=14, fontName="Helvetica-Bold", textColor=H(C["txt"]), spaceBefore=8, spaceAfter=3))
    a(ParagraphStyle("Sm", fontSize=7, leading=9, fontName="Helvetica", textColor=H(C["mut"])))
    a(ParagraphStyle("Bd", fontSize=7.5, leading=10, fontName="Helvetica", textColor=H(C["txt"])))
    a(ParagraphStyle("Cl", fontSize=7, leading=9, fontName="Helvetica"))
    a(ParagraphStyle("CB", fontSize=7, leading=9, fontName="Helvetica-Bold"))
    return s


# ── Components ───────────────────────────────────────────────────
def _bar():
    d = Drawing(UW, 3)
    d.add(Rect(0, 0, UW / 2, 3, fillColor=H(C["pri"]), strokeColor=None))
    d.add(Rect(UW / 2, 0, UW / 2, 3, fillColor=H(C["acc"]), strokeColor=None))
    return d


def _ring(score, w=60, h=50):
    d = Drawing(w, h)
    cx, cy, r = w / 2, h - 8, 18
    clr = C["grn"] if score >= 80 else C["yel"] if score >= 50 else C["red"]
    for i in range(180):
        a = math.radians(180 - i)
        d.add(Circle(cx + r * math.cos(a), cy + r * math.sin(a), 0.8, fillColor=H(C["bdr"]), strokeColor=None))
    for i in range(int(180 * score / 100)):
        a = math.radians(180 - i)
        d.add(Circle(cx + r * math.cos(a), cy + r * math.sin(a), 1.2, fillColor=H(clr), strokeColor=None))
    d.add(String(cx, cy - 5, str(score), fontSize=12, fontName="Helvetica-Bold", fillColor=H(clr), textAnchor="middle"))
    d.add(String(cx, cy - 13, "/100", fontSize=5, fontName="Helvetica", fillColor=H(C["mut"]), textAnchor="middle"))
    return d


def _kpi(val, label, clr=C["pri"], w=58, h=36):
    d = Drawing(w, h)
    d.add(Rect(0, 0, w, h, fillColor=H(C["bg"]), strokeColor=H(C["bdr"]), strokeWidth=0.4, rx=3))
    d.add(String(w / 2, 14, str(val), fontSize=13, fontName="Helvetica-Bold", fillColor=H(clr), textAnchor="middle"))
    d.add(String(w / 2, 4, label, fontSize=5, fontName="Helvetica", fillColor=H(C["mut"]), textAnchor="middle"))
    return d


def _sec(title, sub=None):
    s = _ss()
    els = [Spacer(1, 6)]
    d = Drawing(40, 2)
    d.add(Rect(0, 0, 40, 2, fillColor=H(C["pri"]), strokeColor=None, rx=1))
    els.append(d)
    els.append(Paragraph(title, s["H2"]))
    if sub:
        els.append(Paragraph(sub, s["Sm"]))
    return els


def _tbl(hdrs, rows, ws=None, sev_col=None):
    s = _ss()
    data = [[Paragraph(h, s["CB"]) for h in hdrs]]
    for row in rows:
        data.append([Paragraph(str(c), s["Cl"]) for c in row])
    t = Table(data, colWidths=ws, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), H(C["dark"])),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 0), (-1, 0), 5), ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, H(C["bg"])]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, H(C["bdr"])),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 3), ("BOTTOMPADDING", (0, 1), (-1, -1), 3),
    ]
    t.setStyle(TableStyle(cmds))
    # Color severity column
    if sev_col is not None:
        for i, row in enumerate(rows):
            sv = str(row[sev_col])
            if sv in SEV_C:
                t.setStyle(TableStyle([
                    ("BACKGROUND", (sev_col, i + 1), (sev_col, i + 1), H(SEV_BG.get(sv, C["bg"]))),
                    ("TEXTCOLOR", (sev_col, i + 1), (sev_col, i + 1), H(SEV_C[sv])),
                    ("FONTNAME", (sev_col, i + 1), (sev_col, i + 1), "Helvetica-Bold"),
                ]))
    return t


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(H(C["pri"]))
    canvas.setLineWidth(0.4)
    canvas.line(M, 22, PW - M, 22)
    canvas.setFont("Helvetica", 6)
    canvas.setFillColor(H(C["mut"]))
    canvas.drawString(M, 10, f"CloudSentinel Enterprise · Confidential · {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    canvas.drawRightString(PW - M, 10, f"Page {doc.page}")
    canvas.restoreState()


def _findings(data):
    F = []
    iam = data.get("iam_summary") or {}
    pub = data.get("public_summary") or {}
    if not iam.get("AccountMFAEnabled"):
        F.append(("CRITICAL", "Root account MFA not enabled", "Enable MFA via AWS Console → IAM"))
    if iam.get("AccountAccessKeysPresent"):
        F.append(("CRITICAL", "Root has active access keys", "Delete root keys, use IAM users"))
    if pub.get("rds", 0) > 0:
        F.append(("HIGH", f"{pub['rds']} public RDS instance(s)", "Disable public access on RDS"))
    osg = data.get("open_security_groups", data.get("open_sgs", 0))
    if osg > 0:
        F.append(("HIGH", f"{osg} SG(s) open to 0.0.0.0/0", "Restrict to specific CIDRs"))
    pips = data.get("public_ips") or []
    if pips:
        F.append(("MEDIUM", f"{len(pips)} instance(s) with public IPs", "Use private subnets + NAT"))
    nomfa = data.get("iam_users_no_mfa", 0)
    if nomfa > 0:
        F.append(("MEDIUM", f"{nomfa} IAM user(s) without MFA", "Enforce MFA via IAM policy"))
    return F or [("INFO", "No major issues", "")]


# ═════════════════════════════════════════════════════════════════
#  DASHBOARD PDF
# ═════════════════════════════════════════════════════════════════
def generate_dashboard_pdf(data, account, provider):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=12 * mm, bottomMargin=14 * mm)
    ss = _ss()
    el = []

    # ── Header ──
    el.append(_bar())
    el.append(Spacer(1, 6))
    el.append(Paragraph("CloudSentinel", ss["T1"]))
    el.append(Paragraph("Security Dashboard Report", ss["T2"]))
    el.append(Spacer(1, 5))

    prov = PROV.get(provider, provider)
    now = datetime.now().strftime("%b %d, %Y · %H:%M UTC")
    info = Table([[
        Paragraph(f'<font size="6" color="{C["mut"]}">Account</font><br/><b>{account}</b>', ss["Bd"]),
        Paragraph(f'<font size="6" color="{C["mut"]}">Provider</font><br/><b>{prov}</b>', ss["Bd"]),
        Paragraph(f'<font size="6" color="{C["mut"]}">Generated</font><br/><b>{now}</b>', ss["Bd"]),
    ]], colWidths=[UW / 3] * 3)
    info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), H(C["bg"])), ("BOX", (0, 0), (-1, -1), 0.3, H(C["bdr"])),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("LINEAFTER", (0, 0), (1, 0), 0.3, H(C["bdr"])),
    ]))
    el.append(info)
    el.append(Spacer(1, 8))

    # ── KPIs ──
    score = data.get("security_score", 0)
    totals = data.get("totals", {})
    tres = sum(v for v in totals.values() if isinstance(v, int))
    reg = data.get("regions_scanned", 0)
    pips = data.get("public_ips") or []
    osg = data.get("open_security_groups", data.get("open_sgs", 0))
    iam_s = data.get("iam_summary") or {}

    kpi = Table([[_ring(score), _kpi(tres, "Resources", C["acc"]), _kpi(reg, "Regions", C["pri"]),
                  _kpi(len(pips), "Public IPs", C["yel"]), _kpi(osg, "Open SGs", C["red"]),
                  _kpi(iam_s.get("Users", 0), "IAM Users", C["blu"])
                  ]], colWidths=[70, 65, 65, 65, 65, 65])
    kpi.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    el.append(kpi)
    el.append(Spacer(1, 8))

    # ── Risk + Findings summary ──
    findings = _findings(data)
    sev = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        if f[0] in sev: sev[f[0]] += 1
    risk = "CRITICAL" if sev["CRITICAL"] else "HIGH" if sev["HIGH"] else "MEDIUM" if sev["MEDIUM"] else "LOW"
    rc = {"CRITICAL": C["red"], "HIGH": C["org"], "MEDIUM": C["yel"], "LOW": C["grn"]}

    risk_t = Table([[
        Paragraph(f'<font size="6" color="{C["mut"]}">Risk Level</font><br/><font size="11" color="{rc[risk]}"><b>{risk}</b></font>', ss["Bd"]),
        Paragraph(f'<font size="6" color="{C["mut"]}">Findings</font><br/>'
                  f'<font color="{C["red"]}"><b>{sev["CRITICAL"]}</b></font> Crit · '
                  f'<font color="{C["org"]}"><b>{sev["HIGH"]}</b></font> High · '
                  f'<font color="{C["yel"]}"><b>{sev["MEDIUM"]}</b></font> Med · '
                  f'<font color="#EAB308"><b>{sev["LOW"]}</b></font> Low', ss["Bd"]),
    ]], colWidths=[UW * 0.3, UW * 0.7])
    risk_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), H(C["bg"])), ("BOX", (0, 0), (-1, -1), 0.3, H(C["bdr"])),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("LINEAFTER", (0, 0), (0, 0), 0.3, H(C["bdr"])),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    el.append(risk_t)
    el.append(Spacer(1, 6))

    # ── Resource Inventory (compact) ──
    sec = _sec("Resource Inventory", f"{tres} resources across {reg} regions")
    res = [[RES_NAME.get(k, k), str(v)] for k, v in totals.items() if v]
    if res:
        mid = (len(res) + 1) // 2
        L, R = res[:mid], res[mid:]
        while len(R) < len(L): R.append(["", ""])
        rows = [[L[i][0], L[i][1], R[i][0], R[i][1]] for i in range(len(L))]
        t = _tbl(["Resource", "Count", "Resource", "Count"], rows,
                 [UW * 0.30, UW * 0.12, UW * 0.30, UW * 0.12])
        t.setStyle(TableStyle([("LINEAFTER", (1, 0), (1, -1), 0.3, H(C["bdr"]))]))
        el.append(KeepTogether(sec + [t]))
    el.append(Spacer(1, 4))

    # ── Security Findings ──
    sec2 = _sec("Security Findings", f"{len(findings)} finding(s) — prioritized by severity")
    rows = [[sv, txt, rem] for sv, txt, rem in findings]
    t2 = _tbl(["Severity", "Finding", "Remediation"], rows,
              [UW * 0.11, UW * 0.42, UW * 0.42], sev_col=0)
    el.append(KeepTogether(sec2 + [t2]))
    el.append(Spacer(1, 4))

    # ── Region Matrix (compact — only top regions) ──
    rm = data.get("region_matrix") or {}
    active = {k: v for k, v in rm.items() if sum(v.values()) > 0}
    if active:
        # Show top 10 + summary of rest
        sorted_regions = sorted(active.items(), key=lambda x: sum(x[1].values()), reverse=True)
        types = sorted(set(t for d in active.values() for t in d.keys()))
        short = {"instances": "EC2", "security_groups": "SGs", "vpcs": "VPC", "subnets": "Sub",
                 "lambdas": "λ", "rds": "RDS", "elbs": "ELB", "snapshots": "Snap"}
        hdrs = ["Region"] + [short.get(t, t[:4]) for t in types] + ["Total"]
        rows = []
        for reg, counts in sorted_regions[:12]:
            tot = sum(counts.values())
            rows.append([reg] + [str(counts.get(t, 0)) if counts.get(t) else "·" for t in types] + [str(tot)])
        if len(sorted_regions) > 12:
            rest = len(sorted_regions) - 12
            rows.append([f"+ {rest} more regions", "", "", "", "", "", "", "", ""])

        nc = len(hdrs)
        cw = [UW * 0.18] + [UW * 0.72 / (nc - 2)] * (nc - 2) + [UW * 0.10]
        sec3 = _sec("Region Matrix", f"{len(active)} active regions out of {len(rm)} scanned")
        t3 = _tbl(hdrs, rows, cw)
        # Bold top regions
        for i, (_, counts) in enumerate(sorted_regions[:12]):
            if sum(counts.values()) > 10:
                t3.setStyle(TableStyle([
                    ("FONTNAME", (0, i + 1), (0, i + 1), "Helvetica-Bold"),
                    ("BACKGROUND", (-1, i + 1), (-1, i + 1), H("#EEF2FF")),
                    ("FONTNAME", (-1, i + 1), (-1, i + 1), "Helvetica-Bold"),
                ]))
        el.append(KeepTogether(sec3 + [t3]))
        el.append(Spacer(1, 4))

    # ── Public Exposure ──
    public_ips = data.get("public_ips") or []
    if public_ips:
        sec4 = _sec(f"Public Exposure ({len(public_ips)} resources)", "Accessible from the internet")
        rows = [[ip.get("ip", "")[:35], ip.get("name", ""), ip.get("type", ""),
                 ip.get("instance_type", ""), ip.get("state", ""), ip.get("region", "")]
                for ip in public_ips]
        t4 = _tbl(["IP / DNS", "Name", "Type", "Instance", "State", "Region"], rows,
                  [UW * 0.28, UW * 0.16, UW * 0.08, UW * 0.16, UW * 0.12, UW * 0.14])
        # Color state column
        for i, ip in enumerate(public_ips):
            state = ip.get("state", "")
            if state == "running":
                t4.setStyle(TableStyle([("TEXTCOLOR", (4, i + 1), (4, i + 1), H(C["grn"]))]))
        el.append(KeepTogether(sec4 + [t4]))
        el.append(Spacer(1, 4))

    # ── IAM Users ──
    iam_users = data.get("iam_users") or []
    if iam_users:
        mfa_on = sum(1 for u in iam_users if u.get("has_mfa"))
        mfa_off = len(iam_users) - mfa_on
        sec5 = _sec(f"IAM Users ({len(iam_users)})",
                    f"MFA: {mfa_on} enabled, {mfa_off} disabled · {iam_s.get('Roles', 0)} roles · {iam_s.get('Groups', 0)} groups")
        rows = []
        for u in iam_users:
            mfa = "✓" if u.get("has_mfa") else "✗"
            groups = ", ".join(u.get("groups", [])) if u.get("groups") else "-"
            if len(groups) > 35:
                groups = groups[:32] + "..."
            rows.append([u.get("name", ""), mfa, str(u.get("policies_count", 0)), groups, u.get("created", "")[:10]])
        t5 = _tbl(["Username", "MFA", "Pol", "Groups", "Created"], rows,
                  [UW * 0.22, UW * 0.06, UW * 0.06, UW * 0.42, UW * 0.14])
        # Color MFA column
        for i, u in enumerate(iam_users):
            if u.get("has_mfa"):
                t5.setStyle(TableStyle([("TEXTCOLOR", (1, i + 1), (1, i + 1), H(C["grn"])),
                                        ("FONTNAME", (1, i + 1), (1, i + 1), "Helvetica-Bold")]))
            else:
                t5.setStyle(TableStyle([("TEXTCOLOR", (1, i + 1), (1, i + 1), H(C["red"])),
                                        ("FONTNAME", (1, i + 1), (1, i + 1), "Helvetica-Bold")]))
        el.extend(sec5)
        el.append(t5)

    # ── Footer disclaimer ──
    el.append(Spacer(1, 12))
    el.append(HRFlowable(width="100%", color=H(C["bdr"]), thickness=0.3))
    el.append(Paragraph(
        f'<font color="{C["mut"]}" size="5.5">CloudSentinel Enterprise · Confidential · '
        f'Data reflects infrastructure at time of scan · {datetime.now().strftime("%Y-%m-%d %H:%M UTC")}</font>', ss["Sm"]))

    doc.build(el, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()


# ═════════════════════════════════════════════════════════════════
#  AUDIT PDF
# ═════════════════════════════════════════════════════════════════
def generate_audit_pdf(audit_data, account, provider):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=12 * mm, bottomMargin=14 * mm)
    ss = _ss()
    el = []

    el.append(_bar())
    el.append(Spacer(1, 6))
    el.append(Paragraph("CloudSentinel", ss["T1"]))
    el.append(Paragraph("Security Audit Report", ss["T2"]))
    el.append(Spacer(1, 5))

    prov = PROV.get(provider, provider)
    now = datetime.now().strftime("%b %d, %Y · %H:%M UTC")
    info = Table([[
        Paragraph(f'<font size="6" color="{C["mut"]}">Account</font><br/><b>{account}</b>', ss["Bd"]),
        Paragraph(f'<font size="6" color="{C["mut"]}">Provider</font><br/><b>{prov}</b>', ss["Bd"]),
        Paragraph(f'<font size="6" color="{C["mut"]}">Generated</font><br/><b>{now}</b>', ss["Bd"]),
    ]], colWidths=[UW / 3] * 3)
    info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), H(C["bg"])), ("BOX", (0, 0), (-1, -1), 0.3, H(C["bdr"])),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("LINEAFTER", (0, 0), (1, 0), 0.3, H(C["bdr"])),
    ]))
    el.append(info)
    el.append(Spacer(1, 8))

    total = audit_data.get("total", 0)
    summary = audit_data.get("summary", {})
    ascore = max(0, 100 - summary.get("CRITICAL", 0) * 10 - summary.get("HIGH", 0) * 3 - summary.get("MEDIUM", 0))

    kpi = Table([[_ring(ascore), _kpi(total, "Total", C["dark"]),
                  _kpi(summary.get("CRITICAL", 0), "Critical", C["red"]),
                  _kpi(summary.get("HIGH", 0), "High", C["org"]),
                  _kpi(summary.get("MEDIUM", 0), "Medium", C["yel"]),
                  _kpi(summary.get("LOW", 0), "Low", "#EAB308"),
                  ]], colWidths=[70, 65, 65, 65, 65, 65])
    kpi.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    el.append(kpi)
    el.append(Spacer(1, 6))

    findings = audit_data.get("findings") or []
    if findings:
        sec = _sec("Detailed Findings", f"{len(findings)} issues sorted by severity")
        rows = [[f.get("severity", ""), (f.get("title", "") or "")[:55],
                 f.get("region", "-"), (f.get("resource", "-") or "-")[:25],
                 (f.get("description", f.get("issue", "")) or "")[:50]]
                for f in findings]
        t = _tbl(["Sev", "Title", "Region", "Resource", "Description"], rows,
                 [UW * 0.09, UW * 0.27, UW * 0.11, UW * 0.19, UW * 0.28], sev_col=0)
        el.extend(sec)
        el.append(t)

    el.append(Spacer(1, 12))
    el.append(HRFlowable(width="100%", color=H(C["bdr"]), thickness=0.3))
    el.append(Paragraph(
        f'<font color="{C["mut"]}" size="5.5">CloudSentinel Enterprise · Confidential · '
        f'Manual review recommended for critical findings · {datetime.now().strftime("%Y-%m-%d %H:%M UTC")}</font>', ss["Sm"]))

    doc.build(el, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()


# ═════════════════════════════════════════════════════════════════
#  CSV
# ═════════════════════════════════════════════════════════════════
def generate_dashboard_csv(data, account, provider):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["CloudSentinel Dashboard Report"])
    w.writerow([f"Account: {account}", f"Provider: {provider}", f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"])
    w.writerow([])
    w.writerow(["Security Score", data.get("security_score", 0)])
    w.writerow([])
    w.writerow(["Resource", "Count"])
    for k, v in (data.get("totals") or {}).items():
        if v: w.writerow([RES_NAME.get(k, k), v])
    w.writerow([])
    w.writerow(["Severity", "Finding", "Remediation"])
    for sv, txt, rem in _findings(data):
        w.writerow([sv, txt, rem])
    w.writerow([])
    rm = data.get("region_matrix") or {}
    if rm:
        types = sorted(set(t for d in rm.values() for t in d.keys()))
        w.writerow(["Region"] + types + ["Total"])
        for reg, counts in sorted(rm.items(), key=lambda x: sum(x[1].values()), reverse=True):
            if sum(counts.values()) > 0:
                w.writerow([reg] + [counts.get(t, 0) for t in types] + [sum(counts.values())])
    w.writerow([])
    for ip in (data.get("public_ips") or []):
        w.writerow([ip.get("ip"), ip.get("name"), ip.get("type"), ip.get("instance_type"), ip.get("state"), ip.get("region")])
    w.writerow([])
    for u in (data.get("iam_users") or []):
        w.writerow([u.get("name"), "Yes" if u.get("has_mfa") else "No", u.get("policies_count", 0),
                    ", ".join(u.get("groups", [])) if u.get("groups") else "", u.get("created", "")])
    return buf.getvalue()


def generate_audit_csv(audit_data, account, provider):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["CloudSentinel Audit Report"])
    w.writerow([f"Account: {account}", f"Provider: {provider}", f"Total: {audit_data.get('total', 0)}",
                f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"])
    w.writerow([])
    for sv, cnt in (audit_data.get("summary") or {}).items():
        w.writerow([sv, cnt])
    w.writerow([])
    w.writerow(["Severity", "Title", "Region", "Resource", "Description"])
    for f in (audit_data.get("findings") or []):
        w.writerow([f.get("severity"), f.get("title"), f.get("region"), f.get("resource"),
                    f.get("description", f.get("issue", ""))])
    return buf.getvalue()
