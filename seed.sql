-- 1. isi data awal kategori
INSERT INTO categories (nama_kategori, grup_kategori) VALUES
  ('Bottoms', 'Main'),
  ('Outerwear', 'Main'),
  ('Shoes', 'Main'),
  ('Tops', 'Main'),
  ('Bags', 'Accessories'),
  ('Headband', 'Accessories'),
  ('Jewelry', 'Accessories'),
  ('Ties', 'Accessories'),
  ('Wallet', 'Accessories'),
  ('Watch', 'Accessories');

-- 2. isi akun demo aktif, pending, dan ditolak
INSERT INTO users (nama, email, password_hash, no_hp, role, status) VALUES
  ('Admin FITFOUND', 'admin@fitfound.com',
   '$2a$10$KZSZlcJPexDRQhiBO6cF6uNlzKY2Z/v8cpHzozE11jqFXEts7jwkW',
   '081200000001', 'admin', 'active'),
  ('Jocelyn Isabelle', 'seller1@fitfound.com',
   '$2a$10$WMitSPsWhozQCb5pfVVFwerP92jJZQm5Wo2pcQl2hM1mTxTngLRcG',
   '081200000002', 'seller', 'active'),
  ('Pramoedya Adinata', 'seller2@fitfound.com',
   '$2a$10$WMitSPsWhozQCb5pfVVFwerP92jJZQm5Wo2pcQl2hM1mTxTngLRcG',
   '081200000003', 'seller', 'active'),
  ('Abimanyu Pradipta', 'seller3@fitfound.com',
   '$2a$10$WMitSPsWhozQCb5pfVVFwerP92jJZQm5Wo2pcQl2hM1mTxTngLRcG',
   '081200000004', 'seller', 'active'),
  ('Sella Adeline', 'pending@fitfound.com',
   '$2a$10$WMitSPsWhozQCb5pfVVFwerP92jJZQm5Wo2pcQl2hM1mTxTngLRcG',
   '081200000005', 'seller', 'pending'),
  ('Claudya Alessandra', 'rejected@fitfound.com',
   '$2a$10$WMitSPsWhozQCb5pfVVFwerP92jJZQm5Wo2pcQl2hM1mTxTngLRcG',
   '081200000006', 'seller', 'rejected'),
  ('Gemini Aryasatya', 'buyer@fitfound.com',
   '$2a$10$LlEJfvrVWJr6nvlGFSaxju2A0mRpTtNIkGNKREmPEHQnZgh8yWtNW',
   '081200000007', 'buyer', 'active');

-- isi akun demo yang di-suspend atau nonaktif
INSERT INTO users (nama, email, password_hash, no_hp, role, status, status_akun, alasan_status, suspend_sampai) VALUES
  ('Rafael Mahendra', 'suspended@fitfound.com',
   '$2a$10$LlEJfvrVWJr6nvlGFSaxju2A0mRpTtNIkGNKREmPEHQnZgh8yWtNW',
   '081200000008', 'buyer', 'active', 'suspended',
   'Posted abusive and offensive language in several product reviews.',
   CURRENT_TIMESTAMP + INTERVAL '3 days'),
  ('Nadia Kirana', 'inactive@fitfound.com',
   '$2a$10$LlEJfvrVWJr6nvlGFSaxju2A0mRpTtNIkGNKREmPEHQnZgh8yWtNW',
   '081200000009', 'buyer', 'active', 'inactive',
   'Account closed at the user''s request through customer support.',
   NULL),
  ('Bagas Wiratama', 'suspendedseller@fitfound.com',
   '$2a$10$WMitSPsWhozQCb5pfVVFwerP92jJZQm5Wo2pcQl2hM1mTxTngLRcG',
   '081200000010', 'seller', 'active', 'suspended',
   'Listed counterfeit branded jewelry. The store is hidden while we review it.',
   CURRENT_TIMESTAMP + INTERVAL '7 days');

