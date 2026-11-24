import { NextResponse } from 'next/server';
import pool from './db';
import { getCurrentUser, isShopperRole } from './auth';

// kirim respons jsonerror dengan status tertentu
export function jsonError(statusCode, errorMessage) {
  return NextResponse.json({ error: errorMessage }, { status: statusCode });
}

// ceksiapa peminta api buyer atau seller
export async function requireBuyerApi() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { response: jsonError(401, 'Please sign in first.') };
  }

  if (!isShopperRole(currentUser.role)) {
    return { response: jsonError(403, 'Admin accounts cannot shop.') };
  }

  if (currentUser.role === 'seller') {
    return { response: jsonError(403, 'Seller accounts cannot shop.') };
  }

  return { user: currentUser };
}

// ambil id toko milik user atau null klo belum punya toko
export async function getOwnStoreId(userId) {
  const storeResult = await pool.query('SELECT id_store FROM stores WHERE id_user = $1', [userId]);
  if (storeResult.rows.length === 0) {
    return null;
  }

  return storeResult.rows[0].id_store;
}

// ambil id keranjang user atau buat baru kalau belum ada
export async function getOrCreateCartId(userId) {
  await pool.query(
    'INSERT INTO carts (id_user) VALUES ($1) ON CONFLICT (id_user) DO NOTHING',
    [userId]
  );

  const cartResult = await pool.query('SELECT id_cart FROM carts WHERE id_user = $1', [userId]);
  return cartResult.rows[0].id_cart;
}

// hitung total item n total harga di keranjang
export async function getCartSummary(cartId) {
  const summaryResult = await pool.query(
    `SELECT COALESCE(SUM(ci.jumlah), 0)::int AS total_items,
            COALESCE(SUM(ci.jumlah * p.harga), 0) AS total_price
     FROM cart_items ci
     JOIN products p ON p.id_product = ci.id_product
     WHERE ci.id_cart = $1`,
    [cartId]
  );

  return {
    totalItems: summaryResult.rows[0].total_items,
    totalPrice: Number(summaryResult.rows[0].total_price),
  };
}

// baca dari request n kembalikan null kalau gagal diperse
export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}