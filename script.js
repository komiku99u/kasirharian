let editIndex = -1;
let products = JSON.parse(localStorage.getItem("products") || "[]");
let productIndex = {};
let cart = [];
let halamanProduk = 0;
const produkPerHalaman = 24;
let sudahBayar = false;

let editProdukIndex = -1;
function buildProductIndex() {
  productIndex = {};

  products.forEach((p, index) => {
    if (!p.barcode) return;

    productIndex[p.barcode] = {
      ...p,
      index,
    };
  });
}

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));

  buildProductIndex();
  console.log("Jumlah index:", Object.keys(productIndex).length);
}

function exportCSV() {
  let csv = "barcode,nama,harga\n";

  products.forEach((p) => {
    csv += `"${p.barcode}","${p.nama}",${p.harga}\n`;
  });

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);

  a.download = "produk.csv";

  a.click();
}

function rupiah(n) {
  return Number(n).toLocaleString("id-ID");
}
function renderProdukGrid() {
  const grid = document.getElementById("produkGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const awal = halamanProduk * produkPerHalaman;

  const akhir = awal + produkPerHalaman;

  const tampil = products.slice(awal, akhir);

  tampil.forEach((p) => {
    const index = products.indexOf(p);

    grid.innerHTML += `
<div class="produk-card"
     onclick="tambahKeCart(${index})">

    <img src="${p.gambar || ""}"
         alt="${p.nama}">

    <div class="produk-info">

        <b>${p.nama}</b>

        <div class="produk-footer">

            <span>
                Rp ${rupiah(p.harga)}
            </span>

            <button
    class="edit-produk"
    onclick="event.stopPropagation(); bukaEditProduk(${index});">
    ✏️
</button>

        </div>

    </div>

</div>
`;
  });
  const totalHalaman = Math.max(
    1,
    Math.ceil(products.length / produkPerHalaman),
  );

  document.getElementById("halamanProduk").textContent =
    halamanProduk + 1 + " / " + totalHalaman;

  const tombolPrev = document.getElementById("btnPrev");

  const tombolNext = document.getElementById("btnNext");

  if (tombolPrev) {
    tombolPrev.disabled = halamanProduk === 0;
  }

  if (tombolNext) {
    tombolNext.disabled = halamanProduk >= totalHalaman - 1;
  }
}
function nextProduk() {
  const totalHalaman = Math.ceil(products.length / produkPerHalaman);

  if (halamanProduk < totalHalaman - 1) {
    halamanProduk++;

    renderProdukGrid();
  }
}

function prevProduk() {
  if (halamanProduk > 0) {
    halamanProduk--;

    renderProdukGrid();
  }
}
function bukaEditProduk(index) {
  editProdukIndex = index;

  const p = products[index];

  document.getElementById("editBarcode").value = p.barcode;
  document.getElementById("editNama").value = p.nama;
  document.getElementById("editHarga").value = p.harga;

  document.getElementById("editProdukPopup").style.display = "flex";
}
function tutupEditProduk() {
  document.getElementById("editProdukPopup").style.display = "none";

  editProdukIndex = -1;
}
async function simpanEditProduk() {
  const btnSimpan = document.querySelector(
    "#editProdukPopup .popup-buttons button",
  );

  const btnBatal = document.querySelector("#editProdukPopup .danger");

  btnSimpan.disabled = true;
  btnBatal.disabled = true;

  btnSimpan.textContent = "⏳ Menyimpan...";

  if (editProdukIndex < 0) return;

  const nama = document.getElementById("editNama").value.trim();

  const harga = Number(document.getElementById("editHarga").value);

  if (!nama || !harga) {
    showAlert("Nama dan harga wajib diisi");

    return;
  }

  const produk = products[editProdukIndex];

  const data = {
    barcode: produk.barcode,

    nama: nama,

    harga: harga,
  };

  try {
    const url =
      `https://script.google.com/macros/s/AKfycbzTLMB4ZQBHozoLVMIaKXhQALfbXbiEb2Fmg792LYj9BtILo669V1l8-4XfNtfIJJs/exec` +
      `?action=update` +
      `&barcode=${encodeURIComponent(produk.barcode)}` +
      `&nama=${encodeURIComponent(nama)}` +
      `&harga=${encodeURIComponent(harga)}`;

    const res = await fetch(url);

    const hasil = await res.json();

    if (!hasil.success) {
      showAlert("Gagal memperbarui Spreadsheet");

      return;
    }

    produk.nama = nama;

    produk.harga = harga;

    saveProducts();

    renderProdukGrid();

    cariProduk();
    btnSimpan.disabled = false;
    btnBatal.disabled = false;

    btnSimpan.textContent = "Simpan";
    tutupEditProduk();

    showAlert("Produk berhasil diperbarui");
  } catch (err) {
    console.error(err);

    showAlert("Tidak dapat terhubung ke Apps Script");
  } finally {
    btnSimpan.disabled = false;
    btnBatal.disabled = false;

    btnSimpan.textContent = "Simpan";
  }
}
function tambahProduk() {
  const barcode = document.getElementById("barcode").value.trim();

  const nama = document.getElementById("nama").value.trim();

  const harga = Number(document.getElementById("harga").value);

  if (!nama || !harga) {
    showAlert("Lengkapi data produk");
    return;
  }

  if (editIndex >= 0) {
    products[editIndex] = {
      barcode,
      nama,
      harga,
      gambar: products[editIndex].gambar || "",
    };

    editIndex = -1;
    document.getElementById("btnBatal").style.display = "none";

    document.getElementById("btnProduk").textContent = "Tambah Produk";
  } else {
    products.unshift({
      barcode,
      nama,
      harga,
      gambar: "",
    });
  }

  saveProducts();
  renderProdukGrid();
  buildProductIndex();
  console.log("Jumlah index:", Object.keys(productIndex).length);
  cariProduk();

  document.getElementById("barcode").value = "";
  document.getElementById("nama").value = "";
  document.getElementById("harga").value = "";
}

function hapusProduk(index) {
  if (!confirm("Hapus produk?")) return;
  products.splice(index, 1);
  saveProducts();
  renderProdukGrid();
  buildProductIndex();
  console.log("Jumlah index:", Object.keys(productIndex).length);
  cariProduk();
}
function editProduk(index) {
  const p = products[index];

  document.getElementById("barcode").value = p.barcode;

  document.getElementById("nama").value = p.nama;

  document.getElementById("harga").value = p.harga;

  editIndex = index;

  document.getElementById("btnProduk").textContent = "Simpan Perubahan";

  document.getElementById("btnBatal").style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
function cariProduk() {
  const keyword = document.getElementById("cari").value.toLowerCase().trim();

  const el = document.getElementById("hasilCari");

  el.innerHTML = "";

  if (keyword.length < 2) {
    return;
  }

  const hasil = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(keyword) ||
      p.barcode.toLowerCase().includes(keyword),
  );
  let tambah = 0;
  let update = 0;
  hasil.forEach((p) => {
    const realIndex = products.indexOf(p);

    el.innerHTML += `
<div class="item">

    <div
        style="cursor:pointer;flex:1"
        onclick="tambahKeCart(${realIndex})">

        <b>${p.nama}</b><br>
        ${p.barcode || "-"}<br>
        Rp ${rupiah(p.harga)}

    </div>

    <div class="row">

        <button
            class="small"
            onclick="editProduk(${realIndex})">
            Edit
        </button>

        <button
            class="small danger"
            onclick="hapusProduk(${realIndex})">
            Hapus
        </button>

    </div>

</div>
`;
  });

  if (hasil.length === 0) {
    el.innerHTML = `
        <div style="padding:10px;opacity:.7;">
            Produk tidak ditemukan
        </div>`;
  }
}
function tambahKeCart(index) {
  const p = products[index];

  let existing = cart.find((x) => x.barcode && x.barcode === p.barcode);

  if (!existing) {
    existing = cart.find((x) => x.nama === p.nama);
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...p, qty: 1 });
  }

  renderCart();
  renderProdukGrid();
  document.getElementById("cari").value = "";
  document.getElementById("hasilCari").innerHTML = "";
}

