import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  jsonError,
  requireBuyerApi,
  getOrCreateCartId,
  getCartSummary,
  readJsonBody,
} from '@/lib/api';
import { toPositiveInt } from '@/lib/validation';

// ambil data item keranjang milik user beserta stok ukurannya
async function findOwnedItem(cartItemId, cartId) {
  const itemResult = await pool.query(
    `SELECT ci.id_cart_item, ci.jumlah, ci.ukuran, COALESCE(ps.stok, 0) AS stok, p.nama_produk
     FROM cart_items ci
     JOIN products p ON p.id_product = ci.id_product
     LEFT JOIN product_sizes ps ON ps.id_product = ci.id_product AND ps.ukuran = ci.ukuran
     WHERE ci.id_cart_item = $1 AND ci.id_cart = $2`,
    [cartItemId, cartId]
  );

  if (itemResult.rows.length === 0) {
    return null;
  }

  return itemResult.rows[0];
}

// cek jumlah baru lalu perbarui jumlah item di keranjang
export async function PATCH(request, { params }) {
  const authResult = await requireBuyerApi();
  if (authResult.response) {
    return authResult.response;
  }

  const resolvedParams = await params;
  const cartItemId = toPositiveInt(resolvedParams.id);
  if (!cartItemId) {
    return jsonError(400, 'Cart item is not valid.');
  }

  const body = await readJsonBody(request);
  let rawQuantity = undefined;
  if (body) {
    rawQuantity = body.jumlah;
  }
  const newQuantity = toPositiveInt(rawQuantity);

  if (!newQuantity) {
    return jsonError(400, 'Quantity must be at least 1.');
  }

  try {
    const cartId = await getOrCreateCartId(authResult.user.id_user);
    const ownedItem = await findOwnedItem(cartItemId, cartId);

    if (!ownedItem) {
      return jsonError(404, 'Cart item was not found in your cart.');
    }

    if (newQuantity > ownedItem.stok) {
      return jsonError(
        409,
        `Only ${ownedItem.stok} item(s) of ${ownedItem.nama_produk} left for size ${ownedItem.ukuran}.`
      );
    }

    await pool.query(
      'UPDATE cart_items SET updated_at = CURRENT_TIMESTAMP, jumlah = $1 WHERE id_cart_item = $2',
      [newQuantity, cartItemId]
    );

    const summary = await getCartSummary(cartId);
    return NextResponse.json({
      message: 'Quantity updated.',
      jumlah: newQuantity,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
    });
  } catch (error) {
    console.error('PATCH /api/cart/[id] error:', error);
    return jsonError(500, 'Could not update item quantity. Please try again.');
  }
}

// hapus item dari keranjang belanja user
export async function DELETE(request, { params }) {
  const authResult = await requireBuyerApi();
  if (authResult.response) {
    return authResult.response;
  }

  const resolvedParams = await params;
  const cartItemId = toPositiveInt(resolvedParams.id);
  if (!cartItemId) {
    return jsonError(400, 'Cart item is not valid.');
  }

  try {
    const cartId = await getOrCreateCartId(authResult.user.id_user);
    const deleteResult = await pool.query(
      'DELETE FROM cart_items WHERE id_cart_item = $1 AND id_cart = $2 RETURNING id_cart_item',
      [cartItemId, cartId]
    );

    if (deleteResult.rowCount === 0) {
      return jsonError(404, 'Cart item was not found in your cart.');
    }

    const summary = await getCartSummary(cartId);
    return NextResponse.json({
      message: 'Item removed from cart.',
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
    });
  } catch (error) {
    console.error('DELETE /api/cart/[id] error:', error);
    return jsonError(500, 'Could not remove item from cart. Please try again.');
  }
}