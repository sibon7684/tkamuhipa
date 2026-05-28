var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  let cachedData = [];
  let cacheExpiry = 0;
  const CACHE_DURATION = 2 * 60 * 1e3;
  function parseCSV(text) {
    const lines = [];
    let row = [];
    let inQuotes = false;
    let currentVal = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
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
    return lines;
  }
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
      try {
        const fs = await import("fs");
        fs.writeFileSync(import_path.default.join(process.cwd(), "src/schema-csv.json"), JSON.stringify({
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
      const rawHeaders = parsed[0];
      const headers = rawHeaders.map((h) => h.trim().toUpperCase());
      console.log("[CSV Headers parsed]:", headers);
      const items = [];
      for (let i = 1; i < parsed.length; i++) {
        const row = parsed[i];
        if (row.length === 0) continue;
        const item = {};
        headers.forEach((header, index) => {
          item[header] = index < row.length ? row[index] : "";
        });
        items.push(item);
      }
      try {
        const fs = await import("fs");
        const schemaInfo = {
          headers,
          count: items.length,
          sample: items.slice(0, 3)
        };
        fs.writeFileSync(import_path.default.join(process.cwd(), "src/schema.json"), JSON.stringify(schemaInfo, null, 2));
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
      if (cachedData.length > 0) {
        console.log("[API] Using expired cache fallback due to fetch failure.");
        return cachedData;
      }
      throw error;
    }
  }
  try {
    await getSheetData();
    try {
      const htmlUrl = "https://docs.google.com/spreadsheets/d/1fn6dOYMeSUfzouqZNT3CXf0TYiaAy3j7E_Rgcis9FnM/htmlview";
      console.log(`[API] Crawling htmlview for tabs: ${htmlUrl}`);
      const res = await fetch(htmlUrl);
      const html = await res.text();
      const occurrences = [...html.matchAll(/gid=(\d+)/g)].map((m) => m[1]);
      const uniqueGids = [...new Set(occurrences)];
      const idMatches = [...html.matchAll(/id="sheet-button-(\d+)"[^>]*>([^<]+)/g)];
      const idTabs = idMatches.map((m) => ({ gid: m[1], name: m[2].trim() }));
      const hrefMatches = [...html.matchAll(/href="[^"]*gid=(\d+)"[^>]*>([^<]+)/g)];
      const hrefTabs = hrefMatches.map((m) => ({ gid: m[1], name: m[2].trim() }));
      const jsSheets = [];
      const jsMatches = [...html.matchAll(/"(\d{5,12})"\s*,\s*"([^"]{2,30})"/g)];
      jsMatches.forEach((m) => {
        if (!jsSheets.some((s) => s.gid === m[1])) {
          jsSheets.push({ gid: m[1], name: m[2] });
        }
      });
      const fs = await import("fs");
      const diagPath = import_path.default.join(process.cwd(), "src/schema-diag.json");
      const currentSchema = {
        uniqueGids,
        idTabs,
        hrefTabs,
        jsSheets,
        diagnostics: {
          htmlLength: html.length,
          snippet: html.substring(0, 1e3)
        }
      };
      fs.writeFileSync(diagPath, JSON.stringify(currentSchema, null, 2));
      console.log("[Diag write] Wrote advanced diag info to src/schema-diag.json");
    } catch (e) {
      console.error("Failed to extract tabs:", e);
    }
  } catch (err) {
    console.error("[Startup warning] Could not pre-fetch sheet data:", err);
  }
  app.get("/api/students", async (req, res) => {
    try {
      const data = await getSheetData();
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/students/search", async (req, res) => {
    try {
      const { name, dob } = req.query;
      if (!name) {
        return res.status(400).json({ success: false, error: "NAMA SISWA diperlukan untuk pencarian." });
      }
      const data = await getSheetData();
      const searchName = String(name).toLowerCase().trim();
      const searchDob = dob ? String(dob).trim() : null;
      const matches = data.filter((student) => {
        const studentName = (student["NAMA"] || student["NAMA SISWA"] || student["NAMA LENGKAP"] || Object.values(student)[0] || "").toString().toLowerCase().trim();
        const studentDob = (student["TANGGAL LAHIR"] || student["TGL LAHIR"] || student["LAHIR"] || "").toString().trim();
        const nameMatches = studentName === searchName || studentName.includes(searchName);
        if (searchDob) {
          return nameMatches && (studentDob === searchDob || studentDob.replace(/[-/]/g, "") === searchDob.replace(/[-/]/g, ""));
        }
        return nameMatches;
      });
      res.json({ success: true, results: matches });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
