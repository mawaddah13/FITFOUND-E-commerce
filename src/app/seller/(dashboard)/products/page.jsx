import Link from 'next/link';
import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import { deleteProductAction } from '@/app/action/seller';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, EmptyState, Notice } from '@/components/ui';
import { formatRupiah } from '@/lib/format';

// cek status simpan trs tampilkan daftar produk n stok perukuran milik toko
export default async function SellerProductsPage({ searchParams }) {
  const { store } = await requireSellerPage();
  const resolvedSearchParams = await searchParams;

  let savedStatus = '';
  if (resolvedSearchParams && typeof resolvedSearchParams.saved === 'string') {
    savedStatus = resolvedSearchParams.saved;
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
     WHERE p.id_store = $1
     ORDER BY p.created_at DESC`,
    [store.id_store]
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
  if (products.length === 0) {
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

                let totalStockClass = 'font-semibold';
                if (productItem.stok === 0) {
                  totalStockClass = 'text-red-600 font-semibold';
                }

                const productSizes = productItem.sizes;
                const boundDeleteAction = deleteProductAction.bind(
                  null,
                  productItem.id_product
                );
                const deleteConfirmText = `Delete "${productItem.nama_produk}"?`;

                return (
                  <tr key={productItem.id_product} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <span className="w-11 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          {thumbnailElement}
                        </span>
                        <div>
                          <Link
                            href={`/products/${productItem.id_product}`}
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

  const productCountDescription = `${products.length} product(s) in your store`;

  return (
    <div>
      <PageHeader
        title="Products"
        description={productCountDescription}
        action={addProductButton}
      />

      {savedNoticeElement}
      {productTableContent}
    </div>
  );
}