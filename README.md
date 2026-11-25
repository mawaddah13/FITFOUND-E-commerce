<div align="center">
  <img src="public/images/logo.png" alt="Logo FITFOUND" width="220" />

  <h1>FITFOUND — Fashion E-Commerce</h1>

  <strong>Find Your Fit, Find Your Own Style</strong>

  <em>Platform belanja fashion multi-toko untuk Women, Men, dan Kids.</em>

  <p>
    <img src="https://img.shields.io/badge/Next.js-App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js App Router" />
    <img src="https://img.shields.io/badge/JavaScript-JSX-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript JSX" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Status-Completed-4353FF?style=for-the-badge" alt="Status Completed" />
  </p>
</div>

---

## 🧭 Navigasi

- [Tentang FITFOUND](#-tentang-fitfound)
- [Fitur Utama Sistem](#-fitur-utama-sistem)
- [Alur Pesanan & Verifikasi Seller](#-alur-pesanan--verifikasi-seller)
- [Tingkat Pengguna](#-tingkat-pengguna)
- [Teknologi](#️-teknologi-yang-digunakan)
- [Server Actions vs Route Handlers](#-server-actions-vs-route-handlers)
- [Struktur Direktori](#️-struktur-direktori)
- [Instalasi](#️-panduan-instalasi-dan-menjalankan-project)
- [Akun Demo](#-akun-demo-untuk-pengujian)
- [Pengujian](#-skenario-pengujian-utama)
- [Catatan Keamanan](#-catatan-keamanan)

## 👗 Tentang FITFOUND

**FITFOUND** adalah platform e-commerce fashion dengan banyak toko (*multi-vendor*). Pembeli bisa menjelajahi pakaian, sepatu, dan aksesori dari berbagai toko terpercaya, sedangkan penjual bisa membuka toko sendiri setelah diverifikasi oleh Admin.

Nama **FITFOUND** berasal dari gabungan kata *fit* dan *found*: setiap orang bisa **menemukan** gaya yang **pas** untuk dirinya. Tagline-nya, *Find Your Fit, Find Your Own Style*, ditampilkan di seluruh aplikasi.

FITFOUND dibangun dengan tiga prinsip:

- **Belanja yang jelas** — ukuran disesuaikan per kategori, stok per ukuran, dan status pesanan yang bisa dilacak.
- **Toko yang terpercaya** — setiap seller wajib mengirim data pribadi, data toko, serta foto KTP dan selfie sebelum disetujui Admin.
- **Pengelolaan yang tegas** — Admin dapat menonaktifkan atau men-suspend akun, dan produk dari toko yang bermasalah otomatis disembunyikan dari pembeli.

## ✨ Fitur Utama Sistem

### 1. 🛍️ Katalog dan Penjelajahan Produk

- **Home:** hero banner, **Recommended For You** (8 produk acak), dan **New Arrivals** (8 produk terbaru yang masih ada stok).
- **All Products / Women / Men / Kids:** katalog lengkap dengan **filter** (gender, kategori utama, aksesori, rentang harga) dan **sorting** (Newest, Price, Name A–Z / Z–A, Top Rated).
- **Live search:** saran produk muncul saat mengetik di navbar desktop atau di search bar katalog (HP).
- **Detail produk:** galeri hingga 5 foto, pilihan ukuran dan stok per ukuran, rating, ulasan, dan link ke halaman toko.
- **Halaman toko:** profil toko beserta seluruh produknya.
- Produk dengan stok 0 tampil abu-abu dengan label **Sold Out**.

### 2. 🔐 Autentikasi dan Hak Akses

- Login untuk **Admin, Seller, dan Buyer** dalam satu halaman (tab Sign In / Sign Up), tanpa navbar dan footer.
- Pengunjung bisa memilih **Continue as Guest** untuk langsung berbelanja tanpa login.
- Registrasi **Buyer** cukup nama, email, dan password.
- Registrasi **Seller** dibuat **3 tahap** dengan indikator tahap:
  1. **Personal Info** — nama lengkap, email, nomor HP.
  2. **Store Info** — nama toko, alamat toko, deskripsi (opsional).
  3. **Verification** — foto KTP, selfie memegang KTP, password, dan konfirmasi password.
- Akses halaman `/admin`, `/seller`, dan `/buyer` dibatasi per peran di sisi server (`src/middleware.js` + pengecekan ulang di setiap halaman dan action).
- Akun **Inactive** atau **Suspended** tidak bisa login dan akan melihat pop up berisi alasan serta batas waktu suspend.

### 3. 🛒 Keranjang, Wishlist, dan Checkout

- Add to Cart dengan pilihan ukuran dan jumlah, tanpa memuat ulang halaman (jumlah di ikon keranjang langsung bertambah).
- Kelola keranjang (+/−, hapus dengan konfirmasi) dan **checkout hanya barang yang dicentang**. Pesanan otomatis **dipecah per toko**.
- **Wishlist** untuk menyimpan produk favorit.
- **Alamat pengiriman** maksimal 2, bisa dipilih sebagai alamat default.
- Seller juga bisa berbelanja, tetapi **tidak bisa membeli produk dari tokonya sendiri**.

### 4. 📦 Pesanan dan Tracking

- Buyer menekan **Pay Now**, lalu seller **Confirm Payment** sebelum pesanan diproses.
- Status pesanan ditampilkan dengan indikator tahap beserta tanggal dan jam setiap tahap.
- Buyer bisa membatalkan pesanan yang belum dibayar dan mengonfirmasi pesanan sudah diterima.
- Stok dikembalikan otomatis saat pesanan dibatalkan.
- Riwayat pesanan tetap menyimpan nama dan foto produk walaupun produknya sudah dihapus atau tokonya nonaktif. Produk seperti itu ditandai *(no longer available)*.

### 5. ⭐ Rating dan Ulasan

- Buyer memberi rating 1–5 dan ulasan **hanya untuk pesanan berstatus Completed**.
- Rata-rata rating tampil di kartu produk, detail produk, dan dipakai untuk sorting *Top Rated*.

### 6. 🏪 Seller Center

- **To Do List:** Confirm Payment, To Process (Processing + Shipped), Low Stock, dan Sold Out Products.
- Kelola **profil toko** (nama, deskripsi, foto, nomor HP, alamat).
- **CRUD produk:** nama, deskripsi, harga, kategori, segmen, 1–5 foto, dan stok per ukuran.
- **Incoming Orders:** filter status dan sorting, Confirm Payment, lalu perbarui status ke Shipped atau batalkan pesanan. Status Completed dikonfirmasi oleh buyer.
- Produk yang **masih dalam pesanan aktif tidak bisa dihapus**. Muncul toast peringatan di kanan atas.

### 7. 🛡️ Admin Panel

- **Dashboard** statistik pengguna, toko, produk, dan pesanan.
- **User Management:** cari, lihat, dan edit akun (nama, email, no HP, alamat, reset password), ubah status **Active / Inactive / Suspended** dengan alasan dan durasi, serta hapus akun. Admin tidak bisa menghapus atau menonaktifkan dirinya sendiri.
- **Seller Verification:** tab **All / Pending / Approved / Rejected**. Kartu seller bisa diklik untuk melihat detail (*Personal Info, Store Info, Verification Documents*). Approve dan Reject hanya untuk seller **Pending**, selalu dengan pop up konfirmasi, dan **Reject wajib disertai alasan**.
- **CRUD Kategori** (grup *Main* dan *Accessories*).
- **Pengendalian produk:** hapus produk yang melanggar dari toko mana pun, kecuali yang masih dalam pesanan aktif.

### 8. 📊 Dashboard Berdasarkan Peran

| Peran | Fokus Dashboard |
|---|---|
| **Admin** | Statistik sistem, manajemen akun, verifikasi seller, kategori, dan pengendalian produk. |
| **Seller** | To Do List pesanan dan stok, pesanan terbaru, produk stok menipis/habis, total produk, pesanan selesai, dan pendapatan. |
| **Buyer** | My Profile (data diri, password, alamat pengiriman) serta Orders & Tracking, dengan breadcrumb yang mengikuti halaman sebelumnya. |
| **Guest** | Home, katalog, detail produk, halaman toko, dan live search. Add to Cart atau Wishlist memunculkan pop up login. |

## 🧭 Alur Pesanan & Verifikasi Seller

### Alur Pesanan

```text
Buyer checkout (pesanan dipecah per toko)
              │
              ▼
   Pending — Awaiting Payment ──► Buyer batal ──► Cancelled (stok kembali)
              │
        Buyer klik Pay Now
              │
              ▼
   Pending — Paid, perlu konfirmasi
              │
     Seller klik Confirm Payment
              │
              ▼
          Processing ──► Seller batal ──► Cancelled (stok kembali)
              │
              ▼
           Shipped
              │
          Buyer konfirmasi diterima
              │
              ▼
          Completed ──► Buyer bisa memberi rating & ulasan
```

### Alur Verifikasi Seller

```text
Daftar Seller (3 tahap + foto KTP & selfie)
              │
              ▼
           Pending  ──► halaman "Your account is under review."
              │
       ┌──────┴──────┐
       ▼             ▼
   Approved       Rejected (wajib ada alasan)
       │             │
       ▼             ▼
 Pop up "Your     Seller melihat alasan + kontak Admin,
 store has been   lalu bisa menghapus akun dan daftar ulang
 approved!" →
 Continue as Seller
```

**Prinsip penting:** stok dikurangi saat checkout di dalam **transaksi PostgreSQL** (`BEGIN/COMMIT/ROLLBACK` + `SELECT ... FOR UPDATE`), dan dikembalikan saat pesanan dibatalkan. Status seller yang sudah Approved atau Rejected tidak bisa diubah lagi dari halaman verifikasi.

## 👥 Tingkat Pengguna

| Role | Hak Akses Utama |
|---|---|
| **Admin** | Mengelola akun dan kategori, memverifikasi seller, memantau statistik, serta menghapus produk yang melanggar. |
| **Seller** | Mengelola profil toko, produk, dan pesanan masuk tokonya sendiri. Juga bisa berbelanja di toko lain. |
| **Buyer** | Berbelanja, mengelola keranjang, wishlist, alamat, pesanan, serta memberi rating dan ulasan. |
| **Guest** | Menjelajahi katalog, detail produk, dan halaman toko tanpa bisa bertransaksi. |

**Aturan status akun:**
- **Active** — akun aktif dan bisa login sesuai perannya.
- **Inactive** — akun dinonaktifkan. Saat login muncul pop up informasi, dan produk tokonya (jika seller) disembunyikan.
- **Suspended** — akun diblokir sementara dengan alasan dan durasi. Produk tokonya disembunyikan, dan akses otomatis kembali saat masa suspend berakhir.

**Aturan produk:**
- Ukuran menyesuaikan kategori: pakaian XS–XXL (Kids 2Y–12Y), sepatu Women 35–40 / Men 39–44 / Kids 26–34.
- **Accessories** (tas, perhiasan, jam, dompet, dasi, bando) tidak memakai ukuran, cukup stok.

## 🛠️ Teknologi yang Digunakan

| Bagian | Teknologi | Peran |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | Routing, Server Components, Server Actions, Route Handlers, dan middleware. |
| Bahasa | **JavaScript (JSX)** | Logika aplikasi dan komponen antarmuka. |
| UI | **React 19** | Komponen interaktif (`useActionState`, `useSyncExternalStore`, dll). |
| Styling | **Tailwind CSS 4** | Sistem styling responsif dan konsisten. |
| Ikon | **react-icons** | Ikon navbar, sidebar, dan tombol. |
| Database | **PostgreSQL** | Penyimpanan pengguna, toko, produk, keranjang, pesanan, dan ulasan. |
| Database Driver | **node-postgres (`pg`)** | Koneksi PostgreSQL dan eksekusi parameterized Raw SQL. |
| Password Hashing | **bcryptjs** | Hash dan verifikasi password pengguna. |

## 🔀 Server Actions vs Route Handlers

### Server Actions (`src/app/action/*.js`)

| File | Action |
|---|---|
| `auth.js` | login, register (buyer & seller 3 tahap), logout, hapus akun seller yang ditolak, *Continue as Seller* |
| `buyer.js` | perbarui profil, ganti password, tambah/ubah/hapus/set default alamat, kirim ulasan |
| `order.js` | checkout, Pay Now, batalkan pesanan, konfirmasi diterima, seller perbarui status pesanan |
| `seller.js` | perbarui profil toko (+upload foto), tambah/ubah/hapus produk (+upload foto) |
| `admin.js` | approve/reject seller (dengan alasan), edit user (status akun & reset password), hapus user, CRUD kategori, hapus produk melanggar |

### Route Handlers (`src/app/api/**/route.js`)

| Endpoint | Method | Kegunaan |
|---|---|---|
| `/api/cart` | GET, POST | lihat isi keranjang (JSON), tambah produk ke keranjang |
| `/api/cart/[id]` | PATCH, DELETE | ubah jumlah item, hapus item keranjang |
| `/api/wishlist` | GET, POST | daftar wishlist, tambah ke wishlist |
| `/api/wishlist/[productId]` | DELETE | hapus dari wishlist |
| `/api/products/search?q=` | GET | saran produk untuk live search |
| `/api/products/[id]` | GET | detail produk, ukuran, dan stok (dipakai pop up pilih ukuran) |

### Alasan Pembagian

**Server Action** dipakai untuk **form yang mengubah data lalu halaman perlu di-render ulang atau berpindah halaman**, misalnya login/register, checkout, CRUD produk dan kategori, verifikasi seller, edit user, profil, alamat, ulasan, dan status pesanan.
- Form langsung memanggil fungsi server tanpa membuat endpoint dan `fetch` manual.
- Hasil validasi (`{ error }` / `{ success }`) langsung tampil lewat `useActionState`, sebagai pesan di form atau toast.
- Setelah berhasil cukup `revalidatePath()` / `redirect()`, sehingga data di Server Component ikut diperbarui.
- Cocok untuk upload file (`FormData`) dan alur yang memakai transaksi (checkout).

**Route Handler** dipakai untuk **interaksi kecil dan cepat dari Client Component yang tidak perlu pindah halaman, serta request GET yang dipanggil berulang**:
- **Keranjang dan wishlist** dipanggil dari banyak tempat (kartu produk, detail produk, halaman cart). Respons JSON kecil (jumlah item, total harga) cukup untuk memperbarui UI tanpa me-render ulang halaman.
- **Live search** adalah request **GET** yang dikirim setiap user mengetik (dengan debounce dan `AbortController`). Server Action selalu berupa `POST` dan dijalankan berurutan, jadi tidak cocok untuk ini.
- **Detail produk** diambil saat pop up pilih ukuran dibuka dari kartu produk.

## 🗃️ Struktur Direktori

```text
fitfound/
├── public/
│   ├── images/
│   │   ├── logo.png             # Logo navbar, footer, panel, dan favicon
│   │   └── hero.png             # Gambar hero di Home
│   └── uploads/
│       ├── products/            # Foto produk yang di-upload
│       ├── stores/              # Foto profil toko
│       └── verifications/       # Foto KTP & selfie seller
├── src/
│   ├── app/
│   │   ├── page.jsx             # Home
│   │   ├── layout.js            # Navbar, footer, dan pop up login
│   │   ├── globals.css
│   │   ├── login/ · register/
│   │   ├── products/            # Katalog & detail produk
│   │   ├── stores/              # Halaman toko
│   │   ├── buyer/               # Profil, pesanan, keranjang, wishlist, checkout
│   │   ├── seller/              # Seller Center & halaman verifikasi
│   │   ├── admin/               # Admin Panel
│   │   ├── action/              # Server Actions
│   │   └── api/                 # Route Handlers
│   ├── components/              # Navbar, CatalogLayout, DashboardShell, form, dll.
│   ├── data/                    # Data navigasi & kontak admin
│   ├── lib/                     # db, auth, session, upload, validasi, format
│   └── middleware.js            # Pembatasan akses per peran
├── schema.sql                   # Struktur tabel, relasi, dan index
├── seed.sql                     # Data demo (akun, toko, produk, pesanan, ulasan)
├── .env.example
├── next.config.mjs
├── package.json
└── README.md
```

Foto yang di-upload disimpan sebagai **file** di `public/uploads/`. Database hanya menyimpan **lokasinya** (contoh `/uploads/products/1795092552429-29956972be01.jpg`). Format yang diterima adalah JPG, PNG, WEBP, atau GIF, maksimal **5 MB** per foto dan **5 foto** per produk.

## ⚙️ Panduan Instalasi dan Menjalankan Project

### 1. Clone Repository

```bash
git clone <URL_REPOSITORY_FITFOUND>
cd fitfound
```

*(Ganti `<URL_REPOSITORY_FITFOUND>` dengan alamat repositori GitHub proyek ini.)*

### 2. Install Dependencies

Pastikan **Node.js**, **npm**, dan **PostgreSQL** sudah terpasang. Jalankan `npm install` terlebih dahulu untuk mengunduh semua pustaka (`next`, `react`, `pg`, `bcryptjs`, `react-icons`, `tailwindcss`):

```bash
npm install
```

### 3. Buat dan Isi Database PostgreSQL

1. Buka **pgAdmin 4**, klik kanan `Databases` → `Create` → `Database...`, lalu buat database bernama **`fitfound`**.
2. Klik kanan database **`fitfound`** → **Query Tool**.
3. Buka dan jalankan (**F5**) file berikut **secara berurutan**:
   1. **`schema.sql`** — membuat 14 tabel, relasi, dan index. **Perhatian:** file ini menghapus (DROP) tabel lama beserta isinya.
   2. **`seed.sql`** — mengisi kategori, akun demo, toko, produk, foto, pesanan, riwayat status, dan ulasan.

### 4. Konfigurasi Environment

Salin `.env.example` menjadi **`.env.local`** di root project (sejajar dengan `package.json`), lalu sesuaikan password PostgreSQL lokal:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitfound
SESSION_SECRET=ganti_dengan_kunci_rahasia_minimal_32_karakter
```

Jangan mengunggah `.env.local` ke GitHub. File ini sudah dikecualikan di `.gitignore`.

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka aplikasi di browser:

```text
http://localhost:3000
```

Untuk memeriksa build production:

```bash
npm run build
npm run start
```

## 🔑 Akun Demo untuk Pengujian

Semua password akun demo disimpan sebagai hash `bcryptjs`. Data demo dilengkapi toko, produk, pesanan dengan berbagai status, dan ulasan, sehingga semua alur bisa langsung diuji.

| Role | Nama | Email | Password | Kondisi Demo |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin FITFOUND | `admin@fitfound.com` | `admin123` | Akses penuh Admin Panel. |
| **Seller** | Jocelyn Isabelle | `seller1@fitfound.com` | `seller123` | Toko **Urban Thread** (approved) dengan pesanan belum dibayar, dikirim, dan selesai. |
| **Seller** | Pramoedya Adinata | `seller2@fitfound.com` | `seller123` | Toko **Maison Lune** (approved), produk aksesori, ada pesanan yang perlu **Confirm Payment**. |
| **Seller** | Abimanyu Pradipta | `seller3@fitfound.com` | `seller123` | Toko **Little Steps** (approved), produk anak-anak. |
| **Seller** | Sella Adeline | `pending@fitfound.com` | `seller123` | Toko **Atelier Rose** berstatus **Pending**, siap di-approve/reject Admin. |
| **Seller** | Claudya Alessandra | `rejected@fitfound.com` | `seller123` | Toko **Maison Clair** **Rejected** beserta alasannya. Bisa hapus akun. |
| **Seller** | Leonhart Espedor | `suspendedseller@fitfound.com` | `seller123` | Toko **Etoile Bijoux** **Suspended** 7 hari, produknya disembunyikan. |
| **Seller** | Ludwig Elysium | `inactiveseller@fitfound.com` | `seller123` | Toko **Elysium Noir** **Inactive**, produknya disembunyikan. |
| **Buyer** | Gemini Aryasatya | `buyer@fitfound.com` | `buyer123` | Riwayat pesanan lengkap (selesai, dikirim, dibatalkan, belum dibayar) dan ulasan. |
| **Buyer** | Aurelia Santoso | `buyer2@fitfound.com` | `buyer123` | Pesanan sedang diproses dan belum dibayar. |
| **Buyer** | Rizky Ramadhan | `buyer3@fitfound.com` | `buyer123` | Pesanan sudah **Pay Now** dan menunggu konfirmasi seller. |
| **Buyer** | Kevin Wijaya | `buyer4@fitfound.com` | `buyer123` | Pesanan selesai beserta ulasan. |
| **Buyer** | Rafael Mahendra | `suspended@fitfound.com` | `buyer123` | **Suspended** 3 hari. Muncul pop up saat login. |
| **Buyer** | Nadia Kirana | `inactive@fitfound.com` | `buyer123` | **Inactive**. Muncul pop up saat login. |
| **Guest** | - | - | - | Jelajah Home, katalog, detail produk, dan halaman toko tanpa login. |

## 🧪 Skenario Pengujian Utama

| No. | Skenario | Hasil yang Diharapkan |
|---|---|---|
| 1 | Guest membuka Home dan All Products. | Produk, filter, sorting, dan live search bisa dipakai tanpa login. |
| 2 | Guest menekan Add to Cart atau Wishlist. | Muncul pop up yang meminta login. |
| 3 | Seller mendaftar lewat 3 tahap tanpa mengisi foto KTP. | Tidak bisa lanjut. Muncul peringatan pada tahap Verification. |
| 4 | Admin me-reject seller pending tanpa alasan. | Ditolak. Alasan wajib diisi, lalu muncul konfirmasi "Reject [nama toko]?". |
| 5 | Admin meng-approve seller pending. | Seller melihat pop up "Your store has been approved!" saat masuk berikutnya. |
| 6 | Buyer checkout barang dari dua toko. | Pesanan dipecah menjadi dua dan stok berkurang sesuai jumlah. |
| 7 | Buyer membatalkan pesanan yang belum dibayar. | Status menjadi Cancelled dan stok bertambah kembali. |
| 8 | Seller menghapus produk yang ada di pesanan aktif. | Produk tidak terhapus. Muncul toast peringatan. |
| 9 | Buyer memberi ulasan sebelum pesanan Completed. | Ulasan ditolak. Baru bisa setelah pesanan selesai. |
| 10 | Seller mencoba membeli produk dari tokonya sendiri. | Ditolak dengan pesan peringatan. |
| 11 | Akun suspended/inactive mencoba login. | Login ditolak dan muncul pop up berisi alasan. |
| 12 | User membuka halaman milik role lain (misal buyer ke `/admin`). | Server menolak akses dan mengarahkan ke halaman yang sesuai. |
| 13 | Menyimpan form tanpa mengubah isinya. | Tidak ada request dan tidak ada notifikasi. |

## 📌 Catatan Keamanan

- Jangan pernah commit `.env.local`, password PostgreSQL pribadi, atau secret session ke repositori publik.
- Password disimpan sebagai hash **bcryptjs**, bukan plaintext.
- Sesi berupa cookie `httpOnly` yang ditandatangani **HMAC-SHA256** (`src/lib/token.js`) dan berlaku 1 hari.
- Setiap request mengecek ulang akun di database. Akun yang dinonaktifkan atau di-suspend langsung kehilangan akses, dan suspend otomatis berakhir saat waktunya habis.
- Otorisasi dan validasi selalu dijalankan di server pada setiap Server Action dan Route Handler. Seller hanya bisa mengubah produk dan pesanan tokonya sendiri, dan buyer hanya bisa mengubah keranjang dan pesanannya sendiri.
- Semua query memakai **parameterized Raw SQL** (`$1`, `$2`, dst.) untuk mencegah SQL Injection.
- Checkout memakai transaksi PostgreSQL dan `SELECT ... FOR UPDATE` agar stok tetap konsisten.

---

<div align="center">
  <sub>FITFOUND — Find Your Fit, Find Your Own Style</sub>
  <br />
  <sub>Tugas Final Praktikum Pemrograman Web 2026</sub>
</div>