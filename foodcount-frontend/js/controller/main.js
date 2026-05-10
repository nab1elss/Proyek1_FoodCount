// =====================================================
// main.js — Controller Kasir FoodCount
// Halaman: index.html
//
// ALUR PEMBAYARAN (tanpa konfirmasi ekstra):
// ─────────────────────────────────────────
// Kasir tap menu → Tap "Bayar Tunai" ATAU "QRIS Masuk"
//    → Langsung: stok turun + transaksi tercatat + struk QR muncul
//
// CATATAN PENTING tentang QRIS:
//   Uang QRIS masuk ke GoPay/OVO/BCA kamu secara terpisah.
//   FoodCount TIDAK memproses uangnya — hanya MENCATAT.
//   Tap "QRIS Masuk" SETELAH kamu lihat notif di HP.
//   Untuk otomatis 100% tanpa tap → perlu Payment Gateway
//   (Midtrans/Xendit) yang kirim webhook ke backend Gocroot.
// =====================================================

import { onClick, setInner } from "https://cdn.jsdelivr.net/gh/jscroot/jarak@0.0.1/croot.js";

// =====================================================
// DATA MENU — Harga jual + HPP untuk kalkulasi untung
// =====================================================
const DAFTAR_MENU = {
  "btn-nasgor": { id: "nasgor-du",     nama: "Nasgor DU",    emoji: "🍳", hargaJual: 10000, hargaModal: 5000 },
  "btn-mie":    { id: "mie-ayam",      nama: "Mie Ayam",     emoji: "🍜", hargaJual: 12000, hargaModal: 6000 },
  "btn-ayam":   { id: "ayam-teriyaki", nama: "Ayam Teriyaki",emoji: "🍱", hargaJual: 15000, hargaModal: 8000 },
};

// State keranjang: { produkId: { ...produk, qty } }
let keranjang = {};

// =====================================================
// FUNGSI: buatNomorStruk
// Nomor unik transaksi berbasis waktu — FC-YYYYMMDD-HHMMSS
// =====================================================
function buatNomorStruk() {
  const now = new Date();
  const tgl = now.toISOString().slice(0, 10).replace(/-/g, "");
  const jam = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `FC-${tgl}-${jam}`;
}

// =====================================================
// FUNGSI: tambahKeKeranjang
// =====================================================
function tambahKeKeranjang(buttonId) {
  const produk = DAFTAR_MENU[buttonId];
  if (!produk) return;
  if (keranjang[produk.id]) {
    keranjang[produk.id].qty += 1;
  } else {
    keranjang[produk.id] = { ...produk, qty: 1 };
  }
  renderKeranjang();
}

// =====================================================
// FUNGSI: kurangiItem
// =====================================================
function kurangiItem(itemId) {
  if (!keranjang[itemId]) return;
  if (keranjang[itemId].qty > 1) {
    keranjang[itemId].qty -= 1;
  } else {
    delete keranjang[itemId];
  }
  renderKeranjang();
}

// =====================================================
// FUNGSI: hitungTotal
// =====================================================
function hitungTotal() {
  let totalHarga = 0, totalUntung = 0, totalItem = 0;
  Object.values(keranjang).forEach((item) => {
    totalHarga  += item.hargaJual * item.qty;
    totalUntung += (item.hargaJual - item.hargaModal) * item.qty;
    totalItem   += item.qty;
  });
  return { totalHarga, totalUntung, totalItem };
}

