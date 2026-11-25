import Link from 'next/link';
import { getSession } from '@/lib/session';
import ProductCard from '@/components/ProductCard';
import CatalogLayout from '@/components/CatalogLayout';
import SoldOutSection from '@/components/SoldOutSection';
import { getWishlistIds } from '@/lib/products';
import {
  parseCatalogParams,
  getCategories,
  queryCatalog,
  sortOptionsForClient,
} from '@/lib/catalog';

// kalimat di bawah judul Women / Men / Kids
const SEGMENT_DESCRIPTIONS = {
  Women: 'Elegant pieces and everyday essentials made for her.',
  Men: 'Smart, comfortable styles for every part of his day.',
  Kids: 'Cute and comfy outfits for your little ones.',
};

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

  // judul + satu kalimat keterangan di bawahnya (kayak Recommended For You di Home)
  // filter kategori tidak mengubah judul, tetap judul bawaan halamannya (All Products / Women / Men / Kids)
  let pageTitle = 'All Products';
  let pageDescription = 'Browse every piece from all our trusted stores in one place.';
  if (filters.q) {
    pageTitle = `Results for "${filters.q}"`;
    pageDescription = 'Products that match what you are looking for.';
  } else if (filters.segment) {
    pageTitle = `${filters.segment} Collection`;
    if (SEGMENT_DESCRIPTIONS[filters.segment]) {
      pageDescription = SEGMENT_DESCRIPTIONS[filters.segment];
    }
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
    // pisahkan produk yg masih ada stok n yg sudah habis (yg habis ditaruh di bawah, disembunyikan dulu)
    const availableProducts = [];
    const soldOutProducts = [];
    for (const productItem of products) {
      if (Number(productItem.stok) > 0) {
        availableProducts.push(productItem);
      } else {
        soldOutProducts.push(productItem);
      }
    }

    // bentuk grid kartu produk dari daftar yg dikasih
    function buildProductGrid(productList) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {productList.map(function buildProductItem(productItem) {
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

    let availableContent = buildProductGrid(availableProducts);
    if (availableProducts.length === 0) {
      availableContent = (
        <div className="py-12 text-center bg-white/60 rounded-2xl border border-neutral-200/80">
          <p className="text-sm text-neutral-500">All products here are currently sold out.</p>
        </div>
      );
    }

    let soldOutContent = null;
    if (soldOutProducts.length > 0) {
      soldOutContent = (
        <SoldOutSection count={soldOutProducts.length}>
          {buildProductGrid(soldOutProducts)}
        </SoldOutSection>
      );
    }

    productGrid = (
      <>
        {availableContent}
        {soldOutContent}
      </>
    );
  }

  return (
    // scroll-mt: pas dibuka dari footer, judul tidak ketutup navbar yg sticky
    <div className="min-h-screen bg-(--abumuda) text-neutral-900 scroll-mt-16 md:scroll-mt-20">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <CatalogLayout
          basePath="/products"
          filters={filters}
          categories={categories}
          sortOptions={sortOptionsForClient()}
          title={pageTitle}
          description={pageDescription}
          resultCount={products.length}
        >
          {productGrid}
        </CatalogLayout>
      </main>
    </div>
  );
}