import pool from '@/lib/db';
import { requireCompleteSellerPage } from '@/lib/sellerProfile';
import { createProductAction } from '@/app/action/seller';
import ProductForm from '@/components/ProductForm';
import { PageHeader, Card } from '@/components/ui';

// ambil daftar kategori trs tampilkan halaman tambah produk baru
export default async function NewProductPage() {
  await requireCompleteSellerPage();

  const resCategories = await pool.query(
    'SELECT id_category, nama_kategori, grup_kategori FROM categories ORDER BY grup_kategori DESC, nama_kategori ASC'
  );

  return (
    <div className="max-w-2xl">
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