// =====================================================
// FUNGSI: renderKeranjang
// =====================================================
function renderKeranjang() {
  const items = Object.values(keranjang);
  const { totalHarga, totalUntung, totalItem } = hitungTotal();

  if (items.length === 0) {
    setInner("keranjang-list", `
      <div class="flex flex-col items-center justify-center h-36 text-gray-500">
        <span class="text-4xl mb-2">🍽️</span>
        <p class="text-sm">Belum ada pesanan</p>
      </div>`);
    setInner("total-harga", "Rp 0");
    setInner("total-untung", "Rp 0");
    setInner("info-jumlah", "0 item dalam keranjang");
    return;
  }

  // Render item keranjang
  let html = "";
  items.forEach((item) => {
    html += `
      <div class="cart-item flex items-center justify-between bg-navy-light rounded-xl p-3 gap-2">
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xl">${item.emoji}</span>
          <div>
            <p class="text-white font-bold text-sm">${item.nama}</p>
            <p class="text-gray-400 text-xs">Rp ${item.hargaJual.toLocaleString("id-ID")}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="kurangiGlobal('${item.id}')"
            class="w-7 h-7 bg-navy rounded-full text-gold font-black flex items-center justify-center border border-gray-600 hover:border-gold">−</button>
          <span class="text-white font-black w-4 text-center">${item.qty}</span>
          <button onclick="tambahGlobal('${item.id}')"
            class="w-7 h-7 bg-navy rounded-full text-gold font-black flex items-center justify-center border border-gray-600 hover:border-gold">+</button>
        </div>
        <span class="text-gold font-black text-sm font-mono min-w-[64px] text-right">
          Rp ${(item.hargaJual * item.qty).toLocaleString("id-ID")}
        </span>
      </div>`;
  });

  setInner("keranjang-list", html);
  setInner("total-harga", `Rp ${totalHarga.toLocaleString("id-ID")}`);
  setInner("total-untung", `Rp ${totalUntung.toLocaleString("id-ID")}`);
  setInner("info-jumlah", `${totalItem} item dalam keranjang`);
}

// Expose ke window untuk onclick inline di HTML dinamis
window.kurangiGlobal = (id) => kurangiItem(id);
window.tambahGlobal  = (id) => {
  if (keranjang[id]) { keranjang[id].qty += 1; renderKeranjang(); }
};

