import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory cache for Sheet data
  let cachedData: any[] = [];
  let cacheExpiry = 0;
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  // Helper function to parse CSV robustly
  function parseCSV(text: string) {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';
    
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
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          lines.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      lines.push(row);
    }
    return lines;
  }

  // Fetch and parse data from Google Sheet
  async function getSheetData() {
    const now = Date.now();
    if (cachedData.length > 0 && now < cacheExpiry) {
      return cachedData;
    }

    try {
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1fn6dOYMeSUfzouqZNT3CXf0TYiaAy3j7E_Rgcis9FnM/export?format=csv&gid=1531674612";
      console.log(`[API] Fetching sheet data from: ${sheetUrl}`);
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();
      
      // DIAGNOSTIC EXPORT
      try {
        const fs = await import("fs");
        fs.writeFileSync(path.join(process.cwd(), "src/schema-csv.json"), JSON.stringify({
          rawLines: csvText.split("\n").slice(0, 10),
          characterCount: csvText.length
        }, null, 2));
      } catch (e) {
        console.error("Failed to write diagnostic CSV:", e);
      }

      const parsed = parseCSV(csvText);

      if (parsed.length === 0) {
        throw new Error("Parsed sheet contains no data.");
      }

      // First row is headers
      const rawHeaders = parsed[0];
      const headers = rawHeaders.map(h => h.trim().toUpperCase());

      console.log("[CSV Headers parsed]:", headers);

      const items: any[] = [];
      for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        if (row.length === 0) continue;
        
        // Match columns to headers
        const item: any = {};
        headers.forEach((header, index) => {
          // If row has column, map it, otherwise empty string
          item[header] = index < row.length ? row[index] : "";
        });
        
        items.push(item);
      }

      // Write schema to src/schema.json for introspection
      try {
        const fs = await import("fs");
        const schemaInfo = {
          headers,
          count: items.length,
          sample: items.slice(0, 3)
        };
        fs.writeFileSync(path.join(process.cwd(), "src/schema.json"), JSON.stringify(schemaInfo, null, 2));
        console.log("[Schema write] Wrote schema to src/schema.json");
      } catch (writeErr) {
        console.error("Failed to write schema.json:", writeErr);
      }

      console.log(`[CSV Data loaded]: Parsed ${items.length} students. Sample:`, items.slice(0, 3));
      
      cachedData = items;
      cacheExpiry = now + CACHE_DURATION;
      return items;
    } catch (error) {
      console.error("[ERROR] Failed to fetch or parse sheet data:", error);
      // Fallback to cache if request fails, otherwise throw
      if (cachedData.length > 0) {
        console.log("[API] Using expired cache fallback due to fetch failure.");
        return cachedData;
      }
      throw error;
    }
  }

  // Pre-load sheet data on startup to check headers and log schema
  try {
    await getSheetData();
    // Crawl for spreadsheet tabs in htmlview
    try {
      const htmlUrl = "https://docs.google.com/spreadsheets/d/1fn6dOYMeSUfzouqZNT3CXf0TYiaAy3j7E_Rgcis9FnM/htmlview";
      console.log(`[API] Crawling htmlview for tabs: ${htmlUrl}`);
      const res = await fetch(htmlUrl);
      const html = await res.text();
      
      const occurrences = [...html.matchAll(/gid=(\d+)/g)].map(m => m[1]);
      const uniqueGids = [...new Set(occurrences)];
      
      // Look for sheet tab buttons in Google Sheets htmlview
      // Look for: id="sheet-button-xxx"
      // or class="sheet-tab" or class="goog-inline-block goog-tab"
      // Format: <a href="#gid=1531674612" ...>TAB_NAME</a> or <div class="goog-inline-block goog-tab" ...>TAB_NAME</div>
      const idMatches = [...html.matchAll(/id="sheet-button-(\d+)"[^>]*>([^<]+)/g)];
      const idTabs = idMatches.map(m => ({ gid: m[1], name: m[2].trim() }));
      
      const hrefMatches = [...html.matchAll(/href="[^"]*gid=(\d+)"[^>]*>([^<]+)/g)];
      const hrefTabs = hrefMatches.map(m => ({ gid: m[1], name: m[2].trim() }));

      // Look for sheet name lists in JS
      // Format: "1531674612","Sheet Name" or similar
      const jsSheets: any[] = [];
      const jsMatches = [...html.matchAll(/"(\d{5,12})"\s*,\s*"([^"]{2,30})"/g)];
      jsMatches.forEach(m => {
        if (!jsSheets.some(s => s.gid === m[1])) {
          jsSheets.push({ gid: m[1], name: m[2] });
        }
      });

      const fs = await import("fs");
      const diagPath = path.join(process.cwd(), "src/schema-diag.json");
      const currentSchema = {
        uniqueGids,
        idTabs,
        hrefTabs,
        jsSheets,
        diagnostics: {
          htmlLength: html.length,
          snippet: html.substring(0, 1000)
        }
      };
      fs.writeFileSync(diagPath, JSON.stringify(currentSchema, null, 2));
      console.log("[Diag write] Wrote advanced diag info to src/schema-diag.json");
    } catch (e: any) {
      console.error("Failed to extract tabs:", e);
    }
  } catch (err) {
    console.error("[Startup warning] Could not pre-fetch sheet data:", err);
  }

  // API to fetch all students (or search if needed)
  app.get("/api/students", async (req, res) => {
    try {
      const data = await getSheetData();
      res.json({ success: true, count: data.length, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Safe search API - avoids exposing entire database to client
  app.get("/api/students/search", async (req, res) => {
    try {
      const { name, dob } = req.query;
      if (!name) {
        return res.status(400).json({ success: false, error: "NAMA SISWA diperlukan untuk pencarian." });
      }

      const data = await getSheetData();
      
      const searchName = String(name).toLowerCase().trim();
      const searchDob = dob ? String(dob).trim() : null;

      // Find matching student
      const matches = data.filter(student => {
        // Find keys with students name and birthdate
        // The headers of sheet are dynamic, we need to inspect and handle key matching
        const studentName = (student["NAMA"] || student["NAMA SISWA"] || student["NAMA LENGKAP"] || Object.values(student)[0] || "").toString().toLowerCase().trim();
        const studentDob = (student["TANGGAL LAHIR"] || student["TGL LAHIR"] || student["LAHIR"] || "").toString().trim();

        // Check if student name contains the search name (or exact match)
        const nameMatches = studentName === searchName || studentName.includes(searchName);
        
        if (searchDob) {
          // Format both to facilitate matching
          return nameMatches && (studentDob === searchDob || studentDob.replace(/[-/]/g, "") === searchDob.replace(/[-/]/g, ""));
        }
        return nameMatches;
      });

      res.json({ success: true, results: matches });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Client-side serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