function batalEdit() {
  editIndex = -1;

  barcode.value = "";
  nama.value = "";
  harga.value = "";

  btnProduk.textContent = "Tambah Produk";

  btnBatal.style.display = "none";
}
function renderCart() {
  const el = document.getElementById("cartList");
  el.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    total += item.harga * item.qty;

    el.innerHTML += `
   <div class="item">
      <div>
         <b>${item.nama}</b><br>
         Rp ${rupiah(item.harga * item.qty)}
      </div>

      <div class="row">
        <button class="small" onclick="ubahQty(${index},-1)">-</button>
        <span>${item.qty}</span>
        <button class="small" onclick="ubahQty(${index},1)">+</button>
      </div>
   </div>`;
  });
  document.getElementById("total").textContent = rupiah(total);
  updateKembalian();
}

function ubahQty(index, nilai) {
  cart[index].qty += nilai;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  renderCart();
}

function getTotal() {
  return cart.reduce((t, i) => t + i.harga * i.qty, 0);
}

function updateKembalian() {
  const bayar = Number(document.getElementById("bayar").value || 0);
  document.getElementById("kembalian").textContent = rupiah(bayar - getTotal());
}
function prosesBayar() {
  const total = getTotal();
  const bayar = Number(document.getElementById("bayar").value || 0);

  if (total <= 0) {
    showAlert("Belum ada transaksi");
    return;
  }

  if (bayar < total) {
    showAlert("Uang bayar kurang");
    return;
  }

  showAlert("Pembayaran berhasil");

  cart = [];

  document.getElementById("bayar").value = "";

  renderCart();

  document.getElementById("scanBarcode").focus();
}
function tambahBayar(nominal) {
  const bayar = Number(document.getElementById("bayar").value || 0);

  document.getElementById("bayar").value = bayar + nominal;

  updateKembalian();
}
function bayarPas() {
  document.getElementById("bayar").value = getTotal();

  updateKembalian();
}