// =====================================================
// FUNGSI UTAMA: prosesBayar
// ─────────────────────────────────────────────────────
// Dipanggil LANGSUNG saat tap "Bayar Tunai" atau "QRIS Masuk"
// Tidak ada langkah konfirmasi ekstra — 1 tap = selesai
//
// Yang terjadi otomatis:
//   1. Transaksi POST ke backend Gocroot → stok turun di DB
//   2. Struk QR Digital di-generate
//   3. Modal struk muncul
//   4. Keranjang di-reset kosong
// =====================================================
function prosesBayar(metode) {
  const { totalHarga, totalUntung, totalItem } = hitungTotal();

  // Validasi keranjang tidak kosong
  if (totalItem === 0) {
    alert("Keranjang masih kosong, Mak! 😊");
    return;
  }

  const nomorStruk = buatNomorStruk();
  const waktuSekarang = new Date().toISOString();

  // Payload lengkap untuk backend Gocroot
  const payload = {
    nomorStruk,
    metode,           // "tunai" atau "qris"
    items: Object.values(keranjang).map((item) => ({
      id:         item.id,
      nama:       item.nama,
      qty:        item.qty,
      hargaJual:  item.hargaJual,
      hargaModal: item.hargaModal,
      subtotal:   item.hargaJual * item.qty,
      keuntungan: (item.hargaJual - item.hargaModal) * item.qty,
    })),
    totalHarga,
    totalKeuntungan: totalUntung,
    waktu: waktuSekarang,
  };

  // ─────────────────────────────────────────────
  // POST ke backend Gocroot (localhost:3000)
  // Backend OTOMATIS kurangi stok tiap produk terjual
  // Endpoint yang dibutuhkan: POST /transaksi
  // ─────────────────────────────────────────────
  fetch("http://localhost:3000/transaksi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => console.log("✅ Tercatat di backend, stok turun:", data))
    .catch((err) => {
      // Backend tidak aktif → simpan sementara di localStorage
      // sebagai antrian yang bisa di-sync nanti
      console.warn("⚠️ Backend offline, simpan lokal:", err);
      simpanAntrian(payload);
    });

  // Tampilkan struk QR LANGSUNG — tidak menunggu respons backend
  tampilkanStrukQR(nomorStruk, metode, totalHarga, totalUntung, payload);

  // Reset keranjang setelah bayar
  keranjang = {};
  renderKeranjang();
}

// =====================================================
// FUNGSI: simpanAntrian
// Simpan transaksi offline ke localStorage
// Bisa di-sync ke backend saat koneksi kembali
// =====================================================
function simpanAntrian(payload) {
  const antrian = JSON.parse(localStorage.getItem("foodcount_antrian") || "[]");
  antrian.push(payload);
  localStorage.setItem("foodcount_antrian", JSON.stringify(antrian));
  console.log(`📥 ${antrian.length} transaksi menunggu sinkronisasi`);
}

// =====================================================
// FUNGSI KALKULATOR KEMBALIAN
// Hanya aktif saat metode bayar = tunai
// =====================================================

// Simpan total transaksi aktif untuk kalkulasi kembalian
let totalAktif = 0;

// Isi input uang dengan nominal cepat (tap tombol 5rb, 10rb, dst)
window.setNominal = function(nominal) {
  const input = document.getElementById("input-uang-diterima");
  input.value = nominal; // Isi input dengan nominal yang dipilih
  hitungKembalian();     // Langsung hitung kembalian
};

// Hitung kembalian = uang diterima - total belanja
window.hitungKembalian = function() {
  const uangDiterima = parseInt(document.getElementById("input-uang-diterima").value, 10) || 0;
  const hasilEl  = document.getElementById("hasil-kembalian");
  const pesanEl  = document.getElementById("pesan-kurang");

  if (uangDiterima <= 0) {
    // Belum diisi
    hasilEl.textContent = "—";
    hasilEl.className = "font-black text-2xl font-mono text-navy";
    pesanEl.classList.add("hidden");
    return;
  }

  const kembalian = uangDiterima - totalAktif;

  if (kembalian < 0) {
    // Uang kurang — tampilkan peringatan Amber (BUKAN merah)
    hasilEl.textContent = `Kurang Rp ${Math.abs(kembalian).toLocaleString("id-ID")}`;
    hasilEl.className = "font-black text-lg font-mono text-amber";
    pesanEl.classList.remove("hidden");
  } else if (kembalian === 0) {
    // Pas!
    hasilEl.textContent = "PAS ✓";
    hasilEl.className = "font-black text-2xl font-mono text-emerald-600";
    pesanEl.classList.add("hidden");
  } else {
    // Kembalikan sekian
    hasilEl.textContent = `Rp ${kembalian.toLocaleString("id-ID")}`;
    hasilEl.className = "font-black text-2xl font-mono text-navy";
    pesanEl.classList.add("hidden");
  }
};

// Reset kalkulator kembalian (dipanggil saat modal ditutup)
function resetKembalian() {
  const input = document.getElementById("input-uang-diterima");
  if (input) input.value = "";
  const hasilEl = document.getElementById("hasil-kembalian");
  if (hasilEl) hasilEl.textContent = "—";
  const pesanEl = document.getElementById("pesan-kurang");
  if (pesanEl) pesanEl.classList.add("hidden");
}

// Generate QR struk digital menggunakan QRCode.js
//
// Isi QR = teks rincian struk (bisa dibaca tanpa internet)
// Pelanggan scan → lihat rincian di HP mereka
// =====================================================
function tampilkanStrukQR(nomorStruk, metode, totalHarga, totalUntung, payload) {
  // ── Kalkulator kembalian ──────────────────────────
  // Simpan total aktif agar hitungKembalian() bisa pakai
  totalAktif = totalHarga;

  // Tampilkan kalkulator kembalian HANYA untuk bayar tunai
  const boxKembalian = document.getElementById("box-kembalian");
  if (metode === "tunai") {
    boxKembalian.classList.remove("hidden"); // Tampil untuk tunai
    resetKembalian();                        // Reset dari transaksi sebelumnya
  } else {
    boxKembalian.classList.add("hidden");    // Sembunyikan untuk QRIS
  }
  // ──────────────────────────────────────────────────

  const labelMetode = metode === "qris"
    ? "via QRIS (GoPay / OVO / BCA)"
    : "via Bayar Tunai";

  const waktuLabel = new Date().toLocaleString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  setInner("struk-metode", labelMetode);
  setInner("struk-total", `Rp ${totalHarga.toLocaleString("id-ID")}`);
  setInner("struk-untung", `Rp ${totalUntung.toLocaleString("id-ID")}`);
  setInner("struk-nomor", `No. ${nomorStruk}`);

  // Teks struk di-encode ke QR — terbaca kamera HP tanpa internet
  let teksQR = `===== STRUK FOODCOUNT =====\n`;
  teksQR    += `No: ${nomorStruk}\n`;
  teksQR    += `${waktuLabel}\n`;
  teksQR    += `${labelMetode}\n`;
  teksQR    += `---------------------------\n`;
  payload.items.forEach((item) => {
    teksQR  += `${item.nama}\n`;
    teksQR  += `  ${item.qty}x Rp ${item.hargaJual.toLocaleString("id-ID")}`;
    teksQR  += ` = Rp ${item.subtotal.toLocaleString("id-ID")}\n`;
  });
  teksQR    += `---------------------------\n`;
  teksQR    += `TOTAL: Rp ${totalHarga.toLocaleString("id-ID")}\n`;
  teksQR    += `===========================\n`;
  teksQR    += `Terima kasih! ❤️\nFoodCount - Sarapan Enak`;

  // Generate QR baru (hapus QR lama dulu)
  const container = document.getElementById("qr-struk-container");
  container.innerHTML = "";
  new QRCode(container, {
    text: teksQR,
    width: 176,
    height: 176,
    colorDark: "#0D1B2A",
    colorLight: "#F8F4EF",
    correctLevel: QRCode.CorrectLevel.M,
  });

  // Tampilkan modal struk
  const modal = document.getElementById("modal-struk");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// =====================================================
// FUNGSI: setupUploadQRIS
// Upload foto QRIS permanen → simpan di localStorage
// =====================================================
function setupUploadQRIS() {
  const input = document.getElementById("upload-qris");

  // Load QRIS tersimpan dari sesi sebelumnya
  const tersimpan = localStorage.getItem("foodcount_qris_image");
  if (tersimpan) tampilkanFotoQRIS(tersimpan);

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem("foodcount_qris_image", ev.target.result);
      tampilkanFotoQRIS(ev.target.result);
    };
    reader.readAsDataURL(file);
  });
}