-- isi data toko milik setiap seller
INSERT INTO stores (id_user, nama_toko, deskripsi_toko) VALUES
  ((SELECT id_user FROM users WHERE email = 'seller1@fitfound.com'), 'Urban Thread', 'Everyday clothing and shoes with a clean, modern cut.'),
  ((SELECT id_user FROM users WHERE email = 'seller2@fitfound.com'), 'Maison Lune', 'Bags, jewelry, watches, and accessories for women and men.'),
  ((SELECT id_user FROM users WHERE email = 'seller3@fitfound.com'), 'Little Steps', 'Cute and comfy fashion for kids.'),
  ((SELECT id_user FROM users WHERE email = 'pending@fitfound.com'), 'Lestari Batik', 'Handmade batik pieces from Solo.'),
  ((SELECT id_user FROM users WHERE email = 'rejected@fitfound.com'), 'Bima Outlet', NULL),
  ((SELECT id_user FROM users WHERE email = 'suspendedseller@fitfound.com'), 'Kilau Jewelry', 'Affordable jewelry and watches.');

INSERT INTO carts (id_user)
SELECT id_user FROM users WHERE role <> 'admin';

-- isi alamat pengiriman default
INSERT INTO addresses (id_user, label, nama_penerima, no_hp, alamat_lengkap, kota, kode_pos, is_default) VALUES
  ((SELECT id_user FROM users WHERE email = 'buyer@fitfound.com'),
   'Home', 'Gemini Aryasatya', '081200000007', 'Jl. Perintis Kemerdekaan No. 10', 'Makassar', '90245', TRUE),
  ((SELECT id_user FROM users WHERE email = 'seller1@fitfound.com'),
   'Home', 'Jocelyn Isabelle', '081200000002', 'Jl. Sultan Hasanuddin No. 25', 'Makassar', '90111', TRUE),
  ((SELECT id_user FROM users WHERE email = 'seller2@fitfound.com'),
   'Home', 'Pramoedya Adinata', '081200000003', 'Jl. Boulevard Raya No. 8, Panakkukang', 'Makassar', '90231', TRUE),
  ((SELECT id_user FROM users WHERE email = 'seller3@fitfound.com'),
   'Home', 'Abimanyu Pradipta', '081200000004', 'Jl. Andi Pangeran Pettarani No. 45', 'Makassar', '90222', TRUE);

