import { requireSellerPage } from '@/lib/auth';
import { isSellerProfileComplete } from '@/lib/sellerProfile';
import { updateStoreAction } from '@/app/action/seller';
import { updateProfileAction, changePasswordAction } from '@/app/action/buyer';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import ImageInput from '@/components/ImageInput';
import PasswordInput from '@/components/PasswordInput';
import { PageHeader, Card, Field, Notice, inputClass } from '@/components/ui';

// ambil data toko aktif lalu tampilkan formulir profil toko n pratinjaunya
export default async function StorePage() {
  const { user, store } = await requireSellerPage();

  let phoneDefaultValue = '';
  if (user.no_hp) {
    phoneDefaultValue = user.no_hp;
  }

  let addressDefaultValue = '';
  if (user.alamat) {
    addressDefaultValue = user.alamat;
  }

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

  // pengingat isi no hp n alamat dulu sebelum bisa tambah / edit produk
  let completeProfileNotice = null;
  if (!isSellerProfileComplete(user)) {
    completeProfileNotice = (
      <Notice type="info">
        Please add your <strong>phone number</strong> and <strong>address</strong> in Account Information below
        before you add or edit products.
      </Notice>
    );
  }

  let previewDescriptionText = 'No description yet.';
  if (store.deskripsi_toko) {
    previewDescriptionText = store.deskripsi_toko;
  }

  return (
    <div>
      <PageHeader
        title="Store Profile"
        description="Your store photo and name are shown to buyers on your store page and product pages."
      />

      {completeProfileNotice}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <Card>
          <ActionForm action={updateStoreAction} skipIfUnchanged className="space-y-4">
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
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card>
          <h3 className="text-base font-semibold mb-4">Account Information</h3>
          <ActionForm action={updateProfileAction} skipIfUnchanged className="space-y-4">
            <Field label="Full Name" htmlFor="nama">
              <input
                id="nama"
                name="nama"
                required
                minLength={3}
                maxLength={100}
                defaultValue={user.nama}
                className={inputClass}
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={user.email}
                className={inputClass}
              />
            </Field>
            <Field label="Phone Number" htmlFor="no_hp">
              <input
                id="no_hp"
                name="no_hp"
                type="tel"
                required
                defaultValue={phoneDefaultValue}
                className={inputClass}
              />
            </Field>
            <Field label="Address" htmlFor="alamat" hint="Street, city, and postal code.">
              <textarea
                id="alamat"
                name="alamat"
                rows={2}
                required
                minLength={10}
                maxLength={500}
                defaultValue={addressDefaultValue}
                className={inputClass}
              />
            </Field>
            <SubmitButton>Save Account</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-4">Change Password</h3>
          <ActionForm action={changePasswordAction} resetOnSuccess skipIfUnchanged className="space-y-4">
            <Field label="Current Password" htmlFor="current_password">
              <PasswordInput
                id="current_password"
                name="current_password"
                required
                className={inputClass}
              />
            </Field>
            <Field label="New Password" htmlFor="new_password" hint="Minimum 6 characters.">
              <PasswordInput
                id="new_password"
                name="new_password"
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <Field label="Confirm New Password" htmlFor="confirm_password">
              <PasswordInput
                id="confirm_password"
                name="confirm_password"
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <SubmitButton variant="dark">Change Password</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}