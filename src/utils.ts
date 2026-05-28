import { Student, StudentScores } from "./types";

/**
 * Deterministically generates scores based on student's NISN and merges real academic columns
 */
export function generateScores(student: Student): StudentScores {
  // Simple stable hash function
  let hash = 0;
  const seed = student.NISN || "default";
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const getVal = (offset: number, min = 65, max = 98) => {
    return Math.abs((hash + offset) % (max - min + 1)) + min;
  };

  const parseSheetScore = (val: string | undefined, fallback: number) => {
    if (val === undefined || val === null || val.trim() === "") return fallback;
    const cleaned = val.replace(/,/g, '.').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : Math.round(parsed * 100) / 100;
  };

  const verbal = getVal(11, 72, 96);
  const kuantitatif = getVal(22, 65, 95);
  const penalaran = getVal(33, 70, 94);
  const spasial = getVal(44, 68, 93);
  
  const matematika = parseSheetScore(student.MATEMATIKA, getVal(55, 68, 97));
  const bahasaIndonesia = parseSheetScore(student["BAHASA INDONESIA"], getVal(66, 75, 98));
  const ipa = parseSheetScore(student.IPA, getVal(77, 65, 96));
  const bahasaInggris = parseSheetScore(student["BAHASA INGGRIS"], getVal(88, 70, 95));
  
  const average = Math.round(((verbal + kuantitatif + penalaran + spasial + matematika + bahasaIndonesia + ipa + bahasaInggris) / 8) * 100) / 100;
  
  // Calculate standard scale (200 - 800)
  const totalScore = Math.round(250 + (average / 100) * 550);
  
  let grade = "B";
  if (average >= 85) grade = "A";
  else if (average >= 75) grade = "B";
  else if (average >= 60) grade = "C";
  else grade = "D";

  let status: "SANGAT DIREKOMENDASIKAN" | "DIREKOMENDASIKAN" | "CUKUP DIREKOMENDASIKAN" = "DIREKOMENDASIKAN";
  if (average >= 82) {
    status = "SANGAT DIREKOMENDASIKAN";
  } else if (average >= 72) {
    status = "DIREKOMENDASIKAN";
  } else {
    status = "CUKUP DIREKOMENDASIKAN";
  }

  // Determine a realistic percentile
  const percentile = Math.min(99, Math.max(50, Math.round(55 + (average - 68) * 1.6)));

  return {
    verbal,
    kuantitatif,
    penalaran,
    spasial,
    matematika,
    bahasaIndonesia,
    ipa,
    bahasaInggris,
    average,
    totalScore,
    grade,
    percentile,
    status
  };
}

/**
 * Parses birth place and birth date fields
 */
export interface ParsedBirthDate {
  tempatLahir: string;
  tanggal: string;
  bulan: string;
  tahun: string;
}

export function parseBirthDate(birthDateStr: string): ParsedBirthDate {
  try {
    const parts = birthDateStr.split(",");
    const tempatLahir = parts[0]?.trim() || "Tidak Diketahui";
    
    const rest = parts[1]?.trim() || "";
    const dateParts = rest.split(/\s+/);
    
    const tanggal = dateParts[0] || "";
    const bulan = dateParts[1] || "";
    const tahun = dateParts[2] || "";
    
    return {
      tempatLahir,
      tanggal,
      bulan,
      tahun
    };
  } catch (err) {
    return {
      tempatLahir: "Tidak Diketahui",
      tanggal: "",
      bulan: "",
      tahun: ""
    };
  }
}

/**
 * Robust CSV parser that runs in the browser
 */
export function parseClientCSV(text: string): Student[] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') { // escaped quote
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
        lines.push(row);
      }
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    lines.push(row);
  }

  if (lines.length === 0) return [];
  
  const rawHeaders = lines[0];
  const headers = rawHeaders.map(h => h.trim().toUpperCase());
  
  const items: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (r.length === 0) continue;
    const item: any = {};
    headers.forEach((header, index) => {
      item[header] = index < r.length ? r[index] : "";
    });
    items.push(item);
  }
  return items;
}

/**
 * Resolves a Google Drive direct download or general URL into its interactive preview viewer URL
 */
export function getStudentPdfUrl(student: Student | null | undefined): string | null {
  if (!student) return null;
  const fileUrl = student["FILE PDF"]?.trim();
  if (!fileUrl || (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://"))) {
    return null;
  }
  
  let previewUrl = fileUrl;
  try {
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
  return previewUrl;
}

/**
 * Generates an HSL color string interpolating from Red (0) to Green (100) based on score
 */
export function getScoreColor(score: number | string | undefined | null): string {
  const num = typeof score === "number" ? score : parseFloat(score || "0") || 0;
  const clamped = Math.min(Math.max(num, 0), 100);
  // Red is 0 deg hue, emerald/green is ~135 deg hue.
  const hue = clamped * 1.35;
  return `hsl(${hue}, 85%, 52%)`;
}



