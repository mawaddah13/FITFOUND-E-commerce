import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { requireCompleteSellerPage } from '@/lib/sellerProfile';
import { updateProductAction } from '@/app/action/seller';
import ProductForm from '@/components/ProductForm';
import { PageHeader, Card } from '@/components/ui';

// cek sp punya produk trs ambil data produk, galeri, ukuran, n kategori utk halaman edit
export default async function EditProductPage({ params }) {
  const { store } = await requireCompleteSellerPage();
  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const resProduct = await pool.query(
    `SELECT id_product, id_category, nama_produk, segmen, deskripsi, harga, stok, ukuran, gambar
     FROM products WHERE id_product = $1 AND id_store = $2`,
    [productId, store.id_store]
  );
  if (resProduct.rows.length === 0) {
    notFound();
  }
  const productData = resProduct.rows[0];

  const resImages = await pool.query(
    'SELECT gambar FROM product_images WHERE id_product = $1 ORDER BY urutan ASC',
    [productId]
  );

  let galleryImages = [];
  for (const imgRow of resImages.rows) {
    galleryImages.push(imgRow.gambar);
  }
  if (galleryImages.length === 0 && productData.gambar) {
    galleryImages = [productData.gambar];
  }

  // ambil daftar ukuran n stok produk berurutan sesuai urutan simpan
  const resSizes = await pool.query(
    'SELECT ukuran, stok FROM product_sizes WHERE id_product = $1 ORDER BY urutan ASC',
    [productId]
  );

  // ambil semua kategori buat pilihan dropdown di form edit
  const resCategories = await pool.query(
    'SELECT id_category, nama_kategori, grup_kategori FROM categories ORDER BY grup_kategori DESC, nama_kategori ASC'
  );

  const boundUpdateAction = updateProductAction.bind(null, productId);

  return (
    <div className="max-w-2xl">
      <Link
        href="/seller/products"
        className="text-xs text-neutral-500 hover:text-neutral-900"
      >
        ← Back to products
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Edit Product"
          description={productData.nama_produk}
        />
      </div>
      <Card>
        <ProductForm
          action={boundUpdateAction}
          categories={resCategories.rows}
          product={productData}
          images={galleryImages}
          sizes={resSizes.rows}
          submitLabel="Save Changes"
        />
      </Card>
    </div>
  );
}