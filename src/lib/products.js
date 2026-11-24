import pool from './db';

// kondisi sql untuk akun yg aktif atau masa suspendnya sudah selesai
export function activeAccountSql(tableAlias) {
  return `(${tableAlias}.status_akun = 'active' OR (${tableAlias}.status_akun = 'suspended' AND ${tableAlias}.suspend_sampai IS NOT NULL AND ${tableAlias}.suspend_sampai <= CURRENT_TIMESTAMP))`;
}

export const PRODUCT_CARD_SELECT = `
  SELECT p.id_product, p.id_store, p.nama_produk, p.segmen, p.harga, p.stok, p.gambar, p.created_at, p.jumlah_terjual,
         c.nama_kategori, s.nama_toko,
         COALESCE(r.avg_rating, 0) AS avg_rating,
         COALESCE(r.review_count, 0) AS review_count
  FROM products p
  JOIN categories c ON p.id_category = c.id_category
  JOIN stores s ON p.id_store = s.id_store
  JOIN users su ON su.id_user = s.id_user AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
  LEFT JOIN (
    SELECT id_product, AVG(rating) AS avg_rating, COUNT(*) AS review_count
    FROM reviews
    GROUP BY id_product
  ) r ON r.id_product = p.id_product
`;

// ambil id toko seller yg memilih "Hide Your Own Products", null kalau tidak disembunyikan
export async function getHiddenStoreId(sessionData) {
  if (!sessionData || sessionData.role !== 'seller' || !sessionData.storeId) {
    return null;
  }

  try {
    const storeResult = await pool.query(
      'SELECT sembunyikan_produk FROM stores WHERE id_store = $1',
      [sessionData.storeId]
    );
    if (storeResult.rows.length > 0 && storeResult.rows[0].sembunyikan_produk) {
      return sessionData.storeId;
    }
  } catch {
    return null;
  }

  return null;
}

// ambil daftar id produk di wishlist untuk sesi buyer atau seller
export async function getWishlistIds(sessionData) {
  if (!sessionData || (sessionData.role !== 'buyer' && sessionData.role !== 'seller')) {
    return [];
  }

  try {
    const wishlistResult = await pool.query(
      'SELECT id_product FROM wishlists WHERE id_user = $1',
      [sessionData.id]
    );
    const productIds = [];

    for (const rowItem of wishlistResult.rows) {
      productIds.push(rowItem.id_product);
    }

    return productIds;
  } catch {
    return [];
  }
}