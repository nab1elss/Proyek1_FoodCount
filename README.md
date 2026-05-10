# 🍳 FoodCount - Sistem Manajemen Operasional UMKM Sarapan
> **"Integrasi Pencatatan Penjualan dan Pengelolaan Stok Berbasis Web untuk Efisiensi Bisnis UMKM"**

FoodCount adalah platform manajemen operasional yang dirancang khusus untuk pelaku usaha UMKM kuliner sarapan. Aplikasi ini mengedepankan aspek fungsionalitas dan kemudahan operasional melalui antarmuka yang intuitif. Menggunakan skema desain **Classic Luxury**, FoodCount bertujuan meningkatkan profesionalisme manajemen keuangan dan inventaris pada sektor usaha mikro.

---

## 🚀 Fitur Utama
- **Antarmuka Kasir Intuitif (User-Centric POS):** Desain tombol navigasi menu berukuran besar untuk mendukung kecepatan transaksi di jam sibuk.
- **Manajemen Inventaris Real-Time:** Fitur input alokasi stok harian dan pemantauan sisa produk secara otomatis.
- **Dashboard Analitik Eksekutif:** Visualisasi performa penjualan dan laba bersih harian menggunakan grafik yang informatif.
- **otomasi Kalkulasi Profitabilitas:** Perhitungan laba bersih secara akurat berdasarkan selisih Harga Jual dan Harga Pokok Penjualan (HPP).

---

## 🛠️ Tech Stack

### Frontend (User Interface)
- **Framework:** Antigravity (Skeleton)
- **Logic Helper:** [Croot.js](https://github.com/jscroot)
- **Styling:** Tailwind CSS (Luxury Light Theme)
- **Data Visualization:** Chart.js

### Backend (Server & Database)
- **Language:** Golang (Go)
- **Core Engine:** [Gocroot](https://github.com/gocroot)
- **Database:** MongoDB

---

## 📁 Struktur Folder Project
```text
Proyek1_FoodCount/
├── foodcount-frontend/   # Arsitektur Frontend & Croot.js Logic
│   ├── js/controller/    # Logic Controller Aplikasi
│   ├── index.html        # Halaman Point of Sale (POS)
│   └── stok.html         # Halaman Manajemen Inventaris
└── foodcount-backend/    # Arsitektur Backend API (Golang)
    ├── run/              # Entry point server (localhost:3000)
    └── controller/       # API Endpoint & Business Logic