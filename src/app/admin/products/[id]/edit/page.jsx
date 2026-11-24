import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import { adminUpdateProductAction } from '@/app/action/seller';
import ProductForm from '@/components/ProductForm';
import { PageHeader, Card } from '@/components/ui';

// ambil data produk dari toko mana pun trs tampilkan form edit untuk admin
export default async function AdminEditProductPage({ params }) {
  await requireAdminPage();
  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const resProduct = await pool.query(
    `SELECT p.id_product, p.id_category, p.nama_produk, p.segmen, p.deskripsi, p.harga, p.stok, p.ukuran, p.gambar,
            s.nama_toko
     FROM products p
     JOIN stores s ON s.id_store = p.id_store
     WHERE p.id_product = $1`,
    [productId]
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

  const resSizes = await pool.query(
    'SELECT ukuran, stok FROM product_sizes WHERE id_product = $1 ORDER BY urutan ASC',
    [productId]
  );

  const resCategories = await pool.query(
    'SELECT id_category, nama_kategori, grup_kategori FROM categories ORDER BY grup_kategori DESC, nama_kategori ASC'
  );

  const boundUpdateAction = adminUpdateProductAction.bind(null, productId);
  const headerDescription = `${productData.nama_produk} · ${productData.nama_toko}`;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/products" className="text-xs text-neutral-500 hover:text-neutral-900">
        ← Back to products
      </Link>
      <div className="mt-2">
        <PageHeader title="Edit Product" description={headerDescription} />
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