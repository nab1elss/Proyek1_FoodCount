// =====================================================
// dashboard.js — Controller Dashboard FoodCount
// Halaman: dashboard.html
// Integrasi: Croot.js get() → Gocroot API localhost:3000
// =====================================================

// Import fungsi Croot.js yang dibutuhkan untuk dashboard
import { get, setInner } from "https://cdn.jsdelivr.net/gh/jscroot/jarak@0.0.1/croot.js";

// =====================================================
// DATA FALLBACK (DUMMY)
// Dipakai saat backend Gocroot belum aktif / tidak tersedia
// Data ini mensimulasikan respons dari endpoint /dashboard
// =====================================================
const DATA_DUMMY = {
  // Statistik hari ini
  omzetHariIni: 345000,
  keuntunganHariIni: 152000,
  porsiTerjual: 27,
  jumlahTransaksi: 18,

  // Data 7 hari terakhir untuk Line Chart
  grafikMingguan: {
    labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    omzet: [210000, 285000, 175000, 320000, 295000, 410000, 345000],
    untung: [92000, 125000, 76000, 141000, 130000, 181000, 152000],
  },

  // Rincian penjualan per produk
  perMenu: [
    { nama: "Nasgor DU",      emoji: "🍳", terjual: 12, omzet: 120000, untung: 60000 },
    { nama: "Mie Ayam",       emoji: "🍜", terjual: 9,  omzet: 108000, untung: 54000 },
    { nama: "Ayam Teriyaki",  emoji: "🍱", terjual: 6,  omzet: 90000,  untung: 42000 },
  ],
};

// =====================================================
// FUNGSI: tampilkanTanggal
// Menampilkan tanggal hari ini dalam format Indonesia
// =====================================================
function tampilkanTanggal() {
  const opsi = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const tanggal = new Date().toLocaleDateString("id-ID", opsi); // Format lokal Indonesia
  setInner("tanggal-hari-ini", `📅 ${tanggal}`);
}

// =====================================================
// FUNGSI: renderKartuStatistik
// Mengisi 3 kartu statistik utama dengan data dari API/dummy
// Parameter: data — objek dengan omzetHariIni, keuntunganHariIni, porsiTerjual
// =====================================================
function renderKartuStatistik(data) {
  // Format angka ke Rupiah Indonesia
  const formatRp = (angka) => `Rp ${angka.toLocaleString("id-ID")}`;

  // Hitung margin keuntungan (dalam persen)
  const margin = data.omzetHariIni > 0
    ? ((data.keuntunganHariIni / data.omzetHariIni) * 100).toFixed(1)
    : 0;

  // Update kartu Total Omzet
  setInner("stat-omzet", formatRp(data.omzetHariIni));
  setInner("stat-omzet-trend", `↑ Dari ${data.jumlahTransaksi} transaksi selesai`);

  // Update kartu Keuntungan Bersih (Emerald)
  setInner("stat-untung", formatRp(data.keuntunganHariIni));
  setInner("stat-margin", `Margin: ${margin}% dari omzet`);

  // Update kartu Porsi Terjual
  setInner("stat-porsi", data.porsiTerjual.toString());
  setInner("stat-transaksi", `${data.jumlahTransaksi} transaksi selesai`);
}