-- 3. isi produk contoh
INSERT INTO products (id_store, id_category, nama_produk, segmen, deskripsi, harga, stok, ukuran, gambar)
SELECT s.id_store, c.id_category, v.nama, v.segmen, v.deskripsi, v.harga, 0, v.ukuran, NULL
FROM (VALUES
  ('Urban Thread', 'Oversized Cotton Tee', 'Unisex', 'Tops', 'Soft 100% cotton t-shirt with a relaxed, boxy fit. Easy to pair with anything.', 129000, 'S,M,L,XL'),
  ('Urban Thread', 'Satin Bow-Tie Blouse', 'Women', 'Tops', 'Elegant satin blouse with a tie-neck bow and long sleeves. Perfect for office looks.', 279000, 'S,M,L'),
  ('Urban Thread', 'Pleated Midi Skirt', 'Women', 'Bottoms', 'Flowy midi skirt with fine pleats and an elastic back waistband.', 219000, 'S,M,L'),
  ('Urban Thread', 'Relaxed Cargo Pants', 'Men', 'Bottoms', 'Comfortable cotton cargo pants with roomy side pockets and a straight leg.', 299000, 'M,L,XL'),
  ('Urban Thread', 'Long Trench Coat', 'Women', 'Outerwear', 'Classic double-breasted trench coat with a belted waist. A timeless layer.', 589000, 'S,M,L'),
  ('Urban Thread', 'Leather Chelsea Boots', 'Men', 'Shoes', 'Genuine leather Chelsea boots with elastic side panels and a durable rubber sole.', 649000, '40,41,42,43'),
  ('Urban Thread', 'Canvas Low Sneakers', 'Unisex', 'Shoes', 'Lightweight canvas sneakers with a cushioned insole for everyday wear.', 279000, '37,38,39,40,41,42'),
  ('Urban Thread', 'Strappy Block Heel Sandals', 'Women', 'Shoes', 'Comfortable strappy sandals with a 5 cm block heel and a cushioned footbed.', 329000, '35,36,37,38,39,40'),
  ('Maison Lune', 'Mini Shoulder Bag', 'Women', 'Bags', 'Compact shoulder bag with an adjustable strap and magnetic closure.', 349000, '-'),
  ('Maison Lune', 'Bifold Leather Wallet', 'Men', 'Wallet', 'Slim bifold wallet made from soft leather with six card slots.', 189000, '-'),
  ('Maison Lune', 'Compact Card Holder', 'Unisex', 'Wallet', 'Minimalist card holder that fits up to five cards and folded notes.', 99000, '-'),
  ('Maison Lune', 'Classic Steel Watch', 'Unisex', 'Watch', 'Minimalist stainless steel watch with a clean dial. Water resistant.', 399000, '-'),
  ('Maison Lune', 'Pearl Drop Earrings', 'Women', 'Jewelry', 'Elegant faux pearl drop earrings with gold-tone hooks.', 129000, '-'),
  ('Maison Lune', 'Dainty Gold Necklace', 'Women', 'Jewelry', 'Thin gold-tone chain necklace with a small pendant. Great for layering.', 159000, '-'),
  ('Maison Lune', 'Striped Silk Tie', 'Men', 'Ties', 'Classic silk-blend tie with diagonal stripes and a smooth finish.', 149000, '-'),
  ('Maison Lune', 'Classic Knit Tie', 'Men', 'Ties', 'Textured knit tie with a flat end for a modern smart-casual look.', 139000, '-'),
  ('Little Steps', 'Kids Dino Graphic Tee', 'Kids', 'Tops', 'Soft cotton tee with a playful dinosaur print. Easy to wash and wear.', 89000, '2Y,4Y,6Y,8Y,10Y'),
  ('Little Steps', 'Kids Velcro Sneakers', 'Kids', 'Shoes', 'Light sneakers with easy velcro straps so kids can put them on by themselves.', 199000, '26,27,28,29,30,31,32'),
  ('Little Steps', 'Kids Quilted Puffer Jacket', 'Kids', 'Outerwear', 'Lightweight quilted puffer jacket with a stand collar. Warm without the bulk.', 259000, '4Y,6Y,8Y'),
  ('Little Steps', 'Kids Mini Backpack', 'Kids', 'Bags', 'Small and light backpack for kids with a front zip pocket and padded straps.', 175000, '-'),
  ('Little Steps', 'Kids Digital Watch', 'Kids', 'Watch', 'Colorful digital watch with alarm and backlight, made for small wrists.', 129000, '-'),
  ('Little Steps', 'Kids Flower Headband', 'Kids', 'Headband', 'Soft padded headband decorated with colorful fabric flowers.', 45000, '-'),
  ('Little Steps', 'Kids Velvet Bow Headband', 'Kids', 'Headband', 'Comfy velvet headband with a big bow on top. Perfect for parties.', 49000, '-'),
  ('Kilau Jewelry', 'Crystal Hoop Earrings', 'Women', 'Jewelry', 'Sparkly hoop earrings with small crystal stones.', 99000, '-'),
  ('Kilau Jewelry', 'Gold-Tone Chain Watch', 'Unisex', 'Watch', 'Slim watch with a gold-tone chain strap.', 259000, '-')
) AS v(toko, nama, segmen, kategori, deskripsi, harga, ukuran)
JOIN categories c ON c.nama_kategori = v.kategori
JOIN stores s ON s.nama_toko = v.toko;