function resetBayar() {
  document.getElementById("bayar").value = "";

  updateKembalian();
}

function pilihProdukPertama() {
  const keyword = document.getElementById("cari").value.toLowerCase().trim();

  if (keyword.length < 2) {
    return;
  }

  const hasil = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(keyword) ||
      p.barcode.toLowerCase().includes(keyword),
  );

  if (hasil.length > 0) {
    const realIndex = products.indexOf(hasil[0]);

    tambahKeCart(realIndex);
  }
}
const scanInput = document.getElementById("scanBarcode");

let scanTimer;

scanInput.addEventListener("input", function () {
  clearTimeout(scanTimer);

  scanTimer = setTimeout(() => {
    const kode = scanInput.value.trim();

    if (!kode) return;

    const produk = productIndex[kode];

    if (produk) {
      tambahKeCart(produk.index);

      scanInput.value = "";
    } else {
      showAlert("Barcode tidak ditemukan");
    }
  }, 200);
});
window.onload = () => {
  document.getElementById("scanBarcode").focus();

  renderProdukGrid();
};
buildProductIndex();
console.log("Jumlah index:", Object.keys(productIndex).length);
cariProduk();

document.getElementById("importFile").addEventListener("change", function (e) {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function () {
    try {
      const rows = reader.result.split("\n").filter((r) => r.trim());

      const hasil = [];

      for (let i = 1; i < rows.length; i++) {
        const kolom = rows[i].split(",");

        if (kolom.length < 3) continue;

        hasil.push({
          barcode: kolom[0].replace(/"/g, "").trim(),

          nama: kolom[1].replace(/"/g, "").trim(),

          harga: Number(kolom[2]),
        });
      }
      let tambah = 0;
      let update = 0;
      hasil.forEach((item) => {
        const existing = products.find((p) => p.barcode === item.barcode);

        if (existing) {
          existing.nama = item.nama;

          existing.harga = item.harga;

          update++;
        } else {
          products.unshift(item);

          tambah++;
        }
      });

      saveProducts();

      showAlert(
        `Import selesai

Produk baru : ${tambah}
Produk diperbarui : ${update}
Total produk : ${products.length}`,
      );
    } catch {
      showAlert("Format CSV tidak valid");
    }
  };

  reader.readAsText(file);
});
function showAlert(msg) {
  document.getElementById("popup").style.display = "flex";

  document.getElementById("popupTitle").innerText = "Informasi";

  document.getElementById("popupMessage").innerText = msg;

  document.getElementById("popupCancel").style.display = "none";

  document.getElementById("popupOk").onclick = function () {
    document.getElementById("popup").style.display = "none";
  };
}

async function sinkronProduk() {
  try {
    const url =
      "https://script.google.com/macros/s/AKfycbzTLMB4ZQBHozoLVMIaKXhQALfbXbiEb2Fmg792LYj9BtILo669V1l8-4XfNtfIJJs/exec";

    const res = await fetch(url);

    const data = await res.json();

    let tambah = 0;
    let update = 0;

    data.forEach((item) => {
      const existing = products.find((p) => p.barcode === item.barcode);

      if (existing) {
        existing.nama = item.nama;
        existing.harga = Number(item.harga);
        existing.gambar = item.gambar || "";

        update++;
      } else {
        products.unshift({
          barcode: item.barcode,
          nama: item.nama,
          harga: Number(item.harga),
          gambar: item.gambar || "",
        });

        tambah++;
      }
    });

    saveProducts();
    renderProdukGrid();
    cariProduk();

    showAlert(
      `Sinkron selesai

Produk baru : ${tambah}
Produk diperbarui : ${update}
Total produk : ${products.length}`,
    );
  } catch (err) {
    showAlert("Gagal mengambil data spreadsheet");

    console.error(err);
  }
}

function showConfirm(msg, callback) {
  document.getElementById("popup").style.display = "flex";

  document.getElementById("popupTitle").innerText = "Konfirmasi";

  document.getElementById("popupMessage").innerText = msg;

  document.getElementById("popupCancel").style.display = "block";

  document.getElementById("popupOk").onclick = function () {
    document.getElementById("popup").style.display = "none";

    callback(true);
  };

  document.getElementById("popupCancel").onclick = function () {
    document.getElementById("popup").style.display = "none";

    callback(false);
  };
}
