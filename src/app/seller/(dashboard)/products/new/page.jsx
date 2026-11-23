import Link from 'next/link';
import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import { createProductAction } from '@/app/action/seller';
import ProductForm from '@/components/ProductForm';
import { PageHeader, Card } from '@/components/ui';

// ambil daftar kategori trs tampilkan halaman tambah produk baru
export default async function NewProductPage() {
  await requireSellerPage();

  const resCategories = await pool.query(
    'SELECT id_category, nama_kategori, grup_kategori FROM categories ORDER BY grup_kategori DESC, nama_kategori ASC'
  );

  return (
    <div className="max-w-2xl">
      <Link
        href="/seller/products"
        className="text-xs text-neutral-500 hover:text-neutral-900"
      >
        ← Back to products
      </Link>
      <div className="mt-2">
        <PageHeader title="Add Product" description="All fields are required." />
      </div>
      <Card>
        <ProductForm
          action={createProductAction}
          categories={resCategories.rows}
          submitLabel="Create Product"
        />
      </Card>
    </div>
  );
}