-- isi stok awal per ukuran produk
INSERT INTO product_sizes (id_product, ukuran, stok, urutan)
SELECT p.id_product, v.ukuran, v.stok, v.urutan
FROM (VALUES
  ('Oversized Cotton Tee', 'S', 8, 1), ('Oversized Cotton Tee', 'M', 12, 2), ('Oversized Cotton Tee', 'L', 10, 3), ('Oversized Cotton Tee', 'XL', 6, 4),
  ('Satin Bow-Tie Blouse', 'S', 5, 1), ('Satin Bow-Tie Blouse', 'M', 8, 2), ('Satin Bow-Tie Blouse', 'L', 4, 3),
  ('Pleated Midi Skirt', 'S', 6, 1), ('Pleated Midi Skirt', 'M', 7, 2), ('Pleated Midi Skirt', 'L', 5, 3),
  ('Relaxed Cargo Pants', 'M', 6, 1), ('Relaxed Cargo Pants', 'L', 8, 2), ('Relaxed Cargo Pants', 'XL', 4, 3),
  ('Long Trench Coat', 'S', 3, 1), ('Long Trench Coat', 'M', 5, 2), ('Long Trench Coat', 'L', 2, 3),
  ('Leather Chelsea Boots', '40', 3, 1), ('Leather Chelsea Boots', '41', 4, 2), ('Leather Chelsea Boots', '42', 4, 3), ('Leather Chelsea Boots', '43', 2, 4),
  ('Canvas Low Sneakers', '37', 4, 1), ('Canvas Low Sneakers', '38', 5, 2), ('Canvas Low Sneakers', '39', 6, 3),
  ('Canvas Low Sneakers', '40', 6, 4), ('Canvas Low Sneakers', '41', 5, 5), ('Canvas Low Sneakers', '42', 3, 6),
  ('Strappy Block Heel Sandals', '35', 2, 1), ('Strappy Block Heel Sandals', '36', 4, 2), ('Strappy Block Heel Sandals', '37', 5, 3),
  ('Strappy Block Heel Sandals', '38', 5, 4), ('Strappy Block Heel Sandals', '39', 3, 5), ('Strappy Block Heel Sandals', '40', 2, 6),
  ('Mini Shoulder Bag', '-', 12, 1),
  ('Bifold Leather Wallet', '-', 20, 1),
  ('Compact Card Holder', '-', 25, 1),
  ('Classic Steel Watch', '-', 10, 1),
  ('Pearl Drop Earrings', '-', 18, 1),
  ('Dainty Gold Necklace', '-', 12, 1),
  ('Striped Silk Tie', '-', 16, 1),
  ('Classic Knit Tie', '-', 10, 1),
  ('Kids Dino Graphic Tee', '2Y', 6, 1), ('Kids Dino Graphic Tee', '4Y', 8, 2), ('Kids Dino Graphic Tee', '6Y', 8, 3),
  ('Kids Dino Graphic Tee', '8Y', 6, 4), ('Kids Dino Graphic Tee', '10Y', 4, 5),
  ('Kids Velcro Sneakers', '26', 3, 1), ('Kids Velcro Sneakers', '27', 4, 2), ('Kids Velcro Sneakers', '28', 5, 3),
  ('Kids Velcro Sneakers', '29', 5, 4), ('Kids Velcro Sneakers', '30', 4, 5), ('Kids Velcro Sneakers', '31', 3, 6),
  ('Kids Velcro Sneakers', '32', 2, 7),
  ('Kids Quilted Puffer Jacket', '4Y', 5, 1), ('Kids Quilted Puffer Jacket', '6Y', 6, 2), ('Kids Quilted Puffer Jacket', '8Y', 4, 3),
  ('Kids Mini Backpack', '-', 15, 1),
  ('Kids Digital Watch', '-', 14, 1),
  ('Kids Flower Headband', '-', 30, 1),
  ('Kids Velvet Bow Headband', '-', 25, 1),
  ('Crystal Hoop Earrings', '-', 20, 1),
  ('Gold-Tone Chain Watch', '-', 8, 1)
) AS v(nama, ukuran, stok, urutan)
JOIN products p ON p.nama_produk = v.nama;

-- 4. isi data pesanan contoh
INSERT INTO orders (id_user, id_store, nama_toko, total_harga, status_order, alamat_pengiriman, catatan, created_at, updated_at)
SELECT u.id_user, s.id_store, s.nama_toko, 0, v.status_order,
       a.nama_penerima || ' (' || a.no_hp || ') — ' || a.alamat_lengkap || ', ' || a.kota || ' ' || a.kode_pos,
       v.catatan, v.tanggal, v.tanggal
