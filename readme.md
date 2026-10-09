# Breakpoint Inconsistency Detection Tools

Aplikasi Web Pemeriksa Konsistensi Desain Antarmuka Responsif pada Berbagai Breakpoint.  
*Proyek Tugas Akhir Skripsi - Program Studi Informatika, Universitas Kristen Duta Wacana (UKDW)*  
**Author**: [@theodhorex](https://github.com/theodhorex) (Aurelio Theodhore Riyanto)

---

## 🚀 Fitur Prototype Saat Ini

1. **Multi-Viewport Headless Crawler**: Menggunakan Playwright Chromium untuk me-render antarmuka pada breakpoint 320px, 768px, 1024px, dan 1440px secara otomatis.
2. **Computed Style & Geometry Extractor**: Mengekstraksi properti CSS (`fontSize`, `lineHeight`, `margin`, `padding`, `display`, `position`) dan geometri (`getBoundingClientRect`, `scrollWidth`, `clientWidth`).
3. **Element Matcher**: Menyelaraskan elemen yang identik lintas breakpoint menggunakan ID dan *Normalized DOM Path*.
4. **Rule-Based Inconsistency Detector**:
   - **Overflow & Reflow (WCAG 2.1 1.4.10)**: Deteksi horizontal scrollbar pada 320px dan tumpahan elemen di luar viewport.
   - **Tipografi**: Deteksi inversi hierarki heading (H2 > H1), *line-height collapse* (teks tumpang tindih), inversi skala font, dan teks terlalu kecil (< 12px) di ponsel.
   - **Jarak**: Deteksi *fixed margin inflation trap* (> 25% lebar layar ponsel) dan anomali margin/padding.
5. **Dual Reporting**: Menghasilkan ringkasan laporan di terminal (CLI) serta berkas interaktif `report.html` dan data terstruktur `report.json`.

---

## 🛠️ Cara Menjalankan Prototype

### 1. Menjalankan Audit pada Halaman Demo Uji
Jalankan perintah berikut untuk menguji halaman demo bawaan yang telah disuntikkan cacat responsif:

```bash
npm run audit:demo
```

### 2. Menguji Berkas HTML Lokal Sendiri
```bash
npm start -- --file path/ke/halaman.html
```

### 3. Menguji URL Publik / Lokal yang Sedang Berjalan
```bash
npm start -- --url https://example.com
```

### 4. Menentukan Breakpoint Kustom
```bash
npm start -- --url https://example.com --breakpoints 320,640,1024,1280
```

---

## 📊 Hasil Laporan

Setelah audit selesai, dua berkas laporan akan otomatis dibuat di root proyek:
- `report.html`: Buka di browser untuk melihat tampilan visual kartu temuan, perbandingan tabel nilai properti CSS per breakpoint, dan rekomendasi perbaikan.
- `report.json`: Data terstruktur mentah untuk keperluan analisis metrik dan integrasi lanjutan.
