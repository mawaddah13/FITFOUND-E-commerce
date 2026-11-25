import Link from 'next/link';
import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import { deleteProductAction } from '@/app/action/seller';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, EmptyState, Notice } from '@/components/ui';
import { formatRupiah } from '@/lib/format';

// batas stok hampir habis (kuning) dihitung dari total stok produk, stok 0 = habis (merah)
const LOW_STOCK_LIMIT = 5;

// pilihan urutan produk di My Products
const PRODUCT_SORTS = {
  newest: { label: 'Newest', sql: 'p.created_at DESC' },
  name_asc: { label: 'Name (A–Z)', sql: 'p.nama_produk ASC' },
  price_asc: { label: 'Price: Low to High', sql: 'p.harga ASC' },
  price_desc: { label: 'Price: High to Low', sql: 'p.harga DESC' },
  stock_desc: { label: 'Most Stock', sql: 'p.stok DESC, p.nama_produk ASC' },
  stock_asc: { label: 'Least Stock', sql: 'p.stok ASC, p.nama_produk ASC' },
};

// pilihan filter kondisi stok
const STOCK_FILTERS = {
  all: 'All products',
  low: `Running low (1–${LOW_STOCK_LIMIT} left)`,
  out: 'Sold out',
};

// baca parameter url sbg teks
function readParam(params, paramKey) {
  if (params && typeof params[paramKey] === 'string') {
    return params[paramKey].trim();
  }
  return '';
}

