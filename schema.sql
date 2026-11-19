-- ============================================================================
-- FITFOUND - Schema PostgreSQL
-- Jalankan setelah database dibuat, lalu lanjutkan dengan seed.sql
-- Warn: DROP TABLE bakal menghapus semua data yang ada dan menggantinya dengan yang baru
-- ============================================================================

-- Hapus tabel lama (urutan dari child ke parent)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Akun admin, seller, dan buyer
-- status: verifikasi seller (active, pending, rejected); buyer & admin selalu active
-- status_akun: akses login (active, inactive, suspended) tanpa menghapus riwayat transaksi
-- suspend_sampai: NULL berarti permanen sampai dicabut admin
CREATE TABLE users (
  id_user SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  no_hp VARCHAR(20),
  alamat TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin', 'seller', 'buyer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
  status_akun VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status_akun IN ('active', 'inactive', 'suspended')),
  alasan_status TEXT,
  suspend_sampai TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Profil toko (1 user seller = 1 toko)
-- gambar_toko menyimpan path file di public/uploads/stores
CREATE TABLE stores (
  id_store SERIAL PRIMARY KEY,
  id_user INT NOT NULL UNIQUE,
  nama_toko VARCHAR(120) NOT NULL,
  deskripsi_toko TEXT,
  gambar_toko TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stores_users
    FOREIGN KEY(id_user)
    REFERENCES users(id_user)
    ON DELETE CASCADE
);