// =====================================================
// FUNGSI: renderGrafikPenjualan
// Membuat Line Chart menggunakan Chart.js
// Menampilkan omzet dan keuntungan 7 hari terakhir
// Parameter: dataGrafik — { labels, omzet, untung }
// =====================================================
function renderGrafikPenjualan(dataGrafik) {
  const canvas = document.getElementById("grafik-penjualan");
  if (!canvas) return; // Guard: canvas tidak ditemukan

  const ctx = canvas.getContext("2d");

  // Buat gradient untuk area bawah garis omzet (efek premium)
  const gradientOmzet = ctx.createLinearGradient(0, 0, 0, 256);
  gradientOmzet.addColorStop(0, "rgba(201, 168, 76, 0.3)");   // Gold transparan atas
  gradientOmzet.addColorStop(1, "rgba(201, 168, 76, 0.0)");   // Transparan penuh bawah

  // Buat gradient untuk area bawah garis keuntungan
  const gradientUntung = ctx.createLinearGradient(0, 0, 0, 256);
  gradientUntung.addColorStop(0, "rgba(5, 150, 105, 0.3)");   // Emerald transparan atas
  gradientUntung.addColorStop(1, "rgba(5, 150, 105, 0.0)");   // Transparan penuh bawah

  // Inisialisasi Chart.js Line Chart
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dataGrafik.labels, // Label hari (Sen, Sel, dst)
      datasets: [
        {
          // Dataset 1: Garis Omzet (Gold)
          label: "Omzet",
          data: dataGrafik.omzet,
          borderColor: "#C9A84C",           // Warna garis Gold
          backgroundColor: gradientOmzet,    // Area gradient bawah garis
          borderWidth: 2.5,
          pointBackgroundColor: "#C9A84C",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,                     // Kurva halus (bukan garis lurus kaku)
          fill: true,                       // Isi area di bawah garis
        },
        {
          // Dataset 2: Garis Keuntungan (Emerald)
          label: "Keuntungan",
          data: dataGrafik.untung,
          borderColor: "#059669",
          backgroundColor: gradientUntung,
          borderWidth: 2.5,
          pointBackgroundColor: "#059669",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Kontrol tinggi manual via CSS
      plugins: {
        legend: { display: false }, // Legenda sudah dibuat manual di HTML
        tooltip: {
          // Kustomisasi tooltip agar sesuai tema navy
          backgroundColor: "#1A2F45",
          titleColor: "#C9A84C",
          bodyColor: "#ffffff",
          borderColor: "#C9A84C",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            // Format nilai tooltip ke Rupiah
            label: (ctx) => `${ctx.dataset.label}: Rp ${ctx.raw.toLocaleString("id-ID")}`,
          },
        },
      },
      scales: {
        x: {
          // Sumbu X — nama hari
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#9CA3AF", font: { size: 12 } },
        },
        y: {
          // Sumbu Y — nilai Rupiah
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "#9CA3AF",
            font: { size: 11 },
            // Format angka di sumbu Y (singkat: 200k, 300k)
            callback: (val) => `${(val / 1000).toFixed(0)}k`,
          },
        },
      },
    },
  });
}

// =====================================================
// FUNGSI: renderTabelProduk
// Menampilkan tabel performa penjualan per menu
// Parameter: dataMenu — array { nama, emoji, terjual, omzet, untung }
// =====================================================
function renderTabelProduk(dataMenu) {
  const formatRp = (angka) => `Rp ${angka.toLocaleString("id-ID")}`;

  // Buat baris tabel untuk setiap produk
  const barisTabel = dataMenu.map((produk, index) => {
    // Warna latar baris bergantian untuk keterbacaan
    const warnaLatar = index % 2 === 0 ? "bg-navy" : "bg-navy-light";

    return `
      <tr class="${warnaLatar} border-b border-gray-800 hover:bg-navy-light transition-colors">
        <!-- Kolom: Nama Produk -->
        <td class="p-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${produk.emoji}</span>
            <span class="font-bold text-white">${produk.nama}</span>
          </div>
        </td>
        <!-- Kolom: Jumlah Porsi Terjual -->
        <td class="p-4 text-right">
          <span class="font-bold text-white">${produk.terjual}</span>
          <span class="text-gray-400 text-xs ml-1">porsi</span>
        </td>
        <!-- Kolom: Omzet -->
        <td class="p-4 text-right font-mono text-gold font-bold">
          ${formatRp(produk.omzet)}
        </td>
        <!-- Kolom: Keuntungan (Emerald Green) -->
        <td class="p-4 text-right font-mono text-emerald-400 font-bold">
          ${formatRp(produk.untung)}
        </td>
      </tr>
    `;
  }).join(""); // Gabungkan semua baris menjadi satu string HTML

  setInner("tabel-produk", barisTabel); // Masukkan ke tabel di HTML
}

// =====================================================
// FUNGSI UTAMA: muatDashboard
// Mengambil data dari backend Gocroot via Croot.js get()
// Endpoint: GET localhost:3000/dashboard
// Jika backend tidak tersedia, pakai data dummy sebagai fallback
// =====================================================
function muatDashboard() {
  // Coba ambil data dari backend Gocroot
  get(
    "http://localhost:3000/dashboard", // URL endpoint Gocroot
    {},                                  // Headers tambahan (kosong)
    function(response) {
      // ✅ Sukses: Backend tersedia, pakai data asli
      console.log("✅ Data dashboard dari backend:", response);

      // Render semua komponen dengan data dari backend
      renderKartuStatistik(response);
      renderGrafikPenjualan(response.grafikMingguan);
      renderTabelProduk(response.perMenu);
    },
    function(error) {
      // ⚠️ Gagal: Backend tidak tersedia, pakai data dummy
      console.warn("⚠️ Backend tidak tersedia, menampilkan data demo:", error);

      // Render dengan data dummy (fallback)
      renderKartuStatistik(DATA_DUMMY);
      renderGrafikPenjualan(DATA_DUMMY.grafikMingguan);
      renderTabelProduk(DATA_DUMMY.perMenu);
    }
  );
}

// =====================================================
// INISIALISASI DASHBOARD
// Dipanggil otomatis saat halaman pertama kali dibuka
// =====================================================
tampilkanTanggal();   // Tampilkan tanggal hari ini
muatDashboard();      // Muat semua data dashboard
