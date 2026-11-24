import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jsonError, requireBuyerApi, readJsonBody } from '@/lib/api';
import { toPositiveInt } from '@/lib/validation';

// ambil daftar id produk yg lagi disimpan di wishlist
export async function GET() {
  const auth = await requireBuyerApi();
  if (auth.response) {
    return auth.response;
  }

  const resWishlistRows = await pool.query(
    'SELECT id_product FROM wishlists WHERE id_user = $1 ORDER BY created_at DESC',
    [auth.user.id_user]
  );

  const productIds = [];
  for (const rowItem of resWishlistRows.rows) {
    productIds.push(rowItem.id_product);
  }

  return NextResponse.json({ productIds });
}

// msukkan produk ke wishlist pembeli, kalau adami, biarkan saja
export async function POST(request) {
  const auth = await requireBuyerApi();
  if (auth.response) {
    return auth.response;
  }

  const requestBody = await readJsonBody(request);
  let rawProductId = null;
  if (requestBody && requestBody.id_product !== undefined) {
    rawProductId = requestBody.id_product;
  }

  const productId = toPositiveInt(rawProductId);
  if (!productId) {
    return jsonError(400, 'Product is not valid.');
  }

  try {
    const resProductCheck = await pool.query(
      'SELECT id_product FROM products WHERE id_product = $1',
      [productId]
    );
    if (resProductCheck.rows.length === 0) {
      return jsonError(404, 'Product not found.');
    }

    await pool.query(
      `INSERT INTO wishlists (id_user, id_product) VALUES ($1, $2)
       ON CONFLICT (id_user, id_product) DO NOTHING`,
      [auth.user.id_user, productId]
    );

    return NextResponse.json(
      { message: 'Added to wishlist.', wishlisted: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/wishlist error:', error);
    return jsonError(500, 'Could not update your wishlist. Please try again.');
  }
}