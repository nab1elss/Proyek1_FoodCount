// =====================================================
// stok.js — Controller Manajemen Stok FoodCount
// Halaman: stok.html
// Integrasi: Croot.js get() + fetch POST → Gocroot API localhost:3000
// =====================================================

// Import fungsi Croot.js yang dibutuhkan
import { get, onClick, setInner } from "https://cdn.jsdelivr.net/gh/jscroot/jarak@0.0.1/croot.js";

// =====================================================
// STATE LOKAL: Daftar stok aktif
// Diisi dari backend atau fallback dummy
// Array of: { id, nama, emoji, hargaModal, hargaJual, stokAwal, sisaStok }
// =====================================================
let daftarStok = [];

// =====================================================
// DATA DUMMY FALLBACK
// Simulasi respons backend GET /stok
// Dipakai saat Gocroot belum aktif
// =====================================================
const DATA_STOK_DUMMY = [
  { id: "nasgor-du",     nama: "Nasgor DU",     emoji: "🍳", hargaModal: 5000, hargaJual: 10000, stokAwal: 35, sisaStok: 23 },
  { id: "mie-ayam",      nama: "Mie Ayam",       emoji: "🍜", hargaModal: 6000, hargaJual: 12000, stokAwal: 25, sisaStok: 4  },
  { id: "ayam-teriyaki", nama: "Ayam Teriyaki",  emoji: "🍱", hargaModal: 8000, hargaJual: 15000, stokAwal: 20, sisaStok: 0  },
];

// =====================================================
// FUNGSI: buatId
// Membuat ID unik dari nama produk
// Contoh: "Lontong Sayur" → "lontong-sayur"
// =====================================================
function buatId(nama) {
  return nama
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // Spasi jadi tanda hubung
    .replace(/[^a-z0-9-]/g, ""); // Hapus karakter selain huruf, angka, tanda hubung
}

// =====================================================
// FUNGSI: tebakEmoji
// Tebak emoji berdasarkan kata kunci dalam nama produk
// Membuat tampilan tabel lebih hidup untuk produk baru
// =====================================================
function tebakEmoji(nama) {
  const n = nama.toLowerCase();
  if (n.includes("nasi") || n.includes("nasgor") || n.includes("goreng")) return "🍳";
  if (n.includes("mie") || n.includes("mi") || n.includes("bakmi"))       return "🍜";
  if (n.includes("ayam") || n.includes("teriyaki"))                        return "🍗";
  if (n.includes("lontong") || n.includes("ketupat"))                      return "🍚";
  if (n.includes("soto") || n.includes("sup") || n.includes("bakso"))      return "🍲";
  if (n.includes("roti") || n.includes("toast") || n.includes("bread"))    return "🍞";
  if (n.includes("kopi") || n.includes("teh") || n.includes("es"))        return "🥤";
  if (n.includes("bubur") || n.includes("oatmeal"))                        return "🥣";
  if (n.includes("telur") || n.includes("egg"))                            return "🍳";
  return "🍱"; // Default emoji jika tidak cocok
}

// =====================================================
// FUNGSI: tampilkanTanggal
// Tampilkan tanggal hari ini di header halaman
// =====================================================
function tampilkanTanggal() {
  const opsi = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const tanggal = new Date().toLocaleDateString("id-ID", opsi); // Format lokal Indonesia
  setInner("tanggal-stok", `📅 ${tanggal}`);
}

// =====================================================
// FUNGSI: tentukanStatus
// Menentukan status stok berdasarkan sisa stok
// ATURAN: Amber/Orange untuk rendah — BUKAN merah
// Threshold: 0 = habis, < 5 = rendah, >= 5 = cukup
// =====================================================
function tentukanStatus(sisaStok) {
  if (sisaStok <= 0) {
    return { label: "Habis",           kelas: "badge-habis"  };
  } else if (sisaStok < 5) {
    return { label: "⚠️ Hampir Habis", kelas: "badge-rendah" }; // Amber, BUKAN merah
  } else {
    return { label: "✓ Cukup",         kelas: "badge-cukup"  }; // Emerald
  }
}

// =====================================================
// FUNGSI: hitungPersenStok
// Hitung persentase sisa stok dari stok awal
// Untuk progress bar visual
// =====================================================
function hitungPersenStok(sisaStok, stokAwal) {
  if (stokAwal <= 0) return 0; // Hindari pembagian dengan nol
  return Math.min(100, Math.round((sisaStok / stokAwal) * 100));
}

