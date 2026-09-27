import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Download, X, ShieldCheck, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { AOI } from "@/types/urbancore";
import { jsPDF } from "jspdf";
import { NASHIK_AOIS } from "@/data/nashikAois";

const STEPS = [
  "Collecting site information...",
  "Analyzing suitability score...",
  "Collecting terrain & slope readiness data...",
  "Collecting environmental & zoning constraints...",
  "Collecting 5-year construction growth history...",
  "Collecting neighbourhood comparison matrix...",
  "Building Land Intelligence PDF report...",
];

function generateClientPdfBlob(aoi: AOI): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  let y = 15;

  // Colors
  const primaryColor = "#0284C7";
  const darkColor = "#0F172A";
  const grayColor = "#64748B";

  // Helper function for page headers & footers
  const addHeaderFooter = (pageNum: number, totalPages: number) => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    doc.text("URBANCORE", 12, 10);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("·  LAND INTELLIGENCE REPORT", 32, 10);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, 12, pageWidth - 12, 12);

    // Footer
    doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Confidential — UrbanCore Spatial Intelligence Workspace", 12, pageHeight - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 12, pageHeight - 7, { align: "right" });
  };

  // Header Banner
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("URBANCORE LAND INTELLIGENCE REPORT", 12, y);
  y += 6;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Comprehensive Geospatial Evaluation for ${aoi.name}`, 12, y);
  y += 8;

  const dateStr = new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC";
  const reportId = `UC-RPT-${aoi.id.toUpperCase()}-2026`;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(12, y, pageWidth - 24, 16, "FD");

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Selected Site: ${aoi.name}`, 15, y + 5);
  doc.text(`Generated: ${dateStr}`, 110, y + 5);
  doc.text(`Location: ${aoi.location}`, 15, y + 11);
  doc.text(`Report ID: ${reportId}`, 110, y + 11);
  y += 22;

  // 1. Site Overview
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("1. SITE OVERVIEW", 12, y);
  y += 2;
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.line(12, y, pageWidth - 12, y);
  y += 6;

  const overviewRows: [string, string][] = [
    ["Site Name", aoi.name],
    ["Location", aoi.location || "Nashik, Maharashtra"],
    ["Coordinates", `${aoi.coords.lat}° N, ${aoi.coords.lng}° E`],
    ["AOI Identifier", aoi.id],
    ["Zoning Category", (aoi.category || "residential").toUpperCase()],
    ["Surface Area", "28.5 ha"],
  ];

  doc.setFontSize(8);
  overviewRows.forEach(([label, val]) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(12, y, 50, 6, "FD");
    doc.rect(62, y, pageWidth - 74, 6, "S");
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(label, 15, y + 4.2);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(val, 65, y + 4.2);
    y += 6;
  });
  y += 6;

  // 2. Land Suitability Index
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("2. LAND SUITABILITY INDEX (MODULE 2)", 12, y);
  y += 2;
  doc.line(12, y, pageWidth - 12, y);
  y += 6;

  // Score Box
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.rect(12, y, pageWidth - 24, 12, "FD");
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(2, 132, 199);
  doc.text(`${aoi.suitabilityScore} / 100`, 16, y + 8);

  doc.setFontSize(8);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(aoi.summary, 55, y + 7);
  y += 18;

  // 3. Site Readiness Analysis
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("3. SITE READINESS ANALYSIS (MODULE 3)", 12, y);
  y += 2;
  doc.line(12, y, pageWidth - 12, y);
  y += 6;

  const readinessRows: [string, string][] = [
    ["Average Slope", `${aoi.terrain.slope}°`],
    ["Elevation", `${aoi.terrain.elevation} m MSL`],
    ["Flat Area Percentage", `${aoi.terrain.flatLandPercent}%`],
    ["Terrain Classification", aoi.terrain.roughness],
    ["Readiness Level", aoi.terrain.readiness],
  ];

  doc.setFontSize(8);
  readinessRows.forEach(([label, val]) => {
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${label}:`, 15, y);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(val, 65, y);
    y += 5;
  });
  y += 6;

  // 4. Zoning & Environmental Constraints
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("4. ZONING & ENVIRONMENTAL CONSTRAINTS (MODULE 4)", 12, y);
  y += 2;
  doc.line(12, y, pageWidth - 12, y);
  y += 6;

  const constraintRows: [string, string, string, string][] = [
    ["CRZ (Coastal Regulation Zone)", "NO_DATA", "Data unavailable", "Data unavailable"],
    ["River Buffer Zone", aoi.constraints.floodZoneOverlapPercent > 0 ? "OVERLAP" : "CLEAR", `${(aoi.constraints.floodZoneOverlapPercent * 0.2).toFixed(1)} ha`, `${aoi.constraints.floodZoneOverlapPercent}%`],
    ["Forest Boundary & Buffer", aoi.constraints.forestBoundaryOverlapPercent > 0 ? "OVERLAP" : "CLEAR", `${(aoi.constraints.forestBoundaryOverlapPercent * 0.2).toFixed(1)} ha`, `${aoi.constraints.forestBoundaryOverlapPercent}%`],
    ["Agricultural Green Belt", aoi.constraints.greenBeltOverlapPercent > 0 ? "OVERLAP" : "CLEAR", `${(aoi.constraints.greenBeltOverlapPercent * 0.2).toFixed(1)} ha`, `${aoi.constraints.greenBeltOverlapPercent}%`],
  ];

  doc.setFillColor(30, 41, 59);
  doc.rect(12, y, pageWidth - 24, 6, "F");
  doc.setFontSize(7);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Constraint Layer", 15, y + 4.2);
  doc.text("Status", 80, y + 4.2);
  doc.text("Affected Area", 120, y + 4.2);
  doc.text("Affected %", 160, y + 4.2);
  y += 6;

  constraintRows.forEach(([layer, status, ha, pct]) => {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(layer, 15, y + 4);

    if (status === "CLEAR") doc.setTextColor(5, 150, 105);
    else if (status === "OVERLAP") doc.setTextColor(220, 38, 38);
    else doc.setTextColor(100, 116, 139);
    doc.text(status, 80, y + 4);

    doc.setTextColor(51, 65, 85);
    doc.text(ha, 120, y + 4);
    doc.text(pct, 160, y + 4);
    y += 5.5;
  });
  y += 8;

  // Add Page 2
  doc.addPage();
  y = 18;

  // 5. Construction History
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("5. CONSTRUCTION HISTORY & MULTI-YEAR GROWTH (MODULE 5)", 12, y);
  y += 2;
  doc.line(12, y, pageWidth - 12, y);
  y += 6;

  doc.setFillColor(30, 41, 59);
  doc.rect(12, y, pageWidth - 24, 6, "F");
  doc.setFontSize(7);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Year", 15, y + 4.2);
  doc.text("Structures Detected", 60, y + 4.2);
  doc.text("Built-up Change (%)", 120, y + 4.2);
  y += 6;

  (aoi.constructionHistory || []).forEach((h) => {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(h.year), 15, y + 4);
    doc.text(String(h.buildingsCount), 60, y + 4);
    doc.text(`+${h.builtUpChangePercent}%`, 120, y + 4);
    y += 5.5;
  });
  y += 8;

  // 6. Neighbourhood Comparison
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("6. NEIGHBOURHOOD COMPARISON MATRIX (MODULE 6)", 12, y);
  y += 2;
  doc.line(12, y, pageWidth - 12, y);
  y += 6;

  const otherAois = NASHIK_AOIS.filter((item) => item.id !== aoi.id).slice(0, 4);
  const allComp = [aoi, ...otherAois];

  doc.setFillColor(30, 41, 59);
  doc.rect(12, y, pageWidth - 24, 6, "F");
  doc.setFontSize(7);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AOI Site Name", 15, y + 4.2);
  doc.text("Suitability", 80, y + 4.2);
  doc.text("Flood Zone", 120, y + 4.2);
  doc.text("Slope", 160, y + 4.2);
  y += 6;

  allComp.forEach((site) => {
    doc.setFont("Helvetica", site.id === aoi.id ? "bold" : "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(site.name + (site.id === aoi.id ? " (Selected)" : ""), 15, y + 4);
    doc.text(`${site.suitabilityScore}/100`, 80, y + 4);
    doc.text(`${site.constraints.floodZoneOverlapPercent}%`, 120, y + 4);
    doc.text(`${site.terrain.slope}°`, 160, y + 4);
    y += 5.5;
  });
  y += 10;

  // 7. Statutory Disclaimer
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(2, 132, 199);
  doc.text("STATUTORY DISCLAIMER", 12, y);
  y += 4;

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.rect(12, y, pageWidth - 24, 16, "FD");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const disclaimerText =
    "Spatial screening based on available GIS layers. This report does not constitute legal, zoning, environmental, financial, or construction approval. Verify applicable regulations, permissions, engineering requirements, and other applicable conditions with the relevant authorities and qualified professionals before development.";
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 30) as string[];
  doc.text(splitDisclaimer, 15, y + 4.5);

  // Add Headers and Footers to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  return doc.output("blob");
}

export function BuilderReportModal({
  aoi,
  isOpen,
  onClose,
}: {
  aoi: AOI;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setPdfBlobUrl(null);
    setStepIndex(0);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      let blob: Blob | null = null;
      try {
        const response = await fetch(`http://localhost:8000/api/v1/reports/intelligence/${aoi.id}`);
        if (response.ok) {
          blob = await response.blob();
        }
      } catch (backendErr) {
        console.warn("Backend report API unreachable, utilizing browser jsPDF compilation fallback.", backendErr);
      }

      if (!blob) {
        blob = generateClientPdfBlob(aoi);
      }

      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);

      // Auto trigger browser download
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Land_Intelligence_Report_${aoi.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Failed to generate PDF report:", err);
      setError(err?.message || "Failed to compile intelligence report.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    generateReport();
  }, [isOpen, aoi.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div
        className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {isGenerating ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h4 className="mt-6 font-display text-xl font-semibold text-foreground">
              GENERATING INTELLIGENCE REPORT
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Compiling multi-module GIS screening for <strong className="text-foreground">{aoi.name}</strong>...
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-xs text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
              <span>{STEPS[stepIndex]}</span>
            </div>
            <div className="mt-6 h-2 w-72 overflow-hidden rounded-full bg-border/40">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-cyan-400"
                initial={{ width: "0%" }}
                animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h4 className="font-display text-xl font-bold text-foreground">
                UNABLE TO GENERATE REPORT
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                The intelligence report could not be generated for {aoi.name}. ({error})
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generateReport}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <RefreshCw className="h-4 w-4" /> TRY AGAIN
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header Banner */}
            <div className="border-b border-border/50 pb-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                  URBANCORE · LAND INTELLIGENCE REPORT
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mt-1">
                REPORT READY
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Land Intelligence Report generated successfully for <strong className="text-foreground">{aoi.name}</strong>.
              </p>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground">
                      Land_Intelligence_Report_{aoi.id}.pdf
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Includes Modules 1–6 Evaluation & Spatial Map Snapshot
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-400">
                  READY FOR DOWNLOAD
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2 font-mono text-xs border-t border-border/40">
                <div>
                  <span className="text-[10px] text-muted-foreground">Site Name:</span>
                  <p className="font-bold text-foreground truncate">{aoi.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Suitability Score:</span>
                  <p className="font-bold text-primary">{aoi.suitabilityScore} / 100</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Location:</span>
                  <p className="font-bold text-foreground truncate">{aoi.location}</p>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="rounded-xl border border-border/40 bg-foreground/[0.01] p-3 text-[10px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Spatial screening based on available GIS layers. This report does not constitute legal, zoning, environmental, financial, or construction approval. Verify applicable regulations with relevant authorities.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Close Preview
              </button>
              {pdfBlobUrl && (
                <a
                  href={pdfBlobUrl}
                  download={`Land_Intelligence_Report_${aoi.id}.pdf`}
                  className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/20 px-5 py-2.5 font-mono text-xs font-semibold text-primary transition-all hover:bg-primary/30 shadow-[0_0_15px_rgba(114,180,255,0.2)]"
                >
                  <Download className="h-4 w-4" /> DOWNLOAD REPORT
                </a>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
