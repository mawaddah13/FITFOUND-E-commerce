import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import { getSession } from '@/lib/session';
import ProductCard from '@/components/ProductCard';
import { PageHeader, EmptyState } from '@/components/ui';
import { PRODUCT_CARD_SELECT } from '@/lib/products';

// ambil produk tersimpan trs tampilkan halaman wishlist buyer
export default async function WishlistPage() {
  const user = await requireBuyerPage();
  const session = await getSession();

  const resWishlistProducts = await pool.query(
    `${PRODUCT_CARD_SELECT}
     JOIN wishlists w ON w.id_product = p.id_product AND w.id_user = $1
     ORDER BY w.created_at DESC`,
    [user.id_user]
  );
  const products = resWishlistProducts.rows;

  let wishlistContent = null;
  if (products.length === 0) {
    wishlistContent = (
      <EmptyState
        message="Your wishlist is empty. Tap the heart icon on any product you love to add it here."
        actionHref="/products"
        actionLabel="Browse Products"
      />
    );
  } else {
    wishlistContent = (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(function buildWishlistCard(productItem) {
          return (
            <ProductCard
              key={productItem.id_product}
              product={productItem}
              session={session}
              isWishlisted={true}
              refreshOnWishlist={true}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wishlist"
        description="Products you love and want, kept separate from your cart."
      />
      {wishlistContent}
    </div>
  );
}