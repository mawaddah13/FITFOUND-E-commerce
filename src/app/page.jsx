import { getSession } from '@/lib/session';
import Link from 'next/link';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import CatalogLayout from '@/components/CatalogLayout';
import { getWishlistIds } from '@/lib/products';
import {
  parseCatalogParams,
  getCategories,
  queryCatalog,
  sortOptionsForClient,
} from '@/lib/catalog';

const NEW_ARRIVALS_LIMIT = 8;
const RECOMMENDATION_LIMIT = 8;
const FILTERED_LIMIT = 48;

// cek filter lalu muat rekomendasi acak, produk baru, atau hasil filter di halaman utama
export default async function HomePage({ searchParams }) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;
  const filters = parseCatalogParams(resolvedSearchParams);

  let isFiltering = false;
  if (filters.hasFilter || filters.sort !== 'newest') {
    isFiltering = true;
  }

  let showSortInHome = true;
  if (!isFiltering && filters.segment === '') {
    showSortInHome = false;
  }

  let products = [];
  let recommended = [];
  let categories = [];
  let wishlistIds = [];

  try {
    categories = await getCategories();
    if (isFiltering) {
      products = await queryCatalog(filters, { limit: FILTERED_LIMIT });
    } else {
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
    }
    wishlistIds = await getWishlistIds(session);
  } catch (error) {
    console.error('Failed to load products:', error.message);
  }

  let sectionTitle = 'New Arrivals';
  if (filters.q !== '') {
    sectionTitle = `Search results for "${filters.q}"`;
  } else if (filters.segment !== '' && filters.kategori !== '') {
    sectionTitle = `${filters.segment} — ${filters.kategori}`;
  } else if (filters.kategori !== '') {
    sectionTitle = filters.kategori;
  } else if (filters.segment !== '') {
    sectionTitle = `${filters.segment} Collection`;
  } else if (isFiltering) {
    sectionTitle = 'All Products';
  }

  let productGridContent = null;
  if (products.length === 0) {
    productGridContent = (
      <div className="py-16 text-center bg-white/60 rounded-2xl border border-neutral-200/70">
        <p className="text-sm text-neutral-950 mb-3">No products found.</p>
        <Link
          href="/"
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

  const viewAllParams = new URLSearchParams();
  const filterKeys = ['q', 'segment', 'kategori', 'min', 'max'];
  for (const filterKey of filterKeys) {
    if (filters[filterKey]) {
      viewAllParams.set(filterKey, filters[filterKey]);
    }
  }
  if (filters.sort !== 'newest') {
    viewAllParams.set('sort', filters.sort);
  }

  const viewAllQueryString = viewAllParams.toString();
  let viewAllHref = '/products';
  if (viewAllQueryString) {
    viewAllHref = `/products?${viewAllQueryString}`;
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

  let heroSectionElement = null;
  if (!isFiltering) {
    heroSectionElement = <Hero />;
  }

  const headerActionLink = (
    <Link
      href={viewAllHref}
      className="text-xs font-medium text-neutral-950 underline underline-offset-4 hover:text-black"
    >
      View All Products
    </Link>
  );

  return (
    <div className="min-h-screen bg-(--abumuda) text-neutral-900">
      {heroSectionElement}

      <main
        id="collection"
        className="scroll-mt-32 max-w-7xl mx-auto px-4 md:px-8 py-10"
      >
        {recommendedSection}

        <CatalogLayout
          basePath="/"
          filters={filters}
          categories={categories}
          sortOptions={sortOptionsForClient()}
          title={sectionTitle}
          resultCount={products.length}
          showSort={showSortInHome}
          headerAction={headerActionLink}
        >
          {productGridContent}
        </CatalogLayout>
      </main>
    </div>
  );
}