# OmniHub - Single Page Interactive Web Suite

Proyek Studi Kasus Praktikum 3 - Pemrograman Aplikasi Web (PABWE)

## 📌 Deskripsi Proyek
**OmniHub** adalah aplikasi web interaktif satu halaman (*Single Page Application*) yang dibangun menggunakan **HTML5, CSS (Tailwind CSS CDN), dan Vanilla JavaScript**. Aplikasi ini mengintegrasikan 3 fitur utama berbasis sistem navigasi tab dan penyimpanan persisten di peramban pengguna (*LocalStorage*).

---

## 🚀 Fitur-Fitur Utama

### 1. 💰 Catatan Pengeluaran Harian (Expense Tracker)
- **Ringkasan Keuangan**: Menampilkan saldo akhir, total pemasukan, dan total pengeluaran secara *real-time*.
- **Manajemen Transaksi (CRUD)**: Menambah, mengubah, dan menghapus catatan transaksi via Modal interaktif.
- **Pencarian & Filter**: Cari transaksi berdasarkan nama/deskripsi, filter berdasarkan tipe (*Pemasukan* / *Pengeluaran*) dan kategori.
- **Pengurutan (Sorting)**: Urutkan data berdasarkan tanggal terbaru/terlama atau jumlah terbesar/terkecil.
- **Validasi Input**: Menjamin nilai jumlah lebih besar dari 0 dan field wajib terisi.

### 2. 🔖 Kelola Bookmark & Link Manager
- **Penyimpanan Tautan**: Simpan link web favorit lengkap dengan nama, URL, kategori, dan catatan singkat.
- **Validasi URL**: Memastikan URL diawali dengan `http://` atau `https://`.
- **Akses Langsung**: Klik tautan untuk membuka situs di tab baru dengan atribut keamanan `target="_blank" rel="noopener noreferrer"`.
- **Manajemen & Filter (CRUD)**: Ubah/Hapus data via modal, cari berdasarkan nama/URL, dan urutkan A-Z / Z-A / Terbaru.

### 3. 🎮 Kuis Interaktif (Quiz App)
- **Berbasis Data JavaScript**: Soal disimpan dalam struktur *Array of Object* di `assets/script.js`.
- **Navigasi & Feedback**: Menampilkan pertanyaan, 4 pilihan ganda, umpan balik langsung (*correct/incorrect* beserta penjelasan), serta progress bar.
- **Skor & Rekor Terbaik (*High Score*)**: Menyimpan skor tertinggi secara otomatis di `localStorage` peramban.

### 4. 🗂️ Integrasi Navigasi Tab & Persistensi
- Tab terintegrasi dalam 1 halaman tanpa reload.
- Mengingat tab terakhir yang dibuka pengguna saat halaman dimuat ulang.
- Penggunaan *LocalStorage Key* terpisah untuk setiap fitur agar data tidak saling menimpa (`omnihub_active_tab`, `omnihub_expenses_data`, `omnihub_bookmarks_data`, `omnihub_quiz_highscore`).

---

## 📁 Struktur Direktori
```
ifs24036-pabwe-p3/
│
├── index.html          # Markup utama (Header, Tabs, 3 Panel, Modal & Toast)
├── assets/
│   └── script.js       # Logika utama JavaScript & LocalStorage
└── README.md           # Dokumentasi & panduan proyek
```

---

## 🛠️ Teknologi & Libs
- **HTML5** (Elemen semantik: `header`, `nav`, `main`, `section`, `footer`)
- **Tailwind CSS (CDN)** (Styling & layout responsif)
- **FontAwesome 6.5.1** (Icon set)
- **Vanilla JavaScript (ES6+)** (DOM Manipulation, Event Handling, LocalStorage)