// =====================================================
// FUNGSI: warnaProgressBar
// Tentukan warna progress bar berdasarkan persentase sisa
// =====================================================
function warnaProgressBar(persen) {
  if (persen <= 0)  return "bg-gray-300"; // Habis → abu-abu netral
  if (persen < 30)  return "bg-amber";    // Kritis → Amber (peringatan)
  return "bg-emerald-600";                // Aman → Emerald hijau
}

// =====================================================
// FUNGSI: perbaruiDatalist
// Sinkronisasi <datalist> saran produk dengan data stok aktif
// Dipanggil setiap kali daftarStok berubah
// =====================================================
function perbaruiDatalist() {
  const datalist = document.getElementById("saran-produk");
  if (!datalist) return;

  // Buat option untuk setiap produk yang sudah ada di tabel stok
  const opsiSaran = daftarStok
    .map((produk) => `<option value="${produk.nama}">`)
    .join("");

  datalist.innerHTML = opsiSaran; // Ganti isi datalist dengan daftar produk terkini
}

// =====================================================
// FUNGSI: renderTabelStok
// Render tabel daftar produk lengkap dengan semua kolom
// Parameter: arrayProduk — array data stok produk
// =====================================================
function renderTabelStok(arrayProduk) {
  // Simpan ke state global agar bisa dipakai fungsi lain
  daftarStok = arrayProduk;

  const formatRp = (angka) => `Rp ${Number(angka).toLocaleString("id-ID")}`;

  // Jika tidak ada produk sama sekali, tampilkan pesan kosong
  if (arrayProduk.length === 0) {
    setInner("tabel-stok", `
      <tr>
        <td colspan="7" class="p-10 text-center text-gray-400">
          <div class="flex flex-col items-center gap-2">
            <span class="text-3xl">📦</span>
            <span>Belum ada produk. Tambahkan produk pertama di atas!</span>
          </div>
        </td>
      </tr>
    `);
    setInner("ringkasan-stok", "");
    perbaruiDatalist();
    return;
  }

  // Buat baris untuk setiap produk
  const semuaBaris = arrayProduk.map((produk, index) => {
    const status   = tentukanStatus(produk.sisaStok);
    const persen   = hitungPersenStok(produk.sisaStok, produk.stokAwal);
    const warnaBar = warnaProgressBar(persen);
    const delay    = `style="animation-delay: ${index * 0.07}s"`;

    return `
      <tr class="tabel-baris border-b border-cream-dark hover:bg-cream transition-colors" ${delay}>

        <!-- Kolom: Nama Produk -->
        <td class="p-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${produk.emoji || tebakEmoji(produk.nama)}</span>
            <div>
              <span class="font-black text-navy block">${produk.nama}</span>
              <span class="text-gray-400 text-xs">#${produk.id}</span>
            </div>
          </div>
        </td>

        <!-- Kolom: HPP -->
        <td class="p-4 text-right">
          <span class="font-mono text-gray-500 font-semibold text-sm">${formatRp(produk.hargaModal)}</span>
        </td>

        <!-- Kolom: Harga Jual -->
        <td class="p-4 text-right">
          <span class="font-mono text-emerald-600 font-bold">${formatRp(produk.hargaJual)}</span>
        </td>

        <!-- Kolom: Stok Awal -->
        <td class="p-4 text-right">
          <span class="font-black text-navy text-base">${produk.stokAwal}</span>
          <span class="text-gray-400 text-xs ml-1">porsi</span>
        </td>

        <!-- Kolom: Sisa Stok — warna tergantung status -->
        <td class="p-4 text-right">
          <span class="font-black text-base ${
            produk.sisaStok <= 0 ? 'text-gray-400' :
            produk.sisaStok < 5  ? 'text-amber font-black' : 'text-navy'
          }">
            ${produk.sisaStok}
          </span>
          <span class="text-gray-400 text-xs ml-1">porsi</span>
        </td>

        <!-- Kolom: Badge Status -->
        <td class="p-4 text-center">
          <span class="${status.kelas}">${status.label}</span>
        </td>

        <!-- Kolom: Progress Bar Visual -->
        <td class="p-4">
          <div class="w-full bg-gray-200 rounded-full h-2.5 min-w-[80px]">
            <div class="stok-bar ${warnaBar} h-2.5 rounded-full" style="width: ${persen}%"></div>
          </div>
          <p class="text-center text-xs text-gray-400 mt-1">${persen}%</p>
        </td>

      </tr>
    `;
  }).join(""); // Gabungkan semua baris menjadi satu HTML string

  setInner("tabel-stok", semuaBaris);  // Masukkan ke tabel
  renderRingkasanStok(arrayProduk);    // Update footer ringkasan
  perbaruiDatalist();                  // Sinkronisasi saran produk di input
}