FROM (VALUES
  ('buyer@fitfound.com',   'Urban Thread', 'completed',  TIMESTAMP '2026-10-05 10:15:00', NULL),
  ('seller2@fitfound.com', 'Urban Thread', 'completed',  TIMESTAMP '2026-10-08 13:00:00', NULL),
  ('buyer@fitfound.com',   'Maison Lune',  'completed',  TIMESTAMP '2026-10-12 19:30:00', NULL),
  ('seller3@fitfound.com', 'Urban Thread', 'completed',  TIMESTAMP '2026-10-15 09:45:00', NULL),
  ('seller1@fitfound.com', 'Maison Lune',  'completed',  TIMESTAMP '2026-10-18 16:20:00', 'Please use gift wrapping.'),
  ('buyer@fitfound.com',   'Little Steps', 'completed',  TIMESTAMP '2026-10-20 11:10:00', 'For my little sister.'),
  ('seller3@fitfound.com', 'Maison Lune',  'completed',  TIMESTAMP '2026-10-25 20:05:00', NULL),
  ('seller1@fitfound.com', 'Little Steps', 'completed',  TIMESTAMP '2026-10-28 08:40:00', NULL),
  ('seller2@fitfound.com', 'Little Steps', 'completed',  TIMESTAMP '2026-11-06 14:30:00', 'Birthday gift for my niece.'),
  ('buyer@fitfound.com',   'Little Steps', 'cancelled',  TIMESTAMP '2026-11-10 09:00:00', NULL),
  ('buyer@fitfound.com',   'Maison Lune',  'shipped',    TIMESTAMP '2026-11-14 19:45:00', NULL),
  ('seller2@fitfound.com', 'Urban Thread', 'shipped',    TIMESTAMP '2026-11-15 10:30:00', NULL),
  ('seller1@fitfound.com', 'Maison Lune',  'processing', TIMESTAMP '2026-11-16 08:20:00', 'A gift for my dad.'),
  ('buyer@fitfound.com',   'Urban Thread', 'pending',    TIMESTAMP '2026-11-18 21:05:00', 'Please wrap it nicely, it is a gift.')
) AS v(email, toko, status_order, tanggal, catatan)
JOIN users u ON u.email = v.email
JOIN stores s ON s.nama_toko = v.toko
JOIN addresses a ON a.id_user = u.id_user AND a.is_default = TRUE
ORDER BY v.tanggal;

-- isi detail item untuk setiap pesanan
INSERT INTO order_items (id_order, id_product, nama_produk, gambar, ukuran, jumlah, harga_satuan, created_at, updated_at)
SELECT o.id_order, p.id_product, p.nama_produk, p.gambar, v.ukuran, v.jumlah, p.harga, o.created_at, o.created_at
FROM (VALUES
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-05 10:15:00', 'Oversized Cotton Tee',       'L',        2),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-05 10:15:00', 'Canvas Low Sneakers',        '39',       1),
  ('seller2@fitfound.com', TIMESTAMP '2026-10-08 13:00:00', 'Oversized Cotton Tee',       'M',        1),
  ('seller2@fitfound.com', TIMESTAMP '2026-10-08 13:00:00', 'Satin Bow-Tie Blouse',       'S',        1),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-12 19:30:00', 'Classic Steel Watch',        '-',        1),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-12 19:30:00', 'Mini Shoulder Bag',          '-',        1),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-12 19:30:00', 'Pearl Drop Earrings',        '-',        1),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-15 09:45:00', 'Oversized Cotton Tee',       'XL',       1),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-15 09:45:00', 'Canvas Low Sneakers',        '42',       1),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-15 09:45:00', 'Satin Bow-Tie Blouse',       'M',        1),
  ('seller1@fitfound.com', TIMESTAMP '2026-10-18 16:20:00', 'Classic Steel Watch',        '-',        1),
  ('seller1@fitfound.com', TIMESTAMP '2026-10-18 16:20:00', 'Pearl Drop Earrings',        '-',        1),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-20 11:10:00', 'Kids Flower Headband',       '-',        2),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-20 11:10:00', 'Kids Mini Backpack',         '-',        1),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-25 20:05:00', 'Mini Shoulder Bag',          '-',        1),
  ('seller1@fitfound.com', TIMESTAMP '2026-10-28 08:40:00', 'Kids Mini Backpack',         '-',        1),
  ('seller2@fitfound.com', TIMESTAMP '2026-11-06 14:30:00', 'Kids Velvet Bow Headband',   '-',        1),
  ('seller2@fitfound.com', TIMESTAMP '2026-11-06 14:30:00', 'Kids Flower Headband',       '-',        2),
  ('buyer@fitfound.com',   TIMESTAMP '2026-11-10 09:00:00', 'Kids Quilted Puffer Jacket', '6Y',       1),
  ('buyer@fitfound.com',   TIMESTAMP '2026-11-14 19:45:00', 'Dainty Gold Necklace',       '-',        1),
  ('seller2@fitfound.com', TIMESTAMP '2026-11-15 10:30:00', 'Leather Chelsea Boots',      '42',       1),
  ('seller1@fitfound.com', TIMESTAMP '2026-11-16 08:20:00', 'Bifold Leather Wallet',      '-',        1),
  ('buyer@fitfound.com',   TIMESTAMP '2026-11-18 21:05:00', 'Satin Bow-Tie Blouse',       'M',        1)
) AS v(email, tanggal, produk, ukuran, jumlah)
JOIN users u ON u.email = v.email
JOIN orders o ON o.id_user = u.id_user AND o.created_at = v.tanggal
JOIN products p ON p.nama_produk = v.produk;

