import Link from 'next/link';
import { requireSellerPage } from '@/lib/auth';
import { updateStoreAction } from '@/app/action/seller';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import ImageInput from '@/components/ImageInput';
import { PageHeader, Card, Field, inputClass } from '@/components/ui';

// ambil data toko aktif lalu tampilkan formulir profil toko n pratinjaunya
export default async function StorePage() {
  const { store } = await requireSellerPage();

  let currentImageValue = '';
  if (store.gambar_toko) {
    currentImageValue = store.gambar_toko;
  }

  let descriptionDefaultValue = '';
  if (store.deskripsi_toko) {
    descriptionDefaultValue = store.deskripsi_toko;
  }

  let previewAvatarElement = (
    <span className="mx-auto w-28 h-28 rounded-full bg-neutral-900 text-white text-4xl font-semibold flex items-center justify-center">
      {store.nama_toko.charAt(0).toUpperCase()}
    </span>
  );
  if (store.gambar_toko) {
    previewAvatarElement = (
      <img
        src={store.gambar_toko}
        alt={store.nama_toko}
        className="mx-auto w-28 h-28 rounded-full object-cover border border-neutral-200"
      />
    );
  }

  let previewDescriptionText = 'No description yet.';
  if (store.deskripsi_toko) {
    previewDescriptionText = store.deskripsi_toko;
  }

  const storePageHref = `/stores/${store.id_store}`;

  return (
    <div>
      <PageHeader
        title="Store Profile"
        description="Your store photo and name are shown to buyers on your store page and product pages."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <Card>
          <ActionForm action={updateStoreAction} className="space-y-4">
            <ImageInput
              name="gambar_file"
              label="Store Profile Photo"
              currentImage={currentImageValue}
              rounded={true}
            />
            <Field label="Store Name" htmlFor="nama_toko">
              <input
                id="nama_toko"
                name="nama_toko"
                required
                minLength={3}
                maxLength={120}
                defaultValue={store.nama_toko}
                className={inputClass}
              />
            </Field>
            <Field label="Store Description" htmlFor="deskripsi_toko">
              <textarea
                id="deskripsi_toko"
                name="deskripsi_toko"
                rows={4}
                maxLength={1000}
                defaultValue={descriptionDefaultValue}
                className={inputClass}
              />
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 cursor-pointer">
              <input
                type="checkbox"
                name="sembunyikan_produk"
                defaultChecked={store.sembunyikan_produk}
                className="mt-0.5 w-4 h-4 accent-neutral-900"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-950">Hide Your Own Products</span>
                <span className="block text-[11px] text-neutral-950 mt-0.5">
                  When you shop on FITFOUND, products from your store are hidden from Home, All Products,
                  Best Sellers, and search. You can’t buy your own products anyway.
                </span>
              </span>
            </label>
            <SubmitButton>Save Store Profile</SubmitButton>
          </ActionForm>
        </Card>

        <Card className="text-center">
          <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3">
            Preview
          </p>
          {previewAvatarElement}
          <p className="mt-4 text-base font-semibold">{store.nama_toko}</p>
          <p className="text-xs text-neutral-500 mt-1">{previewDescriptionText}</p>
          <Link
            href={storePageHref}
            className="mt-4 inline-block text-xs font-medium underline underline-offset-4 text-neutral-700 hover:text-neutral-950"
          >
            View my store page
          </Link>
        </Card>
      </div>
    </div>
  );
}