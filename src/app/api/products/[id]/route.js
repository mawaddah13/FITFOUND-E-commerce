import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jsonError } from '@/lib/api';
import { toPositiveInt } from '@/lib/validation';
import { activeAccountSql } from '@/lib/products';

// cek id produk buat ambil ringkasan produk beserta daftar ukuran n stoknya
export async function GET(request, { params }) {
  const resolvedParams = await params;
  const productId = toPositiveInt(resolvedParams.id);

  if (!productId) {
    return jsonError(400, 'Product is not valid.');
  }

  try {
    const productResult = await pool.query(
      `SELECT p.id_product, p.nama_produk, p.harga, p.gambar, p.stok
       FROM products p
       JOIN stores s ON s.id_store = p.id_store
       JOIN users su ON su.id_user = s.id_user
         AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
       WHERE p.id_product = $1`,
      [productId]
    );
    if (productResult.rows.length === 0) {
      return jsonError(404, 'Product not found.');
    }

    const sizesResult = await pool.query(
      `SELECT ukuran, stok
       FROM product_sizes
       WHERE id_product = $1
       ORDER BY urutan ASC`,
      [productId]
    );

    return NextResponse.json({
      product: productResult.rows[0],
      sizes: sizesResult.rows,
    });
  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return jsonError(500, 'Failed to load product.');
  }
}