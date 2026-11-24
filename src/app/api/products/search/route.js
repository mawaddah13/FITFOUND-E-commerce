import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jsonError } from '@/lib/api';
import { activeAccountSql, getHiddenStoreId } from '@/lib/products';
import { getSession } from '@/lib/session';

// cari produk yg cocok sama ketikan di search bar
export async function GET(request) {
  const rawQuery = request.nextUrl.searchParams.get('q');
  let searchKeyword = '';
  if (rawQuery) {
    searchKeyword = rawQuery.trim();
  }

  if (searchKeyword.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (searchKeyword.length > 100) {
    return jsonError(400, 'Keyword is too long.');
  }

  try {
    const hiddenStoreId = await getHiddenStoreId(await getSession());
    const searchResult = await pool.query(
      `SELECT p.id_product, p.nama_produk, p.harga, p.gambar, c.nama_kategori
       FROM products p
       JOIN categories c ON c.id_category = p.id_category
       JOIN stores s ON s.id_store = p.id_store
       JOIN users su ON su.id_user = s.id_user
         AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
       WHERE p.nama_produk ILIKE $1
         AND ($2::int IS NULL OR p.id_store <> $2::int)
       ORDER BY p.stok > 0 DESC, p.nama_produk ASC`,
      [`%${searchKeyword}%`, hiddenStoreId]
    );
    return NextResponse.json({ results: searchResult.rows });
  } catch (error) {
    console.error('GET /api/products/search error:', error);
    return jsonError(500, 'Failed to search products.');
  }
}