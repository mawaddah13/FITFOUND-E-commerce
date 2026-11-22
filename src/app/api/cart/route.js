import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  jsonError,
  requireBuyerApi,
  getOrCreateCartId,
  getCartSummary,
  getOwnStoreId,
  readJsonBody,
} from '@/lib/api';
import { toPositiveInt } from '@/lib/validation';
import { hasSize, sizeSuffix } from '@/lib/sizes';
import { activeAccountSql } from '@/lib/products';

// ambil isi keranjang belanja user yang sedang login
export async function GET() {
  const authResult = await requireBuyerApi();
  if (authResult.response) {
    return authResult.response;
  }

  try {
    const cartId = await getOrCreateCartId(authResult.user.id_user);
    const cartItemsResult = await pool.query(
      `SELECT ci.id_cart_item, ci.id_product, ci.ukuran, ci.jumlah,
              p.nama_produk, p.harga, COALESCE(ps.stok, 0) AS stok, p.gambar, s.nama_toko
       FROM cart_items ci
       JOIN products p ON p.id_product = ci.id_product
       JOIN stores s ON s.id_store = p.id_store
       LEFT JOIN product_sizes ps ON ps.id_product = ci.id_product AND ps.ukuran = ci.ukuran
       WHERE ci.id_cart = $1
       ORDER BY ci.created_at DESC`,
      [cartId]
    );
    const summary = await getCartSummary(cartId);

    return NextResponse.json({
      items: cartItemsResult.rows,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
    });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return jsonError(500, 'Could not load your cart right now. Please try again.');
  }
}

// cek data input lalu tambah produk n ukuran ke keranjang belanja
export async function POST(request) {
  const authResult = await requireBuyerApi();
  if (authResult.response) {
    return authResult.response;
  }

  const body = await readJsonBody(request);
  if (!body) {
    return jsonError(400, 'Request data is not valid. Please try again.');
  }

  const productId = toPositiveInt(body.id_product);
  let quantity = 1;
  if (body.jumlah !== undefined) {
    quantity = toPositiveInt(body.jumlah);
  }

  if (!productId) {
    return jsonError(400, 'Selected product is not valid.');
  }

  if (!quantity) {
    return jsonError(400, 'Quantity must be at least 1.');
  }

  try {
    const productResult = await pool.query(
      `SELECT p.id_product, p.id_store, p.nama_produk
       FROM products p
       JOIN stores s ON s.id_store = p.id_store
       JOIN users su ON su.id_user = s.id_user
         AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
       WHERE p.id_product = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return jsonError(404, 'Product not found or no longer available.');
    }

    const product = productResult.rows[0];
    const ownStoreId = await getOwnStoreId(authResult.user.id_user);

    if (ownStoreId && ownStoreId === product.id_store) {
      return jsonError(403, 'You cannot buy products from your own store.');
    }

    const sizesResult = await pool.query(
      'SELECT ukuran, stok FROM product_sizes WHERE id_product = $1 ORDER BY urutan ASC',
      [productId]
    );
    const sizes = sizesResult.rows;

    if (sizes.length === 0) {
      return jsonError(409, 'This product has no stock available yet.');
    }

    let selectedSizeName = '';
    if (typeof body.ukuran === 'string') {
      selectedSizeName = body.ukuran.trim();
    }

    if (selectedSizeName === '') {
      const firstAvailableSize = sizes.find(function findAvailableSize(sizeItem) {
        return sizeItem.stok > 0;
      });

      if (!firstAvailableSize) {
        return jsonError(409, 'This product is currently sold out.');
      }

      selectedSizeName = firstAvailableSize.ukuran;
    }

    const matchedSize = sizes.find(function findMatchingSize(sizeItem) {
      return sizeItem.ukuran === selectedSizeName;
    });

    if (!matchedSize) {
      return jsonError(400, `Size "${selectedSizeName}" is not available for this product.`);
    }

    if (matchedSize.stok <= 0) {
      let soldOutMessage = 'This product is currently sold out.';
      if (hasSize(selectedSizeName)) {
        soldOutMessage = `Size ${selectedSizeName} is sold out.`;
      }
      return jsonError(409, soldOutMessage);
    }

    const cartId = await getOrCreateCartId(authResult.user.id_user);
    const existingItemResult = await pool.query(
      `SELECT id_cart_item, jumlah FROM cart_items
       WHERE id_cart = $1 AND id_product = $2 AND ukuran = $3`,
      [cartId, productId, selectedSizeName]
    );

    let existingQty = 0;
    if (existingItemResult.rows.length > 0) {
      existingQty = existingItemResult.rows[0].jumlah;
    }

    if (existingQty + quantity > matchedSize.stok) {
      return jsonError(
        409,
        `Only ${matchedSize.stok} item(s) left${sizeSuffix(selectedSizeName)}. You already have ${existingQty} in your cart.`
      );
    }

    await pool.query(
      `INSERT INTO cart_items (id_cart, id_product, ukuran, jumlah)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_cart, id_product, ukuran)
       DO UPDATE SET jumlah = cart_items.jumlah + EXCLUDED.jumlah`,
      [cartId, productId, selectedSizeName, quantity]
    );

    const summary = await getCartSummary(cartId);
    let sizeLabel = '';
    if (hasSize(selectedSizeName)) {
      sizeLabel = ` (size ${selectedSizeName})`;
    }

    return NextResponse.json(
      {
        message: `${product.nama_produk}${sizeLabel} added to cart.`,
        totalItems: summary.totalItems,
        totalPrice: summary.totalPrice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return jsonError(500, 'Could not add this item to your cart. Please try again.');
  }
}