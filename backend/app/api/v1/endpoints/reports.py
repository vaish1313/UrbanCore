"""Report generation endpoints for UrbanCore Land Intelligence."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
import datetime
from typing import Dict, Any, List

# ReportLab imports for professional PDF compilation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

# Matplotlib for generating map/site geometry visualization
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Reuse backend module API services directly
from app.api.v1.endpoints.aois import SEED_AOIS, get_aoi_comparison
from app.api.v1.endpoints.terrain import get_aoi_suitability, get_aoi_site_readiness
from app.api.v1.endpoints.violations import get_aoi_constraints
from app.api.v1.endpoints.detection import get_aoi_growth_history

router = APIRouter()


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to add headers and dynamic page counts (Page X of Y)."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count: int):
        self.saveState()
        # Top Header line
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284C7"))
        self.drawString(36, 756, "URBANCORE")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(95, 756, "·  LAND INTELLIGENCE REPORT")

        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, 748, 576, 748)

        # Bottom Footer line
        self.line(36, 45, 576, 45)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 32, "Confidential — UrbanCore Spatial Intelligence Workspace")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 32, page_text)
        self.restoreState()


def generate_map_visualization(aoi: Dict[str, Any], nearest_aois: List[Dict[str, Any]]) -> io.BytesIO:
    """Generate a geographic map visualization image buffer using Matplotlib."""
    fig, ax = plt.subplots(figsize=(6.5, 3.8), dpi=200)

    # Dark background styling to match UrbanCore theme
    fig.patch.set_facecolor("#0F172A")
    ax.set_facecolor("#0F172A")

    # Plot AOI polygon if available
    coords = aoi.get("geometry", {}).get("coordinates", [])
    if coords and len(coords) > 0:
        poly_coords = coords[0]
        lons = [pt[0] for pt in poly_coords]
        lats = [pt[1] for pt in poly_coords]

        # Selected AOI polygon
        ax.fill(lons, lats, color="#0284C7", alpha=0.35, label=f"Selected AOI: {aoi['name']}")
        ax.plot(lons, lats, color="#38BDF8", linewidth=2.5)
        ax.scatter([aoi["longitude"]], [aoi["latitude"]], color="#38BDF8", s=80, zorder=5)

    # Plot nearest neighbor AOI points
    if nearest_aois:
        n_lons = [n.get("longitude", 0.0) for n in nearest_aois if n.get("longitude")]
        n_lats = [n.get("latitude", 0.0) for n in nearest_aois if n.get("latitude")]
        if n_lons and n_lats:
            ax.scatter(n_lons, n_lats, color="#F59E0B", s=60, marker="^", label="Nearest Candidate AOIs", zorder=4)
            for n in nearest_aois:
                if n.get("longitude") and n.get("latitude"):
                    ax.annotate(
                        n["name"],
                        (n["longitude"], n["latitude"]),
                        textcoords="offset points",
                        xytext=(5, 5),
                        ha="left",
                        color="#CBD5E1",
                        fontsize=7,
                        fontweight="bold",
                    )

    ax.set_title(f"Spatial Vector Boundaries — {aoi['name']}", color="#F8FAFC", fontsize=10, fontweight="bold", pad=10)
    ax.set_xlabel("Longitude (°E)", color="#94A3B8", fontsize=8)
    ax.set_ylabel("Latitude (°N)", color="#94A3B8", fontsize=8)

    ax.tick_params(colors="#94A3B8", labelsize=7)
    for spine in ax.spines.values():
        spine.set_color("#334155")
        spine.set_linewidth(0.8)

    ax.grid(True, linestyle="--", alpha=0.25, color="#475569")
    ax.legend(loc="upper right", facecolor="#1E293B", edgecolor="#334155", labelcolor="#F8FAFC", fontsize=7)

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return buf


@router.get("/intelligence/{aoi_id}")
def generate_intelligence_report(aoi_id: str):
    """Generate dynamic Land Intelligence PDF report for selected AOI aggregating Modules 1–6."""
    # Module 1: Find AOI
    selected_aoi = None
    for item in SEED_AOIS:
        if item["id"].lower() == aoi_id.lower():
            selected_aoi = item
            break

    if not selected_aoi:
        raise HTTPException(status_code=404, detail=f"AOI with id '{aoi_id}' not found.")

    # Module 2: Land Suitability Data
    try:
        suitability_data = get_aoi_suitability(aoi_id)
    except Exception:
        suitability_data = {"suitability_score": "Data unavailable", "factors": []}

    # Module 3: Site Readiness Data
    try:
        readiness_data = get_aoi_site_readiness(aoi_id)
    except Exception:
        readiness_data = {}

    # Module 4: Constraints Data
    try:
        constraints_data = get_aoi_constraints(aoi_id)
    except Exception:
        constraints_data = {"constraints": [], "summary": {}}

    # Module 5: Construction History Data
    try:
        growth_data = get_aoi_growth_history(aoi_id)
    except Exception:
        growth_data = {"construction_history": []}

    # Module 6: Neighbourhood Comparison Data
    try:
        comparison_data = get_aoi_comparison(aoi_id)
    except Exception:
        comparison_data = {"selected_aoi": {}, "neighbors": [], "factual_observations": []}

    # Prepare PDF document buffer
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=48,
        bottomMargin=54,
    )

    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F172A"),
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )
    
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0284C7"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )

    bold_body_style = ParagraphStyle(
        "BoldBodyText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0F172A"),
    )

    small_muted = ParagraphStyle(
        "SmallMuted",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748B"),
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.white,
    )

    story = []

    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    report_id = f"UC-RPT-{selected_aoi['id'].upper()}-2026"

    # ==========================================
    # 1. REPORT HEADER & BANNER
    # ==========================================
    story.append(Paragraph("URBANCORE", ParagraphStyle("Brand", fontName="Helvetica-Bold", fontSize=11, leading=13, textColor=colors.HexColor("#0284C7"))))
    story.append(Spacer(1, 2))
    story.append(Paragraph("LAND INTELLIGENCE REPORT", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Comprehensive Geospatial & Feasibility Evaluation for <b>{selected_aoi['name']}</b>", subtitle_style))
    story.append(Spacer(1, 8))

    meta_table_data = [
        [
            Paragraph(f"<b>Selected Site:</b> {selected_aoi['name']}", body_style),
            Paragraph(f"<b>Generated:</b> {now_str}", body_style),
        ],
        [
            Paragraph(f"<b>Location:</b> {selected_aoi.get('location', 'Nashik, Maharashtra')}", body_style),
            Paragraph(f"<b>Report ID:</b> {report_id}", body_style),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # ==========================================
    # 2. SITE OVERVIEW
    # ==========================================
    story.append(Paragraph("1. SITE OVERVIEW", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    coords_str = f"{selected_aoi.get('latitude', 'Data unavailable')}° N, {selected_aoi.get('longitude', 'Data unavailable')}° E"
    area_str = f"{selected_aoi.get('area_ha', 28.5)} ha" if selected_aoi.get("area_ha") else "28.5 ha"

    overview_data = [
        [Paragraph("<b>Parameter</b>", table_header_style), Paragraph("<b>Site Attribute Value</b>", table_header_style)],
        [Paragraph("Site Name", bold_body_style), Paragraph(selected_aoi["name"], body_style)],
        [Paragraph("Location", bold_body_style), Paragraph(selected_aoi.get("location", "Nashik, Maharashtra"), body_style)],
        [Paragraph("Coordinates", bold_body_style), Paragraph(coords_str, body_style)],
        [Paragraph("AOI Identifier", bold_body_style), Paragraph(selected_aoi["id"], body_style)],
        [Paragraph("Zoning Category", bold_body_style), Paragraph(selected_aoi.get("category", "residential").title(), body_style)],
        [Paragraph("Evaluated Surface Area", bold_body_style), Paragraph(area_str, body_style)],
    ]
    overview_table = Table(overview_data, colWidths=[180, 360])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#0F172A")),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#FFFFFF")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 14))

    # ==========================================
    # 3. LAND SUITABILITY INDEX
    # ==========================================
    story.append(Paragraph("2. LAND SUITABILITY INDEX (MODULE 2)", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    overall_score = suitability_data.get("suitability_score", "Data unavailable")
    status_text = suitability_data.get("status", "EVALUATED")

    score_card_data = [
        [
            Paragraph(f"<font size=16 color='#0284C7'><b>{overall_score} / 100</b></font>", body_style),
            Paragraph(f"<b>Classification:</b> {status_text}<br/><font color='#64748B'>{suitability_data.get('summary', 'Evaluated based on terrain, access, water, environment, and development metrics.')}</font>", body_style)
        ]
    ]
    score_card = Table(score_card_data, colWidths=[140, 400])
    score_card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0F9FF")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#BAE6FD")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(score_card)
    story.append(Spacer(1, 8))

    factors = suitability_data.get("factors", [])
    if factors:
        factor_table_data = [[
            Paragraph("<b>Evaluation Factor</b>", table_header_style),
            Paragraph("<b>Score</b>", table_header_style),
            Paragraph("<b>Detailed Factor Analysis</b>", table_header_style)
        ]]
        for f in factors:
            factor_table_data.append([
                Paragraph(f.get("label", "Data unavailable"), bold_body_style),
                Paragraph(f"{f.get('score', 'N/A')}/100", bold_body_style),
                Paragraph(f.get("explanation", "Data unavailable"), body_style)
            ])
        factor_table = Table(factor_table_data, colWidths=[160, 60, 320])
        factor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(factor_table)
    else:
        story.append(Paragraph("Suitability factor breakdown: <i>Data unavailable</i>", small_muted))
    story.append(Spacer(1, 14))

    # ==========================================
    # 4. SITE READINESS ANALYSIS
    # ==========================================
    story.append(Paragraph("3. SITE READINESS ANALYSIS (MODULE 3)", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    if readiness_data:
        avg_slope = f"{readiness_data.get('average_slope', 'Data unavailable')}°"
        slope_range = f"{readiness_data.get('slope_min', 'N/A')}° – {readiness_data.get('slope_max', 'N/A')}°" if "slope_min" in readiness_data else "Data unavailable"
        avg_elev = f"{readiness_data.get('average_elevation', 'Data unavailable')} m MSL"
        elev_range = f"{readiness_data.get('min_elevation', 'N/A')} m – {readiness_data.get('max_elevation', 'N/A')} m MSL" if "min_elevation" in readiness_data else "Data unavailable"
        flat_pct = f"{readiness_data.get('flat_area_percentage', 'Data unavailable')}%"
        classification = readiness_data.get("terrain_classification", "Data unavailable")
        readiness_lvl = readiness_data.get("readiness_level", "Data unavailable")

        readiness_table_data = [
            [Paragraph("<b>Terrain Metric</b>", table_header_style), Paragraph("<b>Evaluated Value</b>", table_header_style), Paragraph("<b>Observed Range / Baseline</b>", table_header_style)],
            [Paragraph("Average Slope", bold_body_style), Paragraph(avg_slope, body_style), Paragraph(f"Slope Range: {slope_range}", body_style)],
            [Paragraph("Average Elevation", bold_body_style), Paragraph(avg_elev, body_style), Paragraph(f"Elevation Range: {elev_range}", body_style)],
            [Paragraph("Flat Area Percentage", bold_body_style), Paragraph(flat_pct, body_style), Paragraph("Slope <= 10.0° threshold", body_style)],
            [Paragraph("Terrain Roughness Category", bold_body_style), Paragraph(classification, body_style), Paragraph("DEM/SRTM contour classification", body_style)],
            [Paragraph("Site Readiness Level", bold_body_style), Paragraph(f"<b>{readiness_lvl}</b>", bold_body_style), Paragraph("Physical land preparation requirement", body_style)],
        ]
        readiness_table = Table(readiness_table_data, colWidths=[160, 160, 220])
        readiness_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(readiness_table)
    else:
        story.append(Paragraph("Site readiness terrain metrics: <i>Data unavailable</i>", small_muted))
    story.append(Spacer(1, 14))

    # ==========================================
    # 5. ZONING & ENVIRONMENTAL CONSTRAINTS
    # ==========================================
    story.append(Paragraph("4. ZONING & ENVIRONMENTAL CONSTRAINTS (MODULE 4)", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    c_list = constraints_data.get("constraints", [])
    if c_list:
        constraints_table_data = [[
            Paragraph("<b>Constraint Layer</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style),
            Paragraph("<b>Affected Area (ha)</b>", table_header_style),
            Paragraph("<b>Affected (%)</b>", table_header_style),
        ]]
        for c in c_list:
            c_name = c.get("name", "Data unavailable")
            c_status = c.get("status", "UNKNOWN")
            ha_val = f"{c.get('affected_area_ha')} ha" if c.get("affected_area_ha") is not None else "Data unavailable"
            pct_val = f"{c.get('affected_percentage')}%" if c.get("affected_percentage") is not None else "Data unavailable"

            status_color = "#059669" if c_status == "CLEAR" else "#DC2626" if c_status == "OVERLAP" else "#64748B"
            status_p = Paragraph(f"<font color='{status_color}'><b>{c_status}</b></font>", body_style)

            constraints_table_data.append([
                Paragraph(c_name, bold_body_style),
                status_p,
                Paragraph(ha_val, body_style),
                Paragraph(pct_val, body_style),
            ])
        constraints_table = Table(constraints_table_data, colWidths=[200, 100, 120, 120])
        constraints_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(constraints_table)

        # Screening Summary
        summary_meta = constraints_data.get("summary", {})
        if summary_meta:
            summary_str = f"<b>Screening Summary:</b> {summary_meta.get('layers_analyzed', 4)} layers analyzed · <font color='#059669'>{summary_meta.get('clear_layers', 0)} Clear</font> · <font color='#DC2626'>{summary_meta.get('overlapping_layers', 0)} Overlapping</font> · <font color='#64748B'>{summary_meta.get('data_unavailable_layers', 0)} Data Unavailable</font>"
            story.append(Spacer(1, 4))
            story.append(Paragraph(summary_str, small_muted))
    else:
        story.append(Paragraph("Zoning & environmental constraint layers: <i>Data unavailable</i>", small_muted))
    story.append(Spacer(1, 14))

    # ==========================================
    # 6. CONSTRUCTION HISTORY & MULTI-YEAR GROWTH
    # ==========================================
    story.append(Paragraph("5. CONSTRUCTION HISTORY & MULTI-YEAR GROWTH (MODULE 5)", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    c_history = growth_data.get("construction_history", [])
    if c_history:
        period_str = growth_data.get("analysis_period", "2021 – 2025")
        first_ha = f"{growth_data.get('first_year_area_ha', 'N/A')} ha"
        latest_ha = f"{growth_data.get('latest_year_area_ha', 'N/A')} ha"
        tot_change = f"+{growth_data.get('total_change_percent', 'N/A')}%"
        largest_inc = growth_data.get("largest_increase", "Data unavailable")

        growth_meta_p = Paragraph(
            f"<b>Analysis Period:</b> {period_str} &nbsp;|&nbsp; <b>Initial Built-up:</b> {first_ha} &nbsp;|&nbsp; <b>Latest Built-up:</b> {latest_ha} &nbsp;|&nbsp; <b>Total Growth:</b> {tot_change}<br/>"
            f"<b>Largest Historical Increase:</b> {largest_inc}",
            body_style
        )
        story.append(growth_meta_p)
        story.append(Spacer(1, 6))

        history_table_data = [[
            Paragraph("<b>Year</b>", table_header_style),
            Paragraph("<b>Structures Detected</b>", table_header_style),
            Paragraph("<b>Built-up Area (ha)</b>", table_header_style),
            Paragraph("<b>YoY Growth (%)</b>", table_header_style),
        ]]
        for item in c_history:
            history_table_data.append([
                Paragraph(str(item.get("year", "N/A")), bold_body_style),
                Paragraph(str(item.get("buildingsCount", item.get("buildings_count", "N/A"))), body_style),
                Paragraph(f"{item.get('builtUpAreaHa', item.get('built_up_area_ha', 'N/A'))} ha", body_style),
                Paragraph(f"+{item.get('builtUpChangePercent', item.get('built_up_change_percent', 0))}%", body_style),
            ])
        history_table = Table(history_table_data, colWidths=[100, 140, 150, 150])
        history_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(history_table)
    else:
        story.append(Paragraph("Multi-year construction history: <i>Data unavailable</i>", small_muted))
    story.append(Spacer(1, 14))

    # ==========================================
    # 7. NEIGHBOURHOOD COMPARISON
    # ==========================================
    story.append(Paragraph("6. NEIGHBOURHOOD COMPARISON MATRIX (MODULE 6)", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    comp_sel = comparison_data.get("selected_aoi", {})
    comp_nearest = comparison_data.get("neighbors") or comparison_data.get("nearest_aois") or []
    all_comp_sites = []
    if comp_sel and "name" in comp_sel:
        all_comp_sites.append(comp_sel)
    all_comp_sites.extend(comp_nearest)

    if all_comp_sites:
        comp_table_data = [[
            Paragraph("<b>AOI Site Name</b>", table_header_style),
            Paragraph("<b>Distance</b>", table_header_style),
            Paragraph("<b>Suitability</b>", table_header_style),
            Paragraph("<b>Flood Zone</b>", table_header_style),
            Paragraph("<b>Growth (5Y)</b>", table_header_style),
            Paragraph("<b>Avg Slope</b>", table_header_style),
        ]]
        for s in all_comp_sites:
            is_sel = s.get("is_selected", False) or s.get("id") == selected_aoi["id"]
            site_name = f"<b>{s.get('name', 'N/A')}</b> (Selected)" if is_sel else s.get("name", "N/A")
            dist_str = "0.0 km" if is_sel else f"{s.get('distance_km', 'N/A')} km"
            flood_pct = s.get("flood_zone_percentage", s.get("flood_zone_percent", "N/A"))
            growth_pct = s.get("construction_growth_percentage", s.get("construction_growth_percent", "N/A"))
            slope_deg = s.get("average_slope", s.get("avg_slope", "N/A"))

            comp_table_data.append([
                Paragraph(site_name, bold_body_style if is_sel else body_style),
                Paragraph(dist_str, body_style),
                Paragraph(f"{s.get('suitability_score', 'N/A')}/100", body_style),
                Paragraph(f"{flood_pct}%", body_style),
                Paragraph(f"+{growth_pct}%", body_style),
                Paragraph(f"{slope_deg}°", body_style),
            ])
        comp_table = Table(comp_table_data, colWidths=[140, 80, 80, 80, 80, 80])
        comp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(comp_table)

        # Observations
        obs_list = comparison_data.get("factual_observations") or comparison_data.get("observations") or []
        if obs_list:
            story.append(Spacer(1, 4))
            story.append(Paragraph("<b>Comparison Observations:</b>", body_style))
            for obs in obs_list:
                story.append(Paragraph(f"• {obs}", small_muted))
    else:
        story.append(Paragraph("Neighbourhood comparison data: <i>Data unavailable</i>", small_muted))
    story.append(Spacer(1, 14))

    # ==========================================
    # 8. MAP / SITE VISUALIZATION
    # ==========================================
    story.append(Paragraph("7. MAP & SITE VISUALIZATION", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=8))

    try:
        map_buf = generate_map_visualization(selected_aoi, comp_nearest)
        map_img = Image(map_buf, width=540, height=315)
        story.append(map_img)
    except Exception as e:
        story.append(Paragraph(f"Map visualization unavailable ({str(e)})", small_muted))

    story.append(Spacer(1, 14))

    # ==========================================
    # 9. DATA SOURCES
    # ==========================================
    story.append(Paragraph("8. DATA SOURCES & METHODOLOGY", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=6))

    sources_p = Paragraph(
        "• <b>Sentinel-1 SAR</b> — C-Band Synthetic Aperture Radar historical built-up surface backscatter.<br/>"
        "• <b>Sentinel-2 Optical</b> — Multi-Spectral Instrument 10m spatial resolution vegetation & land cover.<br/>"
        "• <b>SRTM / DEM</b> — 30m Digital Elevation Model for slope, contour, and terrain roughness processing.<br/>"
        "• <b>PostGIS Vector Layers</b> — Spatial indexing for municipal boundary, zoning, and river buffers.<br/>"
        "• <b>River Buffer GIS Layer</b> — 100m Godavari tributary statutory setback & 25-year flood return blue line.<br/>"
        "• <b>Forest GIS Layer</b> — State Maharashtra Forest Department reserve boundary vectors.<br/>"
        "• <b>Green Belt GIS Layer</b> — Zonal Nashik DP masterplan agricultural greenbelt protection polygon.",
        small_muted
    )
    story.append(sources_p)
    story.append(Spacer(1, 14))

    # ==========================================
    # 10. DISCLAIMER
    # ==========================================
    story.append(Paragraph("9. STATUTORY DISCLAIMER", heading_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0284C7"), spaceAfter=6))

    disclaimer_text = (
        "Spatial screening based on available GIS layers. This report does not constitute legal, zoning, "
        "environmental, financial, or construction approval. Verify applicable regulations, permissions, "
        "engineering requirements, and other applicable conditions with the relevant authorities and "
        "qualified professionals before development."
    )
    disclaimer_box = Table(
        [[Paragraph(disclaimer_text, ParagraphStyle("DiscStyle", parent=small_muted, textColor=colors.HexColor("#475569")))]],
        colWidths=[540]
    )
    disclaimer_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#FCA5A5")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(disclaimer_box)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_buffer.seek(0)

    filename = f"Land_Intelligence_Report_{selected_aoi['id']}.pdf"
    headers = {
        "Content-Disposition": f"attachment; filename={filename}",
        "Access-Control-Expose-Headers": "Content-Disposition",
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
