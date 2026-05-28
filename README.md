# 🎓 Portal Pengumuman Hasil Asesmen SMP Muhammadiyah Pakem (TKA & TKAD)

A modern, highly polished, and responsive full-stack web application designed for students and parents to securely view assessment scores, verify achievements (Seed verification system), and download official PDF certificates for **Asesmen TKA & TKAD SMP Muhammadiyah Pakem**.

The codebase is fully equipped with both a frontend client (built with **React 19**, **TypeScript**, and **Tailwind CSS v4**) and an integrated **Express** backend proxy server for secure, live database loading and caching from Google Sheets.

---

## ✨ Fitur Utama (Key Features)

- **Cari Nama**: Antarmuka autocomplete pencarian interaktif untuk menemukan nama siswa dengan aman tanpa memaparkan database lengkap ke peramban (client).
- **Verifikasi Tanggal Lahir & Seed**: Pemeriksaan verifikasi ganda yang aman untuk membuka rincian hasil nilai siswa.
- **Indeks Capaian Total**: Tampilan skor visual yang kaya dengan indikator radial nilai rata-rata, pengelompokan grade pencapaian berwarna yang halus (A, B, C, D), serta detail topik pelajaran (Matematika, IPA, Bahasa Indonesia, Bahasa Inggris).
- **Unduh Sertifikat Resmi (PDF)**: Generator berkas PDF ter-lokalisasi beresolusi tinggi dengan kop sekolah resmi, tanda tangan kepala sekolah digital, detail mata pelajaran lengkap, dan QR Code verifikasi.
- **Live Google Sheets Database**: Sinkronisasi database terpusat yang aman dengan Google Sheets, dilengkapi dengan fitur detokisifikasi data (data parsing) otomatis dan sistem cache server 2 menit untuk performa tinggi.

---

## 🛠️ Tech Stack & Arsitektur

### Backend & Middleware
- **Runtime**: Node.js (TypeScript)
- **Server Framework**: [Express](https://expressjs.com/)
- **Live Sync**: Integrasi Google Sheets CSV Export API
- **Bundler & Transpiler**: [esbuild](https://esbuild.github.io/) (compiles to unified `.cjs` server artifact) and [tsx](https://github.com/privatenumber/tsx)

### Frontend Client
- **UI library**: [React 19](https://react.dev/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (motion/react) for keyframes and state transitions
- **PDF Generation**: [jspdf](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

## 📦 Struktur Direktori Utama

```text
├── assets/                  # Aset statis lokal tambahan
├── src/
│   ├── assets/              # Aset media (Logo Sekolah, gambar latar)
│   ├── components/          # Komponen UI modular
│   ├── App.tsx              # Entry Point antarmuka utama aplikasi
│   ├── index.css            # Berkas CSS global & konfigurasi tema Tailwind CSS v4
│   ├── main.tsx             # Entry Point React client
│   ├── pdf-generator.ts     # Logika pembuatan berkas PDF sertifikat resmi
│   ├── types.ts             # Definisi tipe & interfaces TypeScript
│   ├── utils.ts             # Fungsi pembantu (date parsing, CSV mapping, helper warna)
│   └── vite-env.d.ts        # Deklarasi tipe lingkungan Vite
├── .gitignore               # Konfigurasi pengabaian file Git
├── index.html               # Entry Point HTML
├── package.json             # Manajer dependensi, skrip build & start
├── server.ts                # Server Express backend & Vite middleware handler
├── tsconfig.json            # Konfigurasi compiler TypeScript
└── vite.config.ts           # Konfigurasi bundler Vite
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi secara Lokal

Ikuti langkah-langkah di bawah ini untuk mengkloning, memasang dependensi, dan menjalankan aplikasi ini pada komputer Anda.

### 1. Prasyarat (Prerequisites)
Pastikan Anda telah memasang perangkat lunak berikut ini di komputer Anda:
- [Node.js](https://nodejs.org/) (Versi rekomendasi: LTS v18 atau v20+)
- [Git](https://git-scm.com/)

### 2. Kloning Repositori (Clone Repository)
Buka terminal Anda dan jalankan perintah berikut:
```bash
git clone <URL_REPOSITORI_GITHUB_ANDA>
cd <NAMA_DIREKTORI_REPOSITORI>
```

### 3. Pasang Dependensi (Install Dependencies)
Pasang seluruh library yang dideklarasikan di `package.json`:
```bash
npm install
```

### 4. Mode Pengembangan (Development Mode)
Jalankan aplikasi dalam mode pengembangan. Perintah ini akan menjalankan server Express dengan `tsx` yang secara otomatis meload Vite middleware pada port `3000`:
```bash
npm run dev
```
Setelah aplikasi menyala, buka browser Anda di `http://localhost:3000`.

### 5. Bangun untuk Produksi (Build for Production)
Untuk membundle dan mengompilasi berkas frontend dan server ke bentuk produksi yang ter-optimasi tinggi:
```bash
npm run build
```
Proses ini akan menghasilkan:
- Berkas aset static frontend web yang terkompresi di folder `dist/`
- Berkas server backend tunggal yang mandiri (unified CommonJS) di `dist/server.cjs`

### 6. Jalankan Server Produksi (Start Production Server)
Untuk menjalankan server produksi yang menggunakan berkas terkompilasi dari langkah sebelumnya:
```bash
npm run start
```
Aplikasi Anda akan siap melayani lalu lintas pengguna secara cepat dan aman di port `3000`.

---

## 🔒 Keamanan & Integrasi Live Database

Aplikasi ini menggunakan **Express API proxy** untuk membaca database hasil ujian dari Google Sheets. Hal ini sangat penting untuk memastikan:
1. **Keamanan Data**: Seluruh database siswa tidak dikirim secara penuh ke browser client. Pencarian diproses secara aman di level server (`/api/students/search`).
2. **Kinerja Maksimal**: Menggunakan caching memori berdurasi 2 menit agar server tidak terus-menerus menghubungi Google API pada setiap interaksi pencarian siswa, menghindari batas kuota API (rate limiting) dari Google.

## 🤝 Kontribusi

Jika Anda ingin berkontribusi:
1. Fork repositori ini.
2. Buat brench fitur baru (`git checkout -b fitur/nama-fitur`).
3. Komit perubahan Anda (`git commit -m 'Menambahkan fitur baru X'`).
4. Push ke branch baru (`git push origin fitur/nama-fitur`).
5. Buat Pull Request baru.

---

*Dikembangkan untuk memberikan transparansi hasil asesmen siswa yang cepat, andal, dan memikat di lingkungan pendidikan SMP Muhammadiyah Pakem.*