function tampilkanFotoQRIS(dataUrl) {
  const kotak = document.getElementById("qris-permanen-box");
  kotak.innerHTML = `
    <img src="${dataUrl}" alt="QRIS FoodCount"
      class="w-full h-full object-contain rounded-xl p-1"
      onclick="document.getElementById('upload-qris').click()"
      title="Tap untuk ganti QRIS">`;
  kotak.classList.remove("qris-pulse");
}

// =====================================================
// EVENT LISTENERS
// =====================================================

// Tombol menu — tambah ke keranjang
onClick("btn-nasgor", () => tambahKeKeranjang("btn-nasgor"));
onClick("btn-mie",    () => tambahKeKeranjang("btn-mie"));
onClick("btn-ayam",   () => tambahKeKeranjang("btn-ayam"));

// Bayar Tunai — 1 tap, langsung proses, stok turun otomatis
onClick("btn-bayar-tunai", () => prosesBayar("tunai"));

// QRIS Masuk — tap setelah lihat notif GoPay di HP
// Stok turun otomatis, struk QR langsung muncul
onClick("btn-bayar-qris", () => prosesBayar("qris"));

// Kosongkan keranjang
onClick("btn-kosongkan", () => { keranjang = {}; renderKeranjang(); });

// Tutup modal struk → siap transaksi berikutnya
onClick("btn-transaksi-baru", () => {
  document.getElementById("modal-struk").classList.add("hidden");
  document.getElementById("modal-struk").classList.remove("flex");
});

// =====================================================
// INISIALISASI
// =====================================================
renderKeranjang();
setupUploadQRIS();
