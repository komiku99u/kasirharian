# Kasir Harian

Aplikasi kasir sederhana berbasis HTML, CSS, dan JavaScript yang dapat dijalankan langsung di browser tanpa instalasi database atau server.

## Fitur

### Produk

* Tambah produk
* Edit produk
* Hapus produk
* Pencarian produk
* Import produk dari file JSON
* Export produk ke file JSON
* Penyimpanan otomatis menggunakan LocalStorage

### Transaksi

* Scan barcode menggunakan barcode scanner USB
* Tambah produk ke keranjang
* Ubah jumlah (qty) produk
* Hitung total otomatis
* Hitung kembalian otomatis
* Status pembayaran
* Tombol nominal cepat:

  * Pas
  * 5K
  * 10K
  * 20K
  * 50K
  * 100K
* Reset pembayaran

### Tampilan

* Dark Mode
* Responsive untuk desktop dan mobile
* Popup notifikasi custom
* Fokus otomatis ke kolom scan barcode

---

## Screenshot

Tambahkan screenshot aplikasi di sini.

```markdown
![Screenshot](screenshot.png)
```

---

## Struktur File

```text
kasir/
├── index.html
├── style.css
├── script.js
└── favicon.ico
```

---

## Cara Menjalankan

1. Download atau clone repository ini.

```bash
git clone https://github.com/username/kasir-harian.git
```

2. Buka file:

```text
index.html
```

menggunakan browser.

Tidak memerlukan:

* Database
* PHP
* Node.js
* XAMPP
* Hosting khusus

---

## Format Import Produk

Contoh file JSON:

```json
[
  {
    "barcode": "899001",
    "nama": "Aqua 600ml",
    "harga": 3000
  },
  {
    "barcode": "899002",
    "nama": "Teh Botol",
    "harga": 5000
  }
]
```

---

## Barcode Scanner

Aplikasi mendukung barcode scanner USB yang bekerja sebagai keyboard.

Cara penggunaan:

1. Fokus pada kolom **Scan Barcode**.
2. Scan barcode produk.
3. Produk otomatis masuk ke keranjang.

---

## Penyimpanan Data

Data produk disimpan menggunakan:

```text
LocalStorage Browser
```

Data akan tetap tersedia selama cache browser tidak dihapus.

---

## Teknologi

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* LocalStorage

---

## Lisensi

Bebas digunakan, dimodifikasi, dan dikembangkan sesuai kebutuhan.
