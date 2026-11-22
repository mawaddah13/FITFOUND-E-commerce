import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import MultiImageInput from '@/components/MultiImageInput';
import ProductOptionsFields from '@/components/ProductOptionsFields';
import { Field, inputClass } from '@/components/ui';

// tampilkan form tambah atau ubah data produk beserta ukuran, stok, n foto
export default function ProductForm({
  action,
  categories,
  product = null,
  images = [],
  sizes = [],
  submitLabel,
}) {
  let defaultProductName = '';
  if (product && product.nama_produk) {
    defaultProductName = product.nama_produk;
  }

  let defaultDescription = '';
  if (product && product.deskripsi) {
    defaultDescription = product.deskripsi;
  }

  let defaultPrice = '';
  if (product && product.harga !== undefined && product.harga !== null) {
    defaultPrice = Number(product.harga);
  }

  let defaultCategoryId = '';
  if (product && product.id_category) {
    defaultCategoryId = product.id_category;
  }

  let defaultSegment = '';
  if (product && product.segmen) {
    defaultSegment = product.segmen;
  }

  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Product Name" htmlFor="nama_produk">
        <input
          id="nama_produk"
          name="nama_produk"
          required
          minLength={3}
          maxLength={150}
          defaultValue={defaultProductName}
          className={inputClass}
        />
      </Field>

      <Field label="Description" htmlFor="deskripsi" hint="Minimum 10 characters.">
        <textarea
          id="deskripsi"
          name="deskripsi"
          rows={4}
          required
          minLength={10}
          defaultValue={defaultDescription}
          className={inputClass}
        />
      </Field>

      <div className="sm:max-w-[50%]">
        <Field label="Price (Rp)" htmlFor="harga">
          <input
            id="harga"
            name="harga"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={defaultPrice}
            className={inputClass}
          />
        </Field>
      </div>

      <ProductOptionsFields
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        defaultSegment={defaultSegment}
        initialSizes={sizes}
      />

      <div className="p-4 rounded-xl bg-(--abumuda)">
        <MultiImageInput existingImages={images} max={5} />
      </div>

      <SubmitButton pendingText="Saving product...">{submitLabel}</SubmitButton>
    </ActionForm>
  );
}