import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jsonError, requireBuyerApi } from '@/lib/api';
import { toPositiveInt } from '@/lib/validation';

// ambil id produk trs hapus produk dari wishlist pembeli
export async function DELETE(request, { params }) {
  const auth = await requireBuyerApi();
  if (auth.response) {
    return auth.response;
  }

  const resolvedParams = await params;
  const productId = toPositiveInt(resolvedParams.productId);
  if (!productId) {
    return jsonError(400, 'Product is not valid.');
  }

  try {
    const resDeleteWishlist = await pool.query(
      'DELETE FROM wishlists WHERE id_user = $1 AND id_product = $2',
      [auth.user.id_user, productId]
    );

    let removedMessage = 'Removed from wishlist.';
    if (resDeleteWishlist.rowCount === 0) {
      removedMessage = 'Product was not in wishlist.';
    }

    return NextResponse.json({ message: removedMessage, wishlisted: false });
  } catch (error) {
    console.error('DELETE /api/wishlist error:', error);
    return jsonError(500, 'Failed to update wishlist.');
  }
}