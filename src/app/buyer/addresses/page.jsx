import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from '@/app/action/buyer';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, Card, Field, inputClass } from '@/components/ui';

const MAX_SAVED_ADDRESSES = 2;

// cek batas alamat tersimpan trs tampilkan daftar n formulir alamat pengiriman
export default async function AddressesPage() {
  const user = await requireBuyerPage();

  const resAddresses = await pool.query(
    `SELECT id_address, label, nama_penerima, no_hp, alamat_lengkap, kota, kode_pos, is_default
     FROM addresses WHERE id_user = $1
     ORDER BY is_default DESC, created_at DESC`,
    [user.id_user]
  );
  const addresses = resAddresses.rows;
  const canAddMore = addresses.length < MAX_SAVED_ADDRESSES;

  let defaultPhoneValue = '';
  if (user.no_hp) {
    defaultPhoneValue = user.no_hp;
  }

  let addressListContent = null;
  if (addresses.length === 0) {
    addressListContent = (
      <div className="p-8 text-center text-sm text-neutral-500 bg-white rounded-2xl border border-dashed border-neutral-300">
        You have no saved addresses yet.
      </div>
    );
  } else {
    addressListContent = addresses.map(function buildAddressCard(addressItem) {
      let defaultBadgeElement = null;
      if (addressItem.is_default) {
        defaultBadgeElement = (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-(--birumuda) text-(--biru)">
            DEFAULT
          </span>
        );
      }

      let setDefaultFormElement = null;
      if (!addressItem.is_default) {
        const setDefaultActionWithId = setDefaultAddressAction.bind(null, addressItem.id_address);
        setDefaultFormElement = (
          <ActionForm action={setDefaultActionWithId}>
            <SubmitButton size="sm" variant="outline" pendingText="Saving...">
              Set as Default
            </SubmitButton>
          </ActionForm>
        );
      }

      const deleteAddressActionWithId = deleteAddressAction.bind(null, addressItem.id_address);

      return (
        <Card key={addressItem.id_address} className="hover-lift">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold">{addressItem.label}</span>
            {defaultBadgeElement}
          </div>
          <p className="text-sm text-neutral-800">
            {addressItem.nama_penerima} · {addressItem.no_hp}
          </p>
          <p className="text-sm text-neutral-600">
            {addressItem.alamat_lengkap}, {addressItem.kota} {addressItem.kode_pos}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {setDefaultFormElement}
            <ActionForm
              action={deleteAddressActionWithId}
              confirmMessage="Delete this address?"
            >
              <SubmitButton size="sm" variant="dangerOutline" pendingText="Deleting...">
                Delete
              </SubmitButton>
            </ActionForm>
          </div>
        </Card>
      );
    });
  }

  let rightFormCardContent = null;
  if (canAddMore) {
    rightFormCardContent = (
      <>
        <h3 className="text-base font-semibold mb-4">Add New Address</h3>
        <ActionForm action={createAddressAction} resetOnSuccess className="space-y-4">
          <Field label="Label" htmlFor="label" hint="e.g. Home, Office, Boarding House">
            <input id="label" name="label" required maxLength={50} className={inputClass} />
          </Field>
          <Field label="Recipient Name" htmlFor="nama_penerima">
            <input
              id="nama_penerima"
              name="nama_penerima"
              required
              defaultValue={user.nama}
              className={inputClass}
            />
          </Field>
          <Field label="Phone Number" htmlFor="addr_no_hp">
            <input
              id="addr_no_hp"
              name="no_hp"
              type="tel"
              required
              defaultValue={defaultPhoneValue}
              className={inputClass}
            />
          </Field>
          <Field label="Full Address" htmlFor="alamat_lengkap">
            <textarea
              id="alamat_lengkap"
              name="alamat_lengkap"
              rows={3}
              required
              minLength={10}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" htmlFor="kota">
              <input id="kota" name="kota" required className={inputClass} />
            </Field>
            <Field label="Postal Code" htmlFor="kode_pos">
              <input
                id="kode_pos"
                name="kode_pos"
                required
                pattern="[0-9]{5}"
                inputMode="numeric"
                maxLength={5}
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="is_default" className="w-4 h-4" />
            Set as default address
          </label>
          <SubmitButton className="w-full">Save Address</SubmitButton>
        </ActionForm>
      </>
    );
  } else {
    rightFormCardContent = (
      <div className="text-center py-6">
        <p className="text-sm font-semibold text-neutral-900">Address limit reached</p>
        <p className="text-xs text-neutral-500 mt-1.5">
          You can save up to {MAX_SAVED_ADDRESSES} addresses. Delete one to add a new address, or type a
          different address directly at checkout.
        </p>
      </div>
    );
  }

  const pageDescription = `Save up to ${MAX_SAVED_ADDRESSES} addresses for faster checkout (${addresses.length}/${MAX_SAVED_ADDRESSES} saved). You can also type a new address at checkout.`;

  return (
    <div>
      <PageHeader title="Shipping Addresses" description={pageDescription} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-3">{addressListContent}</div>

        <Card>{rightFormCardContent}</Card>
      </div>
    </div>
  );
}