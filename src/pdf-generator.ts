import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, StudentScores } from "./types";
import { generateScores } from "./utils";

export function downloadPDF(student: Student) {
  const fileUrl = student["FILE PDF"]?.trim();
  if (fileUrl && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
    let previewUrl = fileUrl;
    try {
      // Convert direct Google Drive export/download URLs to clean interactive preview URLs
      const parsedUrl = new URL(fileUrl);
      if (parsedUrl.hostname.includes("google.com")) {
        let driveId = parsedUrl.searchParams.get("id");
        if (!driveId) {
          const match = fileUrl.match(/[?&]id=([^&]+)/);
          if (match && match[1]) {
            driveId = match[1];
          }
        }
        if (driveId) {
          previewUrl = `https://drive.google.com/file/d/${driveId}/view`;
        }
      }
    } catch (e) {
      const match = fileUrl.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        previewUrl = `https://drive.google.com/file/d/${match[1]}/view`;
      }
    }
    window.open(previewUrl, "_blank");
    return;
  }

  const scores: StudentScores = generateScores(student);
  
  // Create PDF in portrait A4 size (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Color Definitions (Sophisticated Slate Theme)
  const PRIMARY_COLOR = [30, 41, 59]; // slate-800
  const SECONDARY_COLOR = [71, 85, 105]; // slate-600
  const ACCENT_COLOR = [180, 83, 9]; // amber-700
  const BG_COLOR = [248, 250, 252]; // slate-50

  // 1. Draw elegant double outer frame
  doc.setLineWidth(0.6);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(8, 8, 194, 281); // outer frame
  
  doc.setLineWidth(0.2);
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.rect(10, 10, 190, 277); // inner frame

  // 2. Headings & School Banner
  // Draw some subtle colored decorative triangles at the top corners for style
  doc.setFillColor(30, 41, 59);
  doc.triangle(10, 10, 25, 10, 10, 25, "F");
  
  doc.setFillColor(180, 83, 9);
  doc.triangle(200, 10, 185, 10, 200, 25, "F");

  // Center Headings
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("YAYASAN MAJLIS DIKDASMEN MUHAMMADIYAH SLEMAN", 105, 20, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("HASIL ASESMEN KOMPETENSI TKA & TKAD MUHIPA", 105, 26, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("SMA Muhammadiyah 1 Pati | Tegalsari,Pakembinangun,Pakem,Sleman", 105, 31, { align: "center" });

  // Draw separator line
  doc.setLineWidth(1.2);
  doc.setDrawColor(30, 41, 59);
  doc.line(15, 36, 195, 36);

  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 83, 9);
  doc.line(15, 37.5, 195, 37.5);

  // 3. Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(180, 83, 9);
  doc.text("LAPORAN HASIL ASESMEN INDIVIDU", 105, 48, { align: "center" });
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Nomor Dokumen: ASESMEN/TKA-TKAD/2026/" + student.NISN, 105, 53, { align: "center" });

  // 4. Student Bio card
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(15, 60, 180, 36, 3, 3, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  
  doc.text("BIODATA PESERTA ASESMEN", 20, 67);
  
  // Left column in bio
  doc.setFont("helvetica", "bold");
  doc.text("NAMA LENGKAP", 20, 75);
  doc.text("NISN", 20, 81);
  doc.text("TANGGAL LAHIR", 20, 87);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(": " + student["NAMA LENGKAP"], 60, 75);
  doc.text(": " + student.NISN, 60, 81);
  doc.text(": " + student["TANGGAL LAHIR"], 60, 87);

  // Right status card inside Bio
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(140, 66, 48, 24, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("REKOMENDASI KELULUSAN", 164, 72, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36); // Amber light text
  doc.text(scores.status, 164, 80, { align: "center" });

  // 5. Scores Section Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("TABEL CAPAIAN SKOR SUB-TES", 15, 108);

  // Scores Table
  const tableData = [
    ["1", "Kemampuan Verbal (Verbal Reasoning)", scores.verbal.toString(), "100", getPerformanceCategory(scores.verbal)],
    ["2", "Kemampuan Kuantitatif (Mathematical Logical)", scores.kuantitatif.toString(), "100", getPerformanceCategory(scores.kuantitatif)],
    ["3", "Kemampuan Penalaran (Analytic Reasoning)", scores.penalaran.toString(), "100", getPerformanceCategory(scores.penalaran)],
    ["4", "Kemampuan Spasial (Spatial Skill)", scores.spasial.toString(), "100", getPerformanceCategory(scores.spasial)],
    ["5", "Matematika (Mathematics)", scores.matematika.toString(), "100", getPerformanceCategory(scores.matematika)],
    ["6", "Bahasa Indonesia (Indonesian Language)", scores.bahasaIndonesia.toString(), "100", getPerformanceCategory(scores.bahasaIndonesia)],
    ["7", "IPA (Natural Sciences)", scores.ipa.toString(), "100", getPerformanceCategory(scores.ipa)],
    ["8", "Bahasa Inggris (English Language)", scores.bahasaInggris.toString(), "100", getPerformanceCategory(scores.bahasaInggris)],
    ["", "SKOR AKHIR & MATRIKS", "", "", ""],
    ["*", "RATA-RATA NILAI (0 - 100)", scores.average.toString() + " %", "-", getPerformanceCategory(Math.round(scores.average))],
    ["*", "SKOR STANDAR TKAD (200 - 800)", scores.totalScore.toString() + " Pts", "800", `Grade: ${scores.grade} (${scores.percentile}th Percentile)`]
  ];

  autoTable(doc, {
    startY: 112,
    head: [["NO", "ASPEK EVALUASI / MATERI ASESMEN", "SKOR PEROLEHAN", "SKOR MAX", "PRESTASI / KATEGORI"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 90, halign: "left" },
      2: { cellWidth: 35, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 35, halign: "center" }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.2,
      valign: "middle"
    },
    didParseCell: (data) => {
      // Style headers inside table section headers
      if (data.row.index === 8) {
        data.cell.styles.fillColor = [226, 232, 240]; // slate-200
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [30, 41, 59];
      }
      if (data.row.index > 8) {
        data.cell.styles.fillColor = [248, 250, 252]; // light border rows
        data.cell.styles.fontStyle = "bold";
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 165;

  // 6. Descriptive Text block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const desc = "Deskripsi Metodologi: Nilai di atas menggambarkan gambaran holistik potensi intelek dan kecakapan akademik siswa. Kemampuan Verbal mengevaluasi pemahaman kata dan penalaran argumentatif. Kuantitatif mengukur pemecahan pola rumit dan angka. Penalaran mengukur kemahiran logis dan relasi struktural, sedangkan Spasial mengukur konstruksi visual objek 3D. Seluruh aspek digunakan sebagai pijakan pemetaan minat-bakat.";
  doc.text(desc, 15, finalY + 8, { maxWidth: 180, align: "justify" });

  // 7. Signatures footer area
  const sigY = finalY + 32;

  // Stamp circle & logo simulation in QR
  doc.setLineWidth(0.4);
  doc.setDrawColor(220, 38, 38); // Red Stamp
  doc.circle(58, sigY + 14, 11);
  doc.circle(58, sigY + 14, 10.4);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(220, 38, 38);
  doc.text("PANITIA ADISI", 58, sigY + 9, { align: "center" });
  doc.setFontSize(7);
  doc.text("* MUHIPA *", 58, sigY + 14, { align: "center" });
  doc.setFontSize(5);
  doc.text("SEMBADANI", 58, sigY + 18, { align: "center" });

  // Left Signee (Head of Committee)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Mengetahui,", 35, sigY);
  doc.setFont("helvetica", "bold");
  doc.text("Ketua Panitia TKA/TKAD", 35, sigY + 5);
  
  // Custom scribble simulation for signature
  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 58, 138); // blue ink signature
  doc.line(32, sigY + 13, 38, sigY + 19);
  doc.line(38, sigY + 19, 42, sigY + 11);
  doc.line(42, sigY + 11, 48, sigY + 18);
  doc.line(48, sigY + 18, 55, sigY + 14);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Drs. H. Mulyono, M.Pd.", 35, sigY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NIP. 19680324 199403 1 004", 35, sigY + 29);

  // Right Signee (School Principal)
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Sleman, " + getIndonesianTodayDate(), 140, sigY);
  doc.setFont("helvetica", "bold");
  doc.text("Kepala Sekolah MUHIPA", 140, sigY + 5);

  // Custom scribble simulation
  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 58, 138);
  doc.line(138, sigY + 15, 145, sigY + 11);
  doc.line(145, sigY + 11, 151, sigY + 18);
  doc.line(151, sigY + 18, 156, sigY + 13);
  doc.line(156, sigY + 13, 163, sigY + 20);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Dra. Hj. Wahyu Utami, M.Si.", 140, sigY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NIPT. 10.04.1.2009.67", 140, sigY + 29);

  // Bottom verification note
  doc.setFillColor(248, 250, 252);
  doc.rect(15, sigY + 36, 180, 8, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Catatan: Dokumen ini diterbitkan secara elektronik oleh Sistem Informasi Hasil Seleksi MUHIPA. Verifikasi kode NISN untuk konfirmasi orisinalitas.", 105, sigY + 41, { align: "center" });

  // Open the PDF in a new window/tab for previewing/reading instead of direct download
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank");
}

// Map scores to a performance scale description
function getPerformanceCategory(val: number): string {
  if (val >= 90) return "SANGAT BAIK (A+)";
  if (val >= 80) return "BAIK (A)";
  if (val >= 70) return "CUKUP BAIK (B)";
  if (val >= 60) return "CUKUP (C)";
  return "KURANG (D)";
}

// Get standard Indonesian today date string, e.g. "28 Mei 2026"
function getIndonesianTodayDate(): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const today = new Date();
  const day = today.getDate();
  const monthIdx = today.getMonth();
  const year = today.getFullYear();
  
  return `${day} ${months[monthIdx]} ${year}`;
}
