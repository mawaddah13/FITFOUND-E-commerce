import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/app/action/admin';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, Card, Field, inputClass } from '@/components/ui';

const smallInputClass =
  'w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-(--biru)';

const groupSelectClass = `${smallInputClass} sm:w-40`;

// ambil daftar kategori n jumlah produk trs tampilkan pengelolaan kategori admin
export default async function AdminCategoriesPage() {
  await requireAdminPage();

  const resCategories = await pool.query(
    `SELECT c.id_category, c.nama_kategori, c.grup_kategori, COUNT(p.id_product)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.id_category = c.id_category
     GROUP BY c.id_category
     ORDER BY c.grup_kategori DESC, c.nama_kategori ASC`
  );
  const categories = resCategories.rows;

  return (
    <div>
      <PageHeader
        title="Category Management"
        description="Categories that Sellers can choose when adding products."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-neutral-200/80 divide-y divide-neutral-100">
          {categories.map(function buildCategoryRow(categoryItem) {
            const boundUpdateAction = updateCategoryAction.bind(null, categoryItem.id_category);
            const boundDeleteAction = deleteCategoryAction.bind(null, categoryItem.id_category);
            const deletePromptText = `Delete category "${categoryItem.nama_kategori}"?`;
            const productCountLabel = `${categoryItem.product_count} product(s)`;

            return (
              <div
                key={categoryItem.id_category}
                className="p-4 flex flex-col md:flex-row md:items-start gap-3"
              >
                <ActionForm action={boundUpdateAction} className="flex-1">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      name="nama_kategori"
                      required
                      minLength={2}
                      maxLength={100}
                      defaultValue={categoryItem.nama_kategori}
                      aria-label="Category name"
                      className={smallInputClass}
                    />
                    <select
                      name="grup_kategori"
                      defaultValue={categoryItem.grup_kategori}
                      aria-label="Group"
                      className={groupSelectClass}
                    >
                      <option value="Main">Main</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                    <SubmitButton size="sm" variant="outline" pendingText="...">
                      Save
                    </SubmitButton>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{productCountLabel}</p>
                </ActionForm>

                <ActionForm action={boundDeleteAction} confirmMessage={deletePromptText}>
                  <SubmitButton size="sm" variant="dangerOutline" pendingText="...">
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            );
          })}
        </div>

        <Card>
          <h3 className="text-base font-semibold mb-4">Add Category</h3>
          <ActionForm action={createCategoryAction} resetOnSuccess={true} className="space-y-4">
            <Field label="Category Name" htmlFor="new_nama_kategori">
              <input
                id="new_nama_kategori"
                name="nama_kategori"
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Dresses"
                className={inputClass}
              />
            </Field>
            <Field label="Group" htmlFor="new_grup">
              <select
                id="new_grup"
                name="grup_kategori"
                defaultValue="Main"
                className={inputClass}
              >
                <option value="Main">Main</option>
                <option value="Accessories">Accessories</option>
              </select>
            </Field>
            <SubmitButton className="w-full">Add Category</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}