-- hitung total harga pesanan dari semua item
UPDATE orders o
SET total_harga = x.total
FROM (SELECT id_order, SUM(harga_satuan * jumlah) AS total FROM order_items GROUP BY id_order) x
WHERE o.id_order = x.id_order;

-- kurangi stok ukuran sesuai pesanan yang tidak dibatalkan
UPDATE product_sizes ps
SET stok = ps.stok - x.terjual
FROM (
  SELECT oi.id_product, oi.ukuran, SUM(oi.jumlah) AS terjual
  FROM order_items oi
  JOIN orders o ON o.id_order = oi.id_order
  WHERE o.status_order <> 'cancelled'
  GROUP BY oi.id_product, oi.ukuran
) x
WHERE ps.id_product = x.id_product
  AND ps.ukuran = x.ukuran;

-- 5. isi ulasan dan rating dari pesanan selesai
INSERT INTO reviews (id_user, id_product, id_order, rating, komentar, created_at, updated_at)
SELECT u.id_user, oi.id_product, oi.id_order, v.rating, v.komentar, v.tanggal, v.tanggal
FROM (VALUES
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-05 10:15:00', 'Oversized Cotton Tee',     5, 'Super soft and the oversized fit is perfect. Bought two!',            TIMESTAMP '2026-10-09 18:00:00'),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-05 10:15:00', 'Canvas Low Sneakers',      5, 'Very comfortable and true to size. I wear them every day!',          TIMESTAMP '2026-10-09 18:05:00'),
  ('seller2@fitfound.com', TIMESTAMP '2026-10-08 13:00:00', 'Oversized Cotton Tee',     5, 'Great quality cotton, does not shrink after washing.',               TIMESTAMP '2026-10-13 09:20:00'),
  ('seller2@fitfound.com', TIMESTAMP '2026-10-08 13:00:00', 'Satin Bow-Tie Blouse',     4, 'Beautiful blouse, but the satin wrinkles easily.',                   TIMESTAMP '2026-10-13 09:25:00'),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-12 19:30:00', 'Classic Steel Watch',      5, 'Looks expensive and keeps perfect time.',                            TIMESTAMP '2026-10-17 20:10:00'),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-12 19:30:00', 'Mini Shoulder Bag',        5, 'Small but fits my phone, wallet, and keys. Love it!',                TIMESTAMP '2026-10-17 20:12:00'),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-12 19:30:00', 'Pearl Drop Earrings',      4, 'Pretty and light. The hooks are a little thin.',                     TIMESTAMP '2026-10-17 20:15:00'),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-15 09:45:00', 'Oversized Cotton Tee',     4, 'Nice tee, the XL is quite big so size down if unsure.',              TIMESTAMP '2026-10-20 07:45:00'),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-15 09:45:00', 'Canvas Low Sneakers',      5, 'Light and comfy, great for walking all day.',                        TIMESTAMP '2026-10-20 07:50:00'),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-15 09:45:00', 'Satin Bow-Tie Blouse',     4, 'My wife likes it. Color is slightly different from the photo.',      TIMESTAMP '2026-10-20 07:55:00'),
  ('seller1@fitfound.com', TIMESTAMP '2026-10-18 16:20:00', 'Classic Steel Watch',      4, 'Good watch for the price, strap is a bit stiff at first.',           TIMESTAMP '2026-10-23 12:30:00'),
  ('seller1@fitfound.com', TIMESTAMP '2026-10-18 16:20:00', 'Pearl Drop Earrings',      5, 'Elegant and goes with everything. Will buy again.',                  TIMESTAMP '2026-10-23 12:35:00'),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-20 11:10:00', 'Kids Flower Headband',     4, 'Cute colors, my sister wears it to school.',                         TIMESTAMP '2026-10-25 15:00:00'),
  ('buyer@fitfound.com',   TIMESTAMP '2026-10-20 11:10:00', 'Kids Mini Backpack',       4, 'Good size for kids, zipper is smooth.',                              TIMESTAMP '2026-10-25 15:05:00'),
  ('seller3@fitfound.com', TIMESTAMP '2026-10-25 20:05:00', 'Mini Shoulder Bag',        5, 'Bought it as a gift and she loved it.',                              TIMESTAMP '2026-10-30 19:00:00'),
  ('seller1@fitfound.com', TIMESTAMP '2026-10-28 08:40:00', 'Kids Mini Backpack',       5, 'Sturdy and lightweight. My nephew uses it every day.',               TIMESTAMP '2026-11-02 10:10:00'),
  ('seller2@fitfound.com', TIMESTAMP '2026-11-06 14:30:00', 'Kids Velvet Bow Headband', 5, 'So cute and soft, my niece loves it.',                               TIMESTAMP '2026-11-09 11:30:00'),
  ('seller2@fitfound.com', TIMESTAMP '2026-11-06 14:30:00', 'Kids Flower Headband',     5, 'Comfortable, does not squeeze the head.',                            TIMESTAMP '2026-11-09 11:35:00')
) AS v(email, tanggal_order, produk, rating, komentar, tanggal)
JOIN users u ON u.email = v.email
JOIN orders o ON o.id_user = u.id_user AND o.created_at = v.tanggal_order AND o.status_order = 'completed'
JOIN order_items oi ON oi.id_order = o.id_order AND oi.nama_produk = v.produk;

