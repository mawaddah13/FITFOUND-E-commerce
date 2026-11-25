import { getSession } from '@/lib/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import { getWishlistIds } from '@/lib/products';
import { parseCatalogParams, queryCatalog } from '@/lib/catalog';

// batas jumlah produk yg tampil di Home, ubah angkanya di sini
const NEW_ARRIVALS_LIMIT = 8;
const RECOMMENDATION_LIMIT = 8;

// Home tidak punya filter sama sekali: link lama spt /?segment=Women atau pencarian dari Home
// diarahkan ke All Products (/products) yg punya Filter n Sort by
export default async function HomePage({ searchParams }) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;
  const filters = parseCatalogParams(resolvedSearchParams);

  if (filters.hasFilter || filters.sort !== 'newest') {
    const catalogParams = new URLSearchParams();
    for (const filterKey of ['q', 'segment', 'kategori', 'min', 'max']) {
      if (filters[filterKey]) {
        catalogParams.set(filterKey, filters[filterKey]);
      }
    }
    if (filters.sort !== 'newest') {
      catalogParams.set('sort', filters.sort);
    }
    redirect(`/products?${catalogParams.toString()}`);
  }

  let products = [];
  let recommended = [];
  let wishlistIds = [];

  try {
    // ambil maksimal 8 produk baru datang dan 8 rekomendasi acak yg stoknya tersedia
    products = await queryCatalog(filters, {
      inStockOnly: true,
      limit: NEW_ARRIVALS_LIMIT,
    });

    recommended = await queryCatalog(filters, {
      inStockOnly: true,
      random: true,
      limit: RECOMMENDATION_LIMIT,
    });
    wishlistIds = await getWishlistIds(session);
  } catch (error) {
    console.error('Failed to load products:', error.message);
  }

  let productGridContent = null;
  if (products.length === 0) {
    productGridContent = (
      <div className="py-16 text-center bg-white/60 rounded-2xl border border-neutral-200/70">
        <p className="text-sm text-neutral-950 mb-3">No products found.</p>
        <Link
          href="/products"
          className="text-xs font-medium text-neutral-900 underline underline-offset-4"
        >
          Show all products
        </Link>
      </div>
    );
  } else {
    productGridContent = (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(function buildCatalogProductCard(productItem, itemIndex) {
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

  let recommendedSection = null;
  if (recommended.length > 0) {
    recommendedSection = (
      <section className="mb-12 pb-10 border-b border-neutral-200/70">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-950">
            Recommended For You
          </h2>
          <p className="mt-1 text-sm text-neutral-950">
            Picked at random every time you open this page.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommended.map(function buildRecommendedCard(recProduct, recIndex) {
            const isRecWishlisted = wishlistIds.includes(recProduct.id_product);
            return (
              <ProductCard
                key={recProduct.id_product}
                product={recProduct}
                session={session}
                index={recIndex}
                isWishlisted={isRecWishlisted}
              />
            );
          })}
        </div>
      </section>
    );
  }


  return (
    <div className="min-h-screen bg-(--abumuda) text-neutral-900">
      <Hero />

      <main
        id="collection"
        className="scroll-mt-32 max-w-7xl mx-auto px-4 md:px-8 py-10"
      >
        {recommendedSection}

        {/* New Arrivals tanpa Filter n Sort by, filter ada di All Products */}
        <section>
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-950">New Arrivals</h2>
            <Link
              href="/products"
              className="inline-block mt-1 text-xs font-medium text-neutral-950 underline underline-offset-4 hover:text-black"
            >
              View All Products
            </Link>
          </div>
          {productGridContent}
        </section>
      </main>
    </div>
  );
}