// cek status simpan trs tampilkan daftar produk n stok perukuran milik toko
export default async function SellerProductsPage({ searchParams }) {
  const { store } = await requireSellerPage();
  const resolvedSearchParams = await searchParams;

  let savedStatus = '';
  if (resolvedSearchParams && typeof resolvedSearchParams.saved === 'string') {
    savedStatus = resolvedSearchParams.saved;
  }

  // filter n urutan dari url, contoh /seller/products?stock=low&sort=stock_asc
  const keyword = readParam(resolvedSearchParams, 'q').slice(0, 100);
  let stockFilter = readParam(resolvedSearchParams, 'stock');
  if (!STOCK_FILTERS[stockFilter]) {
    stockFilter = 'all';
  }
  let sortKey = readParam(resolvedSearchParams, 'sort');
  if (!PRODUCT_SORTS[sortKey]) {
    sortKey = 'newest';
  }
  const isFiltered = keyword !== '' || stockFilter !== 'all' || sortKey !== 'newest';

  const queryValues = [store.id_store];
  let filterSql = '';
  if (keyword !== '') {
    queryValues.push(`%${keyword}%`);
    filterSql += ` AND p.nama_produk ILIKE $${queryValues.length}`;
  }
  if (stockFilter === 'low') {
    filterSql += ` AND p.stok BETWEEN 1 AND ${LOW_STOCK_LIMIT}`;
  } else if (stockFilter === 'out') {
    filterSql += ' AND p.stok = 0';
  }

  const resProducts = await pool.query(
    `SELECT p.id_product, p.nama_produk, p.harga, p.stok, p.gambar, p.segmen, p.ukuran, c.nama_kategori,
            COALESCE(
              (SELECT json_agg(json_build_object('ukuran', ps.ukuran, 'stok', ps.stok) ORDER BY ps.urutan)
               FROM product_sizes ps WHERE ps.id_product = p.id_product),
              '[]'::json
            ) AS sizes
     FROM products p
     JOIN categories c ON c.id_category = p.id_category
     WHERE p.id_store = $1${filterSql}
     ORDER BY ${PRODUCT_SORTS[sortKey].sql}`,
    queryValues
  );
  const products = resProducts.rows;

  const addProductButton = (
    <Link
      href="/seller/products/new"
      className="inline-flex px-5 py-2.5 text-sm font-medium bg-(--biru) hover:bg-(--biruhover) text-white rounded-xl transition"
    >
      + Add Product
    </Link>
  );

  let savedNoticeElement = null;
  if (savedStatus === 'created') {
    savedNoticeElement = <Notice>Product created successfully.</Notice>;
  } else if (savedStatus === 'updated') {
    savedNoticeElement = <Notice>Product updated successfully.</Notice>;
  }

  let productTableContent = null;
  if (products.length === 0 && isFiltered) {
    productTableContent = (
      <EmptyState message="No products match this filter." actionHref="/seller/products" actionLabel="Reset Filter" />
    );
  } else if (products.length === 0) {
    productTableContent = (
      <EmptyState
        message="You have no products yet."
        actionHref="/seller/products/new"
        actionLabel="Add Your First Product"
      />
    );
  } else {
    productTableContent = (
      <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map(function buildProductRow(productItem) {
                let thumbnailElement = null;
                if (productItem.gambar) {
                  thumbnailElement = (
                    <img
                      src={productItem.gambar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  );
                }

                // indikator stok: merah = habis, kuning = hampir habis (5 atau kurang)
                let totalStockClass = 'font-semibold';
                let rowStockClass = '';
                let stockBadge = null;
                if (productItem.stok === 0) {
                  totalStockClass = 'text-red-600 font-semibold';
                  rowStockClass = 'bg-red-50/70';
                  stockBadge = (
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                      Out of stock
                    </span>
                  );
                } else if (productItem.stok <= LOW_STOCK_LIMIT) {
                  totalStockClass = 'text-amber-700 font-semibold';
                  rowStockClass = 'bg-amber-50/70';
                  stockBadge = (
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">
                      Low stock
                    </span>
                  );
                }

                const productSizes = productItem.sizes;
                const boundDeleteAction = deleteProductAction.bind(
                  null,
                  productItem.id_product
                );
                const deleteConfirmText = `Delete "${productItem.nama_produk}"?`;

                return (
                  <tr key={productItem.id_product} className={`align-middle ${rowStockClass}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <span className="w-11 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          {thumbnailElement}
                        </span>
                        <div>
                          <Link
                            href={`/seller/products/${productItem.id_product}/edit`}
                            className="font-medium hover:underline"
                          >
                            {productItem.nama_produk}
                          </Link>
                          <p className="text-[11px] text-neutral-500">
                            {productItem.segmen}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {productItem.nama_kategori}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatRupiah(productItem.harga)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={totalStockClass}>{productItem.stok}</span>
                      {stockBadge}
                      <div className="mt-1 flex flex-wrap gap-1 max-w-[220px]">
                        {productSizes.map(function buildSizeBadge(sizeEntry) {
                          let sizeBadgeClass =
                            'px-1.5 py-0.5 rounded-md text-[10px] whitespace-nowrap bg-neutral-100 text-neutral-600';
                          if (sizeEntry.stok === 0) {
                            sizeBadgeClass =
                              'px-1.5 py-0.5 rounded-md text-[10px] whitespace-nowrap bg-red-50 text-red-600';
                          }

                          return (
                            <span key={sizeEntry.ukuran} className={sizeBadgeClass}>
                              {sizeEntry.ukuran}: {sizeEntry.stok}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/seller/products/${productItem.id_product}/edit`}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-neutral-200 hover:border-neutral-400 transition"
                        >
                          Edit
                        </Link>
                        <ActionForm
                          action={boundDeleteAction}
                          confirmMessage={deleteConfirmText}
                          confirmDescription="Are you sure you want to delete this product?"
                          messageAsToast
                        >
                          <SubmitButton
                            size="sm"
                            variant="dangerOutline"
                            pendingText="..."
                          >
                            Delete
                          </SubmitButton>
                        </ActionForm>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  let productCountDescription = `${products.length} product(s) in your store`;
  if (isFiltered) {
    productCountDescription = `${products.length} product(s) match your filter`;
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={productCountDescription}
        action={addProductButton}
      />

      {savedNoticeElement}

      <form
        action="/seller/products"
        method="GET"
        className="mb-4 p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px_auto] gap-3 items-end"
      >
        <label className="block">
          <span className="block text-xs font-medium text-neutral-950 mb-1">Search</span>
          <input
            name="q"
            defaultValue={keyword}
            placeholder="Product name"
            className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-neutral-950 mb-1">Filter by stock</span>
          <select
            name="stock"
            defaultValue={stockFilter}
            className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
          >
            {Object.keys(STOCK_FILTERS).map(function buildStockOption(filterKey) {
              return (
                <option key={filterKey} value={filterKey}>
                  {STOCK_FILTERS[filterKey]}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-neutral-950 mb-1">Sort by</span>
          <select
            name="sort"
            defaultValue={sortKey}
            className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
          >
            {Object.keys(PRODUCT_SORTS).map(function buildSortOption(optionKey) {
              return (
                <option key={optionKey} value={optionKey}>
                  {PRODUCT_SORTS[optionKey].label}
                </option>
              );
            })}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2.5 text-sm font-medium bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            Apply
          </button>
          <Link
            href="/seller/products"
            className="px-4 py-2.5 text-sm font-medium bg-white border border-neutral-300 text-neutral-950 rounded-xl hover:border-neutral-900 transition"
          >
            Reset Filter
          </Link>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px] text-neutral-950">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          Low stock ({LOW_STOCK_LIMIT} or less in total)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Out of stock
        </span>
      </div>

      {productTableContent}
    </div>
  );
}