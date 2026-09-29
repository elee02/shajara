"use client";

import React, { useState } from "react";
import { Person, UZBEK_GENERATIONS } from "@/lib/types";
import { X, FileDown, Printer, CheckCircle, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  people,
}) => {
  const [paperSize, setPaperSize] = useState<"a4" | "a3" | "a2" | "a1">("a3");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [treeTitle, setTreeTitle] = useState("Oila Shajarasi (Yetti Pusht)");
  const [subTitle, setSubTitle] = useState("Avlodlar va ajdodlar nasabnomasi");
  const [includeBio, setIncludeBio] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    try {
      setIsExporting(true);
      setSuccessMsg(null);

      // Target the printable element
      const targetElement = document.getElementById("tree-diagram-export-target");
      if (!targetElement) {
        throw new Error("Shajara daraxti topilmadi");
      }

      // Temporarily prepare styles for clean capture
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // Dimensions mapping in mm
      const dimensions = {
        a4: { w: 297, h: 210 },
        a3: { w: 420, h: 297 },
        a2: { w: 594, h: 420 },
        a1: { w: 841, h: 594 },
      };

      const dim = dimensions[paperSize];
      const pdfWidth = orientation === "landscape" ? Math.max(dim.w, dim.h) : Math.min(dim.w, dim.h);
      const pdfHeight = orientation === "landscape" ? Math.min(dim.w, dim.h) : Math.max(dim.w, dim.h);

      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: paperSize,
      });

      // Header on PDF
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59);
      pdf.text(treeTitle, pdfWidth / 2, 18, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${subTitle} • ${people.length} a'zo`, pdfWidth / 2, 26, { align: "center" });

      // Draw ornamental separator line
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.8);
      pdf.line(pdfWidth / 2 - 60, 30, pdfWidth / 2 + 60, 30);

      // Calculate image scale to fit page margins
      const margin = 15;
      const topOffset = 36;
      const availWidth = pdfWidth - margin * 2;
      const availHeight = pdfHeight - topOffset - margin;

      const imgRatio = canvas.width / canvas.height;
      const pageRatio = availWidth / availHeight;

      let finalWidth = availWidth;
      let finalHeight = availWidth / imgRatio;

      if (finalHeight > availHeight) {
        finalHeight = availHeight;
        finalWidth = availHeight * imgRatio;
      }

      const xPos = margin + (availWidth - finalWidth) / 2;
      const yPos = topOffset + (availHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", xPos, yPos, finalWidth, finalHeight);

      // Footer
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Shajara (Yetti Pusht) tizimi orqali tayyorlandi • ${new Date().toLocaleDateString("uz-UZ")}`,
        pdfWidth / 2,
        pdfHeight - 6,
        { align: "center" }
      );

      pdf.save(`Shajara_${paperSize.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setSuccessMsg("PDF muvaffaqiyatli yuklab olindi!");
    } catch (err: unknown) {
      console.error("PDF generation error:", err);
      alert("PDF yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki brauzerdan to'g'ridan-to'g'ri chop eting.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>
              Shajarani PDF / Chop etish
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Devorga osish yoki oilaviy arxiv uchun printable formatda eksport qiling
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
            <X size={18} />
          </button>
        </div>

        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "var(--radius-md)",
              color: "#34d399",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Paper Size Selector */}
        <div className="form-group">
          <label className="form-label">Qog&apos;oz o&apos;lchami (Format)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { id: "a4", label: "A4 (210 × 297 mm)", desc: "Kitob yoki papka uchun" },
              { id: "a3", label: "A3 (297 × 420 mm)", desc: "Katta plakat / Standart" },
              { id: "a2", label: "A2 (420 × 594 mm)", desc: "Devoriy shajara posteri" },
              { id: "a1", label: "A1 (594 × 841 mm)", desc: "Katta formatli devoriy doska" },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setPaperSize(item.id as "a4" | "a3" | "a2" | "a1")}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${paperSize === item.id ? "var(--gold-500)" : "var(--border-subtle)"}`,
                  background: paperSize === item.id ? "rgba(212, 175, 55, 0.1)" : "var(--bg-tertiary)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "14px", color: paperSize === item.id ? "var(--text-gold)" : "var(--text-primary)" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orientation Selector */}
        <div className="form-group">
          <label className="form-label">Yo&apos;nalish (Orientatsiya)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className="btn"
              style={{
                background: orientation === "landscape" ? "var(--bg-tertiary)" : "transparent",
                border: `1px solid ${orientation === "landscape" ? "var(--gold-500)" : "var(--border-subtle)"}`,
                color: orientation === "landscape" ? "var(--text-gold)" : "var(--text-muted)",
              }}
            >
              Gorizontal (Albom)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className="btn"
              style={{
                background: orientation === "portrait" ? "var(--bg-tertiary)" : "transparent",
                border: `1px solid ${orientation === "portrait" ? "var(--gold-500)" : "var(--border-subtle)"}`,
                color: orientation === "portrait" ? "var(--text-gold)" : "var(--text-muted)",
              }}
            >
              Vertikal (Kitobiy)
            </button>
          </div>
        </div>

        {/* Title Customization */}
        <div className="form-group">
          <label className="form-label">Plakat sarlavhasi</label>
          <input
            type="text"
            className="form-input"
            value={treeTitle}
            onChange={(e) => setTreeTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Qo&apos;shimcha matn / Shior</label>
          <input
            type="text"
            className="form-input"
            value={subTitle}
            onChange={(e) => setSubTitle(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <Printer size={16} />
            <span>To&apos;g&apos;ridan-to&apos;g&apos;ri chop etish</span>
          </button>

          <button
            id="btn-download-pdf-confirm"
            type="button"
            onClick={handleGeneratePdf}
            disabled={isExporting}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <FileDown size={16} />
            <span>{isExporting ? "Yuklanmoqda..." : "PDF Yuklab olish"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
