import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import { adminDeleteProductAction } from '@/app/action/admin';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader } from '@/components/ui';
import { formatRupiah } from '@/lib/format';

// cek kata kunci pencarian trs tampilkan daftar produk buat cek/hapus produk oleh admin
export default async function AdminProductsPage({ searchParams }) {
  await requireAdminPage();
  const resolvedSearchParams = await searchParams;

  let keyword = '';
  if (resolvedSearchParams && typeof resolvedSearchParams.q === 'string') {
    keyword = resolvedSearchParams.q.trim();
  }

  // ambil produk, nama kategori, nama tokonya
  let queryText = `
    SELECT p.id_product, p.nama_produk, p.harga, p.stok, p.gambar, c.nama_kategori, s.nama_toko
    FROM products p
    JOIN categories c ON c.id_category = p.id_category
    JOIN stores s ON s.id_store = p.id_store`;
  const queryValues = [];

  if (keyword !== '') {
    queryValues.push(`%${keyword}%`);
    queryText += ' WHERE p.nama_produk ILIKE $1 OR s.nama_toko ILIKE $1';
  }
  queryText += ' ORDER BY p.created_at DESC';

  const resProducts = await pool.query(queryText, queryValues);
  const products = resProducts.rows;

  const searchActionElement = (
    <form action="/admin/products" method="GET" className="flex gap-2">
      <input
        name="q"
        defaultValue={keyword}
        placeholder="Product or store name"
        className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
      />
      <button
        type="submit"
        className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-xl cursor-pointer"
      >
        Search
      </button>
    </form>
  );

  let tableRowsContent = null;
  if (products.length === 0) {
    tableRowsContent = (
      <tr>
        <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
          No products found.
        </td>
      </tr>
    );
  } else {
    tableRowsContent = products.map(function buildModerationRow(productItem) {
      let thumbElement = null;
      if (productItem.gambar) {
        thumbElement = (
          <img src={productItem.gambar} alt="" className="w-full h-full object-cover" />
        );
      }

      const boundDeleteAction = adminDeleteProductAction.bind(null, productItem.id_product);
      const removeConfirmText = `Remove "${productItem.nama_produk}" from ${productItem.nama_toko}?`;

      return (
        <tr key={productItem.id_product}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3 min-w-[220px]">
              <span className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                {thumbElement}
              </span>
              <div>
                <p className="font-medium">{productItem.nama_produk}</p>
                <p className="text-[11px] text-neutral-500">{productItem.nama_kategori}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-neutral-600">{productItem.nama_toko}</td>
          <td className="px-4 py-3 whitespace-nowrap">
            {formatRupiah(productItem.harga)}
          </td>
          <td className="px-4 py-3">{productItem.stok}</td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              <Link
                href={`/admin/products/${productItem.id_product}/edit`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 text-neutral-950 hover:border-neutral-900 transition"
              >
                Edit
              </Link>
              <ActionForm
                action={boundDeleteAction}
                confirmMessage={removeConfirmText}
                confirmLabel="Remove"
              >
                <SubmitButton size="sm" variant="dangerOutline" pendingText="...">
                  Remove
                </SubmitButton>
              </ActionForm>
            </div>
          </td>
        </tr>
      );
    });
  }

  let savedBanner = null;
  if (resolvedSearchParams && resolvedSearchParams.saved === 'updated') {
    savedBanner = (
      <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        Product updated.
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Product Moderation"
        description="Edit or remove products from any seller, for example products that break platform rules."
        action={searchActionElement}
      />

      {savedBanner}

      <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">{tableRowsContent}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}