-- 6. isi riwayat jumlah terjual awal produk
UPDATE products p
SET jumlah_terjual = v.terjual
FROM (VALUES
  ('Oversized Cotton Tee', 408),
  ('Canvas Low Sneakers', 354),
  ('Kids Flower Headband', 314),
  ('Classic Steel Watch', 286),
  ('Pearl Drop Earrings', 263),
  ('Mini Shoulder Bag', 239),
  ('Kids Mini Backpack', 212),
  ('Satin Bow-Tie Blouse', 228),
  ('Compact Card Holder', 198),
  ('Bifold Leather Wallet', 176),
  ('Dainty Gold Necklace', 152),
  ('Pleated Midi Skirt', 145),
  ('Kids Digital Watch', 130),
  ('Relaxed Cargo Pants', 120),
  ('Kids Velvet Bow Headband', 94),
  ('Leather Chelsea Boots', 88),
  ('Striped Silk Tie', 73),
  ('Long Trench Coat', 64),
  ('Kids Quilted Puffer Jacket', 57),
  ('Classic Knit Tie', 41),
  ('Strappy Block Heel Sandals', 67),
  ('Kids Dino Graphic Tee', 112),
  ('Kids Velcro Sneakers', 79),
  ('Crystal Hoop Earrings', 36),
  ('Gold-Tone Chain Watch', 12)
) AS v(nama, terjual)
WHERE p.nama_produk = v.nama;

-- tambahkan jumlah terjual dari pesanan selesai
UPDATE products p
SET jumlah_terjual = p.jumlah_terjual + x.total
FROM (
  SELECT oi.id_product, SUM(oi.jumlah) AS total
  FROM order_items oi
  JOIN orders o ON o.id_order = oi.id_order
  WHERE o.status_order = 'completed'
  GROUP BY oi.id_product
) x
WHERE p.id_product = x.id_product;

-- 7. perbarui total stok produk dari jumlah stok semua ukuran
UPDATE products p
SET stok = x.total
FROM (SELECT id_product, SUM(stok) AS total FROM product_sizes GROUP BY id_product) x
WHERE p.id_product = x.id_product;