import { onClick, setInner } from "https://cdn.jsdelivr.net/gh/jscroot/jarak@0.0.1/croot.js";

let keranjang = [];
let total = 0;

// Fungsi tambah item ke keranjang
function tambahKeKeranjang(nama, harga) {
  keranjang.push({ nama, harga });
  renderKeranjang();
}

// Fungsi tampilin daftar belanja
function renderKeranjang() {
  let listHtml = "";
  total = 0;

  keranjang.forEach((item) => {
    total += item.harga;
    listHtml += `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border-l-4 border-gold">
                <span class="font-bold text-navy">${item.nama}</span>
                <span class="text-navy font-mono">Rp ${item.harga.toLocaleString()}</span>
            </div>
        `;
  });

  if (keranjang.length > 0) {
    setInner("keranjang-list", listHtml);
  }
  setInner("total-harga", "Rp " + total.toLocaleString());
}

// Event Listener pake Croot.js (Gampang banget!)
onClick("btn-nasgor", () => tambahKeKeranjang("Nasgor DU", 10000));
onClick("btn-mie", () => tambahKeKeranjang("Mie Ayam", 12000));
onClick("btn-ayam", () => tambahKeKeranjang("Ayam Teriyaki", 15000));

onClick("btn-bayar", () => {
  if (total === 0) {
    alert("Keranjang masih kosong, Mak!");
  } else {
    alert("Transaksi Berhasil! Total: Rp " + total.toLocaleString());
    keranjang = [];
    setInner("total-harga", "Rp 0");
    setInner("keranjang-list", '<p class="text-gray-400 text-center mt-10">Belum ada pesanan</p>');
  }
});