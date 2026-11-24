import Link from 'next/link';
import { getSession } from '@/lib/session';
import ProductCard from '@/components/ProductCard';
import { getWishlistIds, getHiddenStoreId } from '@/lib/products';
import { getFeaturedProducts, FEATURED_MIN_SOLD, FEATURED_MIN_RATING } from '@/lib/catalog';

// ambil produk unggulan trs tampilkan di halaman best sellers
export default async function BestSellersPage() {
  const session = await getSession();

  let products = [];
  let wishlistIds = [];

  try {
    const hiddenStoreId = await getHiddenStoreId(session);
    products = await getFeaturedProducts(hiddenStoreId);
    wishlistIds = await getWishlistIds(session);
  } catch (error) {
    console.error('Failed to load best sellers:', error.message);
  }

  let content = null;
  if (products.length === 0) {
    content = (
      <div className="py-20 text-center bg-white/60 rounded-2xl border border-neutral-200/80">
        <p className="text-sm text-neutral-950 mb-3">
          No best sellers available right now. Check back soon or browse the full catalog.
        </p>
        <Link
          href="/products"
          className="text-xs font-medium text-neutral-900 underline underline-offset-4"
        >
          View all products
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(function buildFeaturedCard(productItem, itemIndex) {
          const isProductWishlisted = wishlistIds.includes(productItem.id_product);
          return (
            <ProductCard
              key={productItem.id_product}
              product={productItem}
              session={session}
              index={itemIndex}
              isWishlisted={isProductWishlisted}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--abumuda) text-neutral-900">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-neutral-950">Best Sellers</h1>
          <p className="mt-1 text-sm text-neutral-950">
            Featured Collection
          </p>
        </div>
        {content}
      </main>
    </div>
  );
}