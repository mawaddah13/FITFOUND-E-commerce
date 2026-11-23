import Link from 'next/link';
import { getSession } from '@/lib/session';
import ProductCard from '@/components/ProductCard';
import CatalogLayout from '@/components/CatalogLayout';
import { getWishlistIds } from '@/lib/products';
import {
  parseCatalogParams,
  getCategories,
  queryCatalog,
  sortOptionsForClient,
} from '@/lib/catalog';

// ambil data filter trs tampilkan halaman katalog produk
export default async function ProductsPage({ searchParams }) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;
  const filters = parseCatalogParams(resolvedSearchParams);

  let categories = [];
  let products = [];
  let wishlistIds = [];

  try {
    categories = await getCategories();
    products = await queryCatalog(filters);
    wishlistIds = await getWishlistIds(session);
  } catch (error) {
    console.error('Failed to load all products:', error.message);
  }

  let pageTitle = 'All Products';
  if (filters.q) {
    pageTitle = `Results for "${filters.q}"`;
  } else if (filters.segment && filters.kategori) {
    pageTitle = `${filters.segment} — ${filters.kategori}`;
  } else if (filters.kategori) {
    pageTitle = filters.kategori;
  } else if (filters.segment) {
    pageTitle = `${filters.segment} Collection`;
  }

  let productGrid = null;
  if (products.length === 0) {
    productGrid = (
      <div className="py-20 text-center bg-white/60 rounded-2xl border border-neutral-200/80">
        <p className="text-sm text-neutral-500 mb-3">
          No products found matching your filter.
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
    productGrid = (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(function buildProductItem(productItem) {
          const isProductWishlisted = wishlistIds.includes(productItem.id_product);
          return (
            <ProductCard
              key={productItem.id_product}
              product={productItem}
              session={session}
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
        <CatalogLayout
          basePath="/products"
          filters={filters}
          categories={categories}
          sortOptions={sortOptionsForClient()}
          title={pageTitle}
          resultCount={products.length}
        >
          {productGrid}
        </CatalogLayout>
      </main>
    </div>
  );
}