// =====================================================
// FUNGSI: renderRingkasanStok
// Tampilkan ringkasan status stok di footer tabel
// =====================================================
function renderRingkasanStok(arrayProduk) {
  const cukup = arrayProduk.filter(p => p.sisaStok >= 5).length;
  const rendah = arrayProduk.filter(p => p.sisaStok > 0 && p.sisaStok < 5).length;
  const habis  = arrayProduk.filter(p => p.sisaStok <= 0).length;

  setInner("ringkasan-stok", `
    <span class="flex items-center gap-1">
      <span class="w-2 h-2 bg-emerald-600 rounded-full"></span>
      ${cukup} produk stok cukup
    </span>
    <span class="flex items-center gap-1">
      <span class="w-2 h-2 bg-amber rounded-full"></span>
      ${rendah} produk hampir habis
    </span>
    <span class="flex items-center gap-1">
      <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
      ${habis} produk stok habis
    </span>
    <span class="ml-auto text-navy font-bold">Total: ${arrayProduk.length} produk</span>
  `);
}

// =====================================================
// FUNGSI: muatDataStok
// Ambil data stok dari backend Gocroot via Croot.js get()
// Endpoint: GET localhost:3000/stok
// Fallback ke data dummy jika backend tidak tersedia
// =====================================================
function muatDataStok() {
  get(
    "http://localhost:3000/stok", // URL endpoint Gocroot
    {},                            // Headers tambahan
    function(response) {
      // ✅ Backend tersedia — render dengan data asli
      console.log("✅ Data stok dari backend:", response);
      renderTabelStok(Array.isArray(response) ? response : []);
    },
    function(error) {
      // ⚠️ Backend tidak tersedia — pakai data dummy
      console.warn("⚠️ Backend tidak tersedia, pakai data demo:", error);
      renderTabelStok(DATA_STOK_DUMMY);
    }
  );
}

// =====================================================
// FUNGSI: simpanStokAwal
// Dipanggil saat tombol "Simpan Stok" diklik
// Mendukung nama produk bebas (bukan hanya 3 produk)
// Produk baru otomatis ditambahkan ke tabel
// =====================================================
function simpanStokAwal() {
  // Ambil nilai dari semua input form
  const namaProduk  = document.getElementById("pilih-produk").value.trim();
  const jumlahStok  = parseInt(document.getElementById("input-stok").value, 10);
  const inputHpp    = document.getElementById("input-hpp").value;
  const inputHjual  = document.getElementById("input-harga-jual").value;

  // Validasi: nama produk wajib diisi
  if (!namaProduk) {
    tampilkanPesan("⚠️ Nama produk wajib diisi! Ketik atau pilih produk terlebih dahulu.", "amber");
    document.getElementById("pilih-produk").focus();
    return;
  }

  // Validasi: stok harus angka positif
  if (isNaN(jumlahStok) || jumlahStok < 0) {
    tampilkanPesan("⚠️ Masukkan jumlah stok yang valid (angka 0 atau lebih)!", "amber");
    document.getElementById("input-stok").focus();
    return;
  }

  // Buat ID dari nama produk (misalnya "Lontong Sayur" → "lontong-sayur")
  const produkId = buatId(namaProduk);

  // Cek apakah produk sudah ada di daftar atau ini produk baru
  const indexExisting = daftarStok.findIndex(p => p.id === produkId || p.nama.toLowerCase() === namaProduk.toLowerCase());
  const produkBaru = indexExisting === -1; // true jika ini produk baru

  // Siapkan payload untuk backend
  const payload = {
    id: produkId,
    nama: namaProduk,
    stokAwal: jumlahStok,
    sisaStok: jumlahStok, // Reset sisa = awal (pagi hari)
    hargaModal: inputHpp    ? parseInt(inputHpp, 10)   : (produkBaru ? 0 : daftarStok[indexExisting]?.hargaModal || 0),
    hargaJual:  inputHjual  ? parseInt(inputHjual, 10) : (produkBaru ? 0 : daftarStok[indexExisting]?.hargaJual  || 0),
    tanggal: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
    waktu: new Date().toISOString(),
  };

  // Kirim ke backend Gocroot via fetch
  fetch("http://localhost:3000/stok/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Stok tersimpan ke backend:", data);
      updateStokLokal(payload, indexExisting);
      tampilkanModalStok(namaProduk, jumlahStok, produkBaru);
    })
    .catch((err) => {
      // Backend tidak tersedia — update data lokal saja sebagai fallback
      console.warn("⚠️ Backend tidak tersedia, update lokal:", err);
      updateStokLokal(payload, indexExisting);
      tampilkanModalStok(namaProduk, jumlahStok, produkBaru);
    });

  // Reset semua field form
  document.getElementById("pilih-produk").value   = "";
  document.getElementById("input-stok").value     = "";
  document.getElementById("input-hpp").value      = "";
  document.getElementById("input-harga-jual").value = "";
}

// =====================================================
// FUNGSI: updateStokLokal
// Update atau tambahkan produk ke state daftarStok lokal
// Dipanggil setelah simpan berhasil (baik online maupun offline)
// =====================================================
function updateStokLokal(payload, indexExisting) {
  if (indexExisting !== -1) {
    // Produk sudah ada — update data yang relevan
    daftarStok[indexExisting].stokAwal  = payload.stokAwal;
    daftarStok[indexExisting].sisaStok  = payload.sisaStok;
    // Update HPP & harga jual hanya jika diisi
    if (payload.hargaModal) daftarStok[indexExisting].hargaModal = payload.hargaModal;
    if (payload.hargaJual)  daftarStok[indexExisting].hargaJual  = payload.hargaJual;
  } else {
    // Produk baru — tambahkan ke daftar dengan emoji otomatis
    daftarStok.push({
      ...payload,
      emoji: tebakEmoji(payload.nama), // Tebak emoji dari nama
    });
  }

  renderTabelStok(daftarStok); // Re-render tabel dengan data terbaru
}

// =====================================================
// FUNGSI: tampilkanPesan
// Tampilkan notifikasi di bawah form
// warna: "amber" = peringatan, "emerald" = sukses
// =====================================================
function tampilkanPesan(teks, warna) {
  const pesanDiv = document.getElementById("pesan-stok");

  const kelasWarna = warna === "emerald"
    ? "bg-green-50 text-emerald-800 border border-emerald-200"
    : "bg-yellow-50 text-yellow-800 border border-yellow-300"; // Amber — BUKAN merah

  pesanDiv.className = `mt-4 p-4 rounded-xl font-semibold text-sm ${kelasWarna}`;
  setInner("pesan-stok", teks);
  pesanDiv.classList.remove("hidden");

  // Sembunyikan otomatis setelah 3 detik
  setTimeout(() => pesanDiv.classList.add("hidden"), 3000);
}

// =====================================================
// FUNGSI: tampilkanModalStok
// Tampilkan modal konfirmasi simpan stok
// =====================================================
function tampilkanModalStok(namaProduk, jumlahStok, produkBaru) {
  const statusTeks = produkBaru
    ? `Produk baru <strong>${namaProduk}</strong> ditambahkan dengan stok awal <strong>${jumlahStok} porsi</strong>.`
    : `Stok awal <strong>${namaProduk}</strong> diperbarui menjadi <strong>${jumlahStok} porsi</strong>.`;

  setInner("modal-stok-detail", statusTeks);

  const modal = document.getElementById("modal-stok");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// =====================================================
// EVENT LISTENERS — Menggunakan Croot.js onClick
// =====================================================

// Tombol Simpan Stok
onClick("btn-simpan-stok", simpanStokAwal);

// Tombol Refresh — Muat ulang data dari backend
onClick("btn-refresh-stok", () => {
  setInner("tabel-stok", `
    <tr>
      <td colspan="7" class="p-10 text-center text-gray-400">
        <div class="flex flex-col items-center gap-2">
          <span class="text-3xl">🔄</span>
          <span>Memuat ulang data...</span>
        </div>
      </td>
    </tr>
  `);
  setTimeout(muatDataStok, 500); // Delay kecil agar loading terasa
});

// Tombol tutup modal stok
onClick("btn-tutup-modal-stok", () => {
  const modal = document.getElementById("modal-stok");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
});

// =====================================================
// INISIALISASI HALAMAN STOK
// =====================================================
tampilkanTanggal(); // Tampilkan tanggal hari ini
muatDataStok();     // Muat data stok dari backend / dummy