-- Kategori utama dan sub-kategori accessories
CREATE TABLE categories (
  id_category SERIAL PRIMARY KEY,
  nama_kategori VARCHAR(100) NOT NULL UNIQUE,
  grup_kategori VARCHAR(50) NOT NULL DEFAULT 'Main' CHECK (grup_kategori IN ('Main', 'Accessories')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Katalog produk per toko
-- ukuran: daftar ukuran dipisah koma (mis. S,M,L atau 38,39,40), atau '-' jika tanpa ukuran
-- stok: total stok seluruh ukuran; jumlah_terjual naik saat order completed
-- gambar: path utama di public/uploads/products (validasi minimal 1 foto ditangani di Server Action)
CREATE TABLE products (
  id_product SERIAL PRIMARY KEY,
  id_store INT NOT NULL,
  id_category INT NOT NULL,
  nama_produk VARCHAR(150) NOT NULL,
  segmen VARCHAR(20) NOT NULL DEFAULT 'Unisex' CHECK (segmen IN ('Women', 'Men', 'Kids', 'Unisex')),
  deskripsi TEXT NOT NULL,
  harga NUMERIC(12, 2) NOT NULL CHECK (harga >= 0),
  stok INT NOT NULL DEFAULT 0 CHECK (stok >= 0),
  ukuran VARCHAR(100) NOT NULL,
  gambar TEXT,
  jumlah_terjual INT NOT NULL DEFAULT 0 CHECK (jumlah_terjual >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_stores
    FOREIGN KEY(id_store)
    REFERENCES stores(id_store)
    ON DELETE CASCADE,
  CONSTRAINT fk_products_categories
    FOREIGN KEY(id_category)
    REFERENCES categories(id_category)
    ON DELETE RESTRICT
);

-- Galeri foto produk (maks. 5 foto; urutan 1 = foto utama)
CREATE TABLE product_images (
  id_product_image SERIAL PRIMARY KEY,
  id_product INT NOT NULL,
  gambar TEXT NOT NULL,
  urutan INT NOT NULL DEFAULT 1 CHECK (urutan BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_product, urutan),
  CONSTRAINT fk_product_images_products
    FOREIGN KEY(id_product)
    REFERENCES products(id_product)
    ON DELETE CASCADE
);

-- Stok per ukuran (produk tanpa ukuran pakai 1 baris dengan ukuran '-')
CREATE TABLE product_sizes (
  id_product_size SERIAL PRIMARY KEY,
  id_product INT NOT NULL,
  ukuran VARCHAR(20) NOT NULL,
  stok INT NOT NULL DEFAULT 0 CHECK (stok >= 0),
  urutan INT NOT NULL DEFAULT 1,
  UNIQUE (id_product, ukuran),
  CONSTRAINT fk_product_sizes_products
    FOREIGN KEY(id_product)
    REFERENCES products(id_product)
    ON DELETE CASCADE
);

-- Alamat pengiriman tersimpan milik buyer
CREATE TABLE addresses (
  id_address SERIAL PRIMARY KEY,
  id_user INT NOT NULL,
  label VARCHAR(50) NOT NULL,
  nama_penerima VARCHAR(100) NOT NULL,
  no_hp VARCHAR(20) NOT NULL,
  alamat_lengkap TEXT NOT NULL,
  kota VARCHAR(100) NOT NULL,
  kode_pos VARCHAR(10) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_users
    FOREIGN KEY(id_user)
    REFERENCES users(id_user)
    ON DELETE CASCADE
);

-- Produk favorit buyer
CREATE TABLE wishlists (
  id_wishlist SERIAL PRIMARY KEY,
  id_user INT NOT NULL,
  id_product INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_user, id_product),
  CONSTRAINT fk_wishlists_users
    FOREIGN KEY(id_user)
    REFERENCES users(id_user)
    ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_products
    FOREIGN KEY(id_product)
    REFERENCES products(id_product)
    ON DELETE CASCADE
);

-- Keranjang aktif per buyer
CREATE TABLE carts (
  id_cart SERIAL PRIMARY KEY,
  id_user INT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_users
    FOREIGN KEY(id_user)
    REFERENCES users(id_user)
    ON DELETE CASCADE
);

-- Item di dalam keranjang berdasarkan produk dan ukuran
CREATE TABLE cart_items (
  id_cart_item SERIAL PRIMARY KEY,
  id_cart INT NOT NULL,
  id_product INT NOT NULL,
  ukuran VARCHAR(20) NOT NULL,
  jumlah INT NOT NULL DEFAULT 1 CHECK (jumlah > 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_cart, id_product, ukuran),
  CONSTRAINT fk_cart_items_carts
    FOREIGN KEY(id_cart)
    REFERENCES carts(id_cart)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_products
    FOREIGN KEY(id_product)
    REFERENCES products(id_product)
    ON DELETE CASCADE
);

-- Pesanan dipecah per toko saat checkout
-- status_order: pending, processing, shipped, completed, cancelled
CREATE TABLE orders (
  id_order SERIAL PRIMARY KEY,
  id_user INT NOT NULL,
  id_store INT,
  nama_toko VARCHAR(120) NOT NULL,
  total_harga NUMERIC(12, 2) NOT NULL CHECK (total_harga >= 0),
  status_order VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status_order IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  alamat_pengiriman TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_users
    FOREIGN KEY(id_user)
    REFERENCES users(id_user)
    ON DELETE CASCADE,
  CONSTRAINT fk_orders_stores
    FOREIGN KEY(id_store)
    REFERENCES stores(id_store)
    ON DELETE SET NULL
);

-- Detail item per pesanan (nama_produk & gambar disimpan sebagai snapshot)
CREATE TABLE order_items (
  id_order_item SERIAL PRIMARY KEY,
  id_order INT NOT NULL,
  id_product INT,
  nama_produk VARCHAR(150) NOT NULL,
  gambar TEXT,
  ukuran VARCHAR(20) NOT NULL,
  jumlah INT NOT NULL CHECK (jumlah > 0),
  harga_satuan NUMERIC(12, 2) NOT NULL CHECK (harga_satuan >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_orders
    FOREIGN KEY(id_order)
    REFERENCES orders(id_order)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_products
    FOREIGN KEY(id_product)
    REFERENCES products(id_product)
    ON DELETE SET NULL
);

-- Ulasan produk untuk pesanan berstatus completed
CREATE TABLE reviews (
  id_review SERIAL PRIMARY KEY,
  id_user INT NOT NULL,
  id_product INT NOT NULL,
  id_order INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_order, id_product),
  CONSTRAINT fk_reviews_users
    FOREIGN KEY(id_user)
    REFERENCES users(id_user)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_products
    FOREIGN KEY(id_product)
    REFERENCES products(id_product)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_orders
    FOREIGN KEY(id_order)
    REFERENCES orders(id_order)
    ON DELETE CASCADE
);

-- Index untuk foreign key agar query join & filter lebih cepat
CREATE INDEX idx_products_store ON products(id_store);
CREATE INDEX idx_products_category ON products(id_category);
CREATE INDEX idx_orders_user ON orders(id_user);
CREATE INDEX idx_orders_store ON orders(id_store);
CREATE INDEX idx_reviews_product ON reviews(id_product);
CREATE INDEX idx_product_images_product ON product_images(id_product);
CREATE INDEX idx_product_sizes_product ON product_sizes(id_product);