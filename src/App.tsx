import { useEffect, useState, FormEvent } from "react";
import { 
  Search, 
  Calendar, 
  FileDown, 
  ChevronRight, 
  Sparkles, 
  User, 
  School, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Lock, 
  RotateCcw,
  Smartphone,
  Check,
  Building
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, StudentScores } from "./types";
import { generateScores, parseBirthDate, parseClientCSV, getStudentPdfUrl, getScoreColor } from "./utils";
import { downloadPDF } from "./pdf-generator";
import schoolLogo from "./assets/images/smp_logo_final_transparent_1779958002437.png";

export default function App() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search Screen State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Verification State
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [verifyError, setVerifyError] = useState("");
  
  // Dashboard Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeScores, setActiveScores] = useState<StudentScores | null>(null);

  // Load students from Express API proxy on startup with client-side fallback
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/students");
        if (!res.ok) {
          throw new Error("Gagal mengambil data dari server atau Google Sheet.");
        }
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAllStudents(json.data);
        } else {
          throw new Error(json.error || "Format data tidak valid.");
        }
      } catch (err: any) {
        console.warn("Express API failed, trying direct Google Sheets CSV fetch...", err);
        // Fallback to direct download and parsing of CSV in browser
        try {
          const sheetUrl = "https://docs.google.com/spreadsheets/d/1fn6dOYMeSUfzouqZNT3CXf0TYiaAy3j7E_Rgcis9FnM/export?format=csv&gid=1531674612";
          const dRes = await fetch(sheetUrl);
          if (!dRes.ok) {
            throw new Error("Gagal mengambil data langsung dari Google Sheet.");
          }
          const csvText = await dRes.text();
          const parsed = parseClientCSV(csvText);
          if (parsed.length > 0) {
            setAllStudents(parsed);
            setFetchError(null);
          } else {
            throw new Error("Data Google Sheet kosong.");
          }
        } catch (fallbackErr: any) {
          setFetchError(fallbackErr.message || "Gagal membangun koneksi ke database Google Sheet.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update suggestions based on user input (case-insensitive search matching Nama Lengkap/NISN)
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const filtered = allStudents.filter(s => {
      const nameMatch = s["NAMA LENGKAP"].toLowerCase().includes(query.toLowerCase());
      const nisnMatch = s.NISN.includes(query);
      return nameMatch || nisnMatch;
    }).slice(0, 5); // Limit suggestions to 5 items for mobile screens

    setSuggestions(filtered);
  }, [query, allStudents]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setQuery("");
    setSuggestions([]);
    
    // Reset verification inputs for the newly selected student
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
    setVerifyError("");
    setIsUnlocked(false);
    setActiveScores(null);
  };

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (!selectedDay || !selectedMonth || !selectedYear) {
      setVerifyError("Silakan lengkapi pilihan tanggal lahir Anda.");
      return;
    }

    // Parse the actual student DOB from Sheet
    const parsedDOB = parseBirthDate(selectedStudent["TANGGAL LAHIR"]);
    
    // Verify matching
    const normalizedMonthInput = selectedMonth.toLowerCase().trim();
    const normalizedMonthReal = parsedDOB.bulan.toLowerCase().trim();

    const isDayMatch = selectedDay === parsedDOB.tanggal;
    const isYearMatch = selectedYear === parsedDOB.tahun;
    
    // Support partial or direct mapping
    const isMonthMatch = normalizedMonthInput === normalizedMonthReal ||
                         normalizedMonthInput.substring(0, 3) === normalizedMonthReal.substring(0, 3);

    if (isDayMatch && isMonthMatch && isYearMatch) {
      // Successfully authenticated!
      const generated = generateScores(selectedStudent);
      setActiveScores(generated);
      setIsUnlocked(true);
      setVerifyError("");
    } else {
      setVerifyError("Verifikasi Gagal! Tanggal, bulan, atau tahun lahir tidak cocok dengan data.");
    }
  };

  const handleResetSearch = () => {
    setSelectedStudent(null);
    setSelectedDay("");
    setSelectedMonth("");
    setSelectedYear("");
    setVerifyError("");
    setIsUnlocked(false);
    setActiveScores(null);
    setQuery("");
  };

  // Days list (1-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  
  // Indonesian Months list
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Standard Indonesian years lists for middle-high school students (mostly born around 2005-2015)
  const years = Array.from({ length: 16 }, (_, i) => (2002 + i).toString());

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased pb-12 selection:bg-blue-500/30 selection:text-white relative overflow-hidden">
      {/* Mesh Background Decor Blooms */}
      <div className="absolute top-[-10%] left-[-15%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-blue-600/15 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-15%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-indigo-600/15 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-purple-600/10 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none -z-10" />

      {/* Modern Header / Navigation Bar */}
      <header className="max-w-4xl mx-auto px-4 pt-6 pb-2 flex justify-between items-center text-white relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-lg overflow-hidden p-1">
            <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider leading-none text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 font-display">PENGUMUMAN</h1>
            <p className="text-[10px] text-white/50 font-mono tracking-tight mt-0.5">SMP Muhammadiyah Pakem</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] font-mono text-white/80 shadow-sm">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-0.5" />
          DATABASE AKTIF
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-8 relative z-10">
        
        {/* State 1: Still loading Database from Google Sheets */}
        {loading && (
          <div className="bg-white/10 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 border border-white/20 text-center py-16 flex flex-col items-center justify-center text-white max-w-md mx-auto relative overflow-hidden">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-blue-500/20 rounded-full animate-spin border-t-blue-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={schoolLogo} alt="Loading..." className="w-8 h-8 object-contain animate-pulse" referrerPolicy="no-referrer" />
              </div>
            </div>
            <h3 className="mt-6 text-base font-bold text-white font-display">Mengunduh Database Siswa</h3>
            <p className="mt-2 text-xs text-white/60 max-w-xs leading-relaxed">
              Sedang mengambil dan mensinkronisasikan data resmi langsung dari cloud Google Sheets...
            </p>
          </div>
        )}

        {/* State 2: Fetch Error with Database */}
        {!loading && fetchError && (
          <div className="bg-rose-500/10 backdrop-blur-xl rounded-[32px] shadow-2xl border border-rose-500/20 p-8 text-center max-w-md mx-auto text-white">
            <AlertTriangle size={36} className="text-rose-400 mx-auto animate-pulse" />
            <h3 className="mt-4 text-sm font-bold text-white font-display">Koneksi Database Terputus</h3>
            <p className="mt-2 text-xs text-rose-200/85 leading-relaxed">
              Sayangnya terjadi kegagalan sinkronisasi cloud: <br/>
              <span className="font-mono bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded inline-block mt-2 text-[10px]">{fetchError}</span>
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-5 w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow shadow-rose-500/20"
            >
              Coba Hubungkan Kembali
            </button>
          </div>
        )}

        {/* State 3: Content Loaded Successfully */}
        {!loading && !fetchError && (
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: Search & Identity Verification */}
            {!isUnlocked ? (
              <motion.div
                key="lookup-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="max-w-md mx-auto"
              >
                
                {/* Title Card */}
                <div className="text-center mb-6 text-white pb-2">
                  <h2 className="text-3xl font-black tracking-tight leading-tight font-display">
                    Hasil <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">TKA & TKAD</span>
                  </h2>
                  <p className="text-xs text-white/60 mt-3 max-w-xs mx-auto leading-relaxed">
                    Masukkan data diri Anda untuk melihat rincian nilai dan<br />
                    mengunduh sertifikat resmi hasil asesmen<br />
                    SMP Muhammadiyah Pakem.
                  </p>
                </div>

                {/* Main Action Portal Box */}
                <div className="bg-white/10 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden transform transition duration-500 text-white">
                  <div className="p-6 sm:p-8">
                    
                    {/* Stepper Indicator */}
                    <div className="flex items-center justify-between sm:justify-start sm:space-x-2 text-[8px] xs:text-[10px] font-bold tracking-normal sm:tracking-widest text-white/40 mb-6 font-mono border-b border-white/10 pb-4">
                      <span className={`${!selectedStudent ? "text-blue-400 font-extrabold" : "text-emerald-400"} shrink-0`}>1. CARI NAMA</span>
                      <ChevronRight size={10} className="text-white/20 shrink-0" />
                      <span className={`${selectedStudent && !isUnlocked ? "text-blue-400 font-extrabold" : "text-white/20"} shrink-0 text-center`}>2. VERIFIKASI SEED</span>
                      <ChevronRight size={10} className="text-white/20 shrink-0" />
                      <span className="text-white/20 shrink-0 text-right">3. HASIL NILAI</span>
                    </div>

                    {!selectedStudent ? (
                      /* STEP 1: Search student by name or NISN */
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-blue-300 font-bold mb-3 ml-1">
                          Nama Lengkap Siswa / NISN
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Contoh: AARON FADHIL atau 109053..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 focus:border-blue-500 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30 text-sm font-medium py-4 px-6 pr-12 rounded-2xl transition text-white outline-none placeholder:text-white/20"
                            id="searching-field"
                            autoComplete="off"
                          />
                          <div className="absolute right-4 top-4.5 text-white/40">
                            <Search size={18} />
                          </div>
                        </div>

                        {/* Suggestions Results Dropdown */}
                        <div className="mt-4 min-h-[140px]">
                          {suggestions.length > 0 ? (
                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-2xl">
                              {suggestions.map((student) => (
                                <button
                                  key={student.NISN}
                                  onClick={() => handleSelectStudent(student)}
                                  className="w-full text-left px-5 py-3.5 hover:bg-white/10 transition flex justify-between items-center group"
                                  id={`student-opt-${student.NISN}`}
                                >
                                  <div>
                                    <p className="text-xs font-bold text-white group-hover:text-blue-300 transition uppercase tracking-wide">
                                      {student["NAMA LENGKAP"]}
                                    </p>
                                    <p className="text-[10px] text-white/50 mt-0.5 font-mono">
                                      NISN: {student.NISN}
                                    </p>
                                  </div>
                                  <div className="bg-white/10 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300 border border-white/10">
                                    <ChevronRight size={14} className="stroke-[2.5]" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : query.trim().length > 0 ? (
                            <div className="text-center py-8">
                              <AlertTriangle size={24} className="text-white/30 mx-auto" />
                              <p className="text-[11px] text-white/60 mt-2">Siswa tidak ditemukan. Coba ketik dengan benar.</p>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-white/40 flex flex-col items-center justify-center bg-white/5">
                              <Sparkles size={18} className="text-blue-400 mb-2 animate-pulse" />
                              <p className="text-[11px] font-semibold text-white/70">Masukkan Nama di atas untuk pencarian</p>
                              <p className="text-[9px] text-white/40 italic mt-1">Tersedia 104 data siswa terdaftar</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* STEP 2: Verification of Date of Birth for Selected Student */
                      <form onSubmit={handleVerify} className="space-y-4">
                        
                        {/* Selected Student Summary Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2.5 rounded-xl border border-white/10 shadow-md">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="text-[9px] text-blue-300 font-bold uppercase tracking-wider font-mono">Siswa Terpilih</p>
                              <h4 className="text-xs font-bold text-white mt-0.5">{selectedStudent["NAMA LENGKAP"]}</h4>
                              <p className="text-[10px] text-white/50 font-mono mt-0.5">NISN: {selectedStudent.NISN}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetSearch}
                            className="text-[10px] text-white/80 hover:text-white font-bold tracking-tight bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/5 transition"
                          >
                            Ubah
                          </button>
                        </div>

                        {/* Birth Place Information */}
                        <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex items-center justify-between text-xs">
                          <span className="text-white/60 font-medium">Tempat Lahir Terdaftar:</span>
                          <span className="font-bold text-blue-300 uppercase tracking-wide">{parseBirthDate(selectedStudent["TANGGAL LAHIR"]).tempatLahir}</span>
                        </div>

                        {/* Verification selectors */}
                        <div className="space-y-3 pt-1">
                          <span className="block text-[10px] uppercase tracking-wider text-blue-300 font-bold ml-1">
                            Masukkan Tanggal Lahir Anda
                          </span>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {/* Day Selection */}
                            <div>
                              <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 ml-0.5">Hari (Tgl)</label>
                              <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 text-xs font-semibold py-3 px-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-white"
                              >
                                <option value="" className="bg-slate-950 text-white/90">-- Tgl --</option>
                                {days.map(d => (
                                  <option key={d} value={d} className="bg-slate-950 text-white/90">{d}</option>
                                ))}
                              </select>
                            </div>

                            {/* Month Selection */}
                            <div>
                              <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 ml-0.5">Bulan</label>
                              <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 text-xs font-semibold py-3 px-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-white"
                              >
                                <option value="" className="bg-slate-950 text-white/90">-- Bulan --</option>
                                {months.map(m => (
                                  <option key={m} value={m} className="bg-slate-950 text-white/90">{m}</option>
                                ))}
                              </select>
                            </div>

                            {/* Year Selection */}
                            <div>
                              <label className="block text-[9px] text-white/50 uppercase font-bold mb-1 ml-0.5">Tahun</label>
                              <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 text-xs font-semibold py-3 px-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-white"
                              >
                                <option value="" className="bg-slate-950 text-white/90">-- Tahun --</option>
                                {years.map(y => (
                                  <option key={y} value={y} className="bg-slate-950 text-white/90">{y}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Error message block */}
                        {verifyError && (
                          <div className="bg-rose-500/10 text-rose-300 p-3.5 rounded-xl border border-rose-500/20 flex items-start space-x-2 text-[11px] leading-relaxed">
                            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-400" />
                            <span>{verifyError}</span>
                          </div>
                        )}

                        {/* Submit verification button */}
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs py-4 px-4 rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 focus:ring-2 focus:ring-blue-500/30 outline-none"
                        >
                          <Lock size={14} className="text-white stroke-[2.5]" />
                          <span>VERIFIKASI & BUKA HASIL</span>
                        </button>
                      </form>
                    )}

                  </div>
                </div>

                {/* Secure bottom badge */}
                <div className="mt-6 flex items-center justify-center space-x-2 text-white/40 font-medium text-[10px] tracking-wider uppercase">
                  <Smartphone size={12} className="text-white/30" />
                  <span>Verified Secure Portal SMP MUHIPA</span>
                </div>

              </motion.div>
            ) : (
              
              /* SCREEN 2: Dashboard Results & Scoring Card */
              activeScores && selectedStudent && (
                <motion.div
                  key="results-screen"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Top Back Nav & Quick Download bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <button
                      onClick={handleResetSearch}
                      className="flex items-center space-x-1.5 text-xs text-white/90 hover:text-blue-300 font-bold bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-full border border-white/15 transition shadow-sm"
                    >
                      <RotateCcw size={13} className="stroke-[2.5]" />
                      <span>Kembali ke Pencarian</span>
                    </button>
                    
                    {getStudentPdfUrl(selectedStudent) ? (
                      <a
                        href={getStudentPdfUrl(selectedStudent)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-1.5 shrink-0 text-center"
                      >
                        <FileDown size={14} className="stroke-[2.5]" />
                        <span>DOWNLOAD (PDF)</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => downloadPDF(selectedStudent)}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs py-2.5 px-5 rounded-full transition shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-1.5 shrink-0"
                      >
                        <FileDown size={14} className="stroke-[2.5]" />
                        <span>DOWNLOAD (PDF)</span>
                      </button>
                    )}
                  </div>

                  {/* Header Student Bio Card */}
                  <div className="bg-gradient-to-br from-indigo-950/40 via-blue-900/20 to-slate-900/40 backdrop-blur-xl rounded-[32px] shadow-2xl border border-blue-500/25 p-5 md:p-6 overflow-hidden relative text-white">
                    {/* Top Accent Strip */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-500/10 text-white p-3 rounded-2xl flex items-center justify-center border border-blue-500/20">
                          <User size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                              ASESMEN BERHASIL
                            </span>
                          </div>
                          <h3 className="text-xl font-extrabold text-white mt-1 capitalize leading-snug font-display">
                            {selectedStudent["NAMA LENGKAP"].toLowerCase()}
                          </h3>
                          <p className="text-xs text-white/50 mt-0.5 font-mono">
                            NISN: {selectedStudent.NISN}
                          </p>
                        </div>
                      </div>

                      {/* Right Detail Card DOB */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex shrink-0 items-center space-x-2.5 text-xs">
                        <Calendar size={15} className="text-blue-300" />
                        <div>
                          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Tanggal Lahir</p>
                          <p className="font-extrabold text-blue-300 mt-0.5">{selectedStudent["TANGGAL LAHIR"]}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assessment Summary & Recommendation Badge */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Overall Score Radial progress box */}
                    <div className="bg-gradient-to-br from-emerald-950/40 via-teal-900/25 to-slate-900/40 backdrop-blur-xl rounded-[32px] p-6 border border-emerald-500/20 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4 md:col-span-3 text-white">
                      <div className="space-y-3 text-center sm:text-left">
                        <div>
                          <span className="text-[9px] text-emerald-300 font-extrabold tracking-widest uppercase font-mono">
                            SKOR RATA-RATA (TKAD)
                          </span>
                          <h4 className="text-lg font-black text-white mt-0.5 leading-none font-display">Indeks Capaian Total</h4>
                        </div>

                        {(() => {
                          const grade = activeScores.grade;
                          let gradeColorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          let iconColorClass = "text-emerald-400";
                          
                          if (grade === "A") {
                            gradeColorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            iconColorClass = "text-emerald-400";
                          } else if (grade === "B") {
                            gradeColorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                            iconColorClass = "text-blue-400";
                          } else if (grade === "C") {
                            gradeColorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
                            iconColorClass = "text-yellow-400";
                          } else if (grade === "D") {
                            gradeColorClass = "bg-red-500/10 text-red-400 border-red-500/20";
                            iconColorClass = "text-red-400";
                          }

                          return (
                            <div className={`flex items-center justify-center sm:justify-start space-x-2 py-1.5 px-3 rounded-xl border font-mono text-[10px] font-bold ${gradeColorClass}`}>
                              <Award size={12} className={`shrink-0 ${iconColorClass}`} />
                              <span>
                                GRADE PRESTASI: {grade} (
                                {grade === "A" && "EXCELLENT"}
                                {grade === "B" && "GOOD"}
                                {grade === "C" && "SATISFACTORY"}
                                {grade === "D" && "NEEDS IMPROVEMENT"}
                                )
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Radial Indicator circular */}
                      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background Circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          {/* Animated Progress Circle */}
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#10b981" // emerald-500
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="263.89" // 2 * PI * r
                            initial={{ strokeDashoffset: 263.89 }}
                            animate={{ strokeDashoffset: 263.89 - (263.89 * activeScores.average) / 100 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-2xl font-black text-white font-mono">{activeScores.average}%</span>
                          <span className="block text-[8px] text-white/40 font-semibold uppercase tracking-widest font-mono mt-0.5">RATA-RATA</span>
                        </div>
                      </div>
                    </div>

                  </div>



                  {/* Academic Subject Scores Detail section */}
                  <div className="bg-gradient-to-br from-purple-950/40 via-fuchsia-900/20 to-slate-900/40 backdrop-blur-xl rounded-[32px] shadow-2xl border border-purple-500/25 p-5 md:p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div className="flex items-center space-x-2">
                        <BookOpen size={16} className="text-purple-300" />
                        <h4 className="text-sm font-extrabold text-white font-display">DISTRIBUSI NILAI MATAPELAJARAN (AKADEMIK)</h4>
                      </div>
                      <span className="text-[9px] text-white/50 font-bold font-mono">Skala Evaluasi (0 - 100)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* SUBJECT 1: Matematika */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-xs font-bold text-white">Matematika</span>
                            <span className="text-[10px] text-white/50 block font-mono mt-px">Aljabar, Logika, Trigonometri, Statistika</span>
                          </div>
                          <span 
                            className="font-mono text-xs font-bold bg-white/5 px-2 py-0.5 rounded-md border transition-colors duration-300"
                            style={{ 
                              color: getScoreColor(activeScores.matematika), 
                              borderColor: `${getScoreColor(activeScores.matematika)}60` 
                            }}
                          >
                            {activeScores.matematika}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeScores.matematika}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getScoreColor(activeScores.matematika) }}
                          />
                        </div>
                      </div>

                      {/* SUBJECT 2: Bahasa Indonesia */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-xs font-bold text-white">Bahasa Indonesia</span>
                            <span className="text-[10px] text-white/50 block font-mono mt-px">Sintaksis, Pemetaan Teks, Literasi & Sastra</span>
                          </div>
                          <span 
                            className="font-mono text-xs font-bold bg-white/5 px-2 py-0.5 rounded-md border transition-colors duration-300"
                            style={{ 
                              color: getScoreColor(activeScores.bahasaIndonesia), 
                              borderColor: `${getScoreColor(activeScores.bahasaIndonesia)}60` 
                            }}
                          >
                            {activeScores.bahasaIndonesia}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeScores.bahasaIndonesia}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getScoreColor(activeScores.bahasaIndonesia) }}
                          />
                        </div>
                      </div>

                      {/* SUBJECT 3: IPA */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-xs font-bold text-white">Ilmu Pengetahuan Alam (IPA)</span>
                            <span className="text-[10px] text-white/50 block font-mono mt-px">Fisika, Kimia Dasar, Mekanika, Biologi Molekuler</span>
                          </div>
                          <span 
                            className="font-mono text-xs font-bold bg-white/5 px-2 py-0.5 rounded-md border transition-colors duration-300"
                            style={{ 
                              color: getScoreColor(activeScores.ipa), 
                              borderColor: `${getScoreColor(activeScores.ipa)}60` 
                            }}
                          >
                            {activeScores.ipa}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeScores.ipa}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getScoreColor(activeScores.ipa) }}
                          />
                        </div>
                      </div>

                      {/* SUBJECT 4: Bahasa Inggris */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-xs font-bold text-white">Bahasa Inggris</span>
                            <span className="text-[10px] text-white/50 block font-mono mt-px">Grammar, Reading Comprehension, Structure & Conversation</span>
                          </div>
                          <span 
                            className="font-mono text-xs font-bold bg-white/5 px-2 py-0.5 rounded-md border transition-colors duration-300"
                            style={{ 
                              color: getScoreColor(activeScores.bahasaInggris), 
                              borderColor: `${getScoreColor(activeScores.bahasaInggris)}60` 
                            }}
                          >
                            {activeScores.bahasaInggris}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeScores.bahasaInggris}%` }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getScoreColor(activeScores.bahasaInggris) }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* PDF Download callout strip */}
                  <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 backdrop-blur-md border border-white/15 rounded-[32px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
                    <div className="flex items-start space-x-3 text-center sm:text-left">
                      <div className="bg-blue-500/10 text-blue-300 p-2.5 rounded-xl mt-0.5 shrink-0 hidden sm:block border border-blue-500/15">
                        <FileDown size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight font-display">Butuh Sertifikat Hasil untuk Pendaftaran Sekolah?</h4>
                        <p className="text-[10px] text-white/60 mt-1 max-w-sm leading-relaxed">
                          Anda dapat mengunduh dokumen resmi hasil asesmen dengan tanda tangan panitia dan kepala sekolah sebagai bukti kompetensi yang valid.
                        </p>
                      </div>
                    </div>
                    {getStudentPdfUrl(selectedStudent) ? (
                      <a
                        href={getStudentPdfUrl(selectedStudent)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center justify-center space-x-2 shrink-0 shadow-lg text-center"
                      >
                        <FileDown size={15} />
                        <span>UNDUH PDF</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => downloadPDF(selectedStudent)}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center justify-center space-x-2 shrink-0 shadow-lg"
                      >
                        <FileDown size={15} />
                        <span>UNDUH PDF</span>
                      </button>
                    )}
                  </div>

                  {/* Core info Footer box */}
                  <div className="text-center py-4 text-[10px] text-white/40 leading-normal border-t border-white/5">
                    <p>Sistem Hasil Seleksi TKA & TKAD MUHIPA © 2026. Seluruh hak cipta dilindungi.</p>
                    <p className="mt-0.5 font-mono">Kode Keamanan Sertifikat: ID-{selectedStudent.NISN}-SEC</p>
                  </div>

                </motion.div>
              )
            )}

          </AnimatePresence>
        )}

      </main>
    </div>
  );
}
