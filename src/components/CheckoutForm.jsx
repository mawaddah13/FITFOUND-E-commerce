'use client';

import { useState } from 'react';
import Link from 'next/link';
import { checkoutAction } from '@/app/action/order';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';

const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-(--biru) text-neutral-900 placeholder:text-neutral-400';

const MAX_SAVED_ADDRESSES = 2;

// tmpil form checkout utk pilih atau isi alamat pengiriman n catatan pesanan
// buyNow diisi kalau checkout dari tombol Buy Now (produk tidak lewat keranjang)
export default function CheckoutForm({
  addresses,
  user,
  selectedIds = [],
  buyNow = null,
  totalText = '',
  itemCount = 0,
  disabled = false,
}) {
  const hasSaved = addresses.length > 0;

  let initialMode = 'new';
  if (hasSaved) {
    initialMode = 'saved';
  }

  const [mode, setMode] = useState(initialMode);

  const defaultAddress =
    addresses.find(function findDefaultAddress(addressItem) {
      return addressItem.is_default;
    }) || addresses[0];

  const canSaveMore = addresses.length < MAX_SAVED_ADDRESSES;

  //style tombol tab, aktif putih, nonaktif abu
  function tabClass(tabValue) {
    let className = 'py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ';
    if (mode === tabValue) {
      className += 'bg-white text-neutral-950 shadow-sm';
    } else {
      className += 'text-neutral-500 hover:text-neutral-900';
    }
    return className;
  }

  // aktifkan mode alamat tersimpan
  function handleSelectSavedMode() {
    setMode('saved');
  }

  // aktifkan mode ketik alamat baru
  function handleSelectNewMode() {
    setMode('new');
  }

  let savedAddressSection = null;
  if (mode === 'saved' && hasSaved) {
    savedAddressSection = (
      <div key="saved" className="space-y-2 animate-fade-up">
        {addresses.map(function buildSavedAddressItem(addressItem) {
          const isDefaultChecked = addressItem.id_address === defaultAddress.id_address;

          let defaultBadge = null;
          if (addressItem.is_default) {
            defaultBadge = (
              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-(--birumuda) text-(--biru) align-middle">
                DEFAULT
              </span>
            );
          }

          return (
            <label
              key={addressItem.id_address}
              className="group flex items-start gap-3 p-3 rounded-xl border border-neutral-200 bg-white cursor-pointer transition-all duration-200 hover:border-neutral-400 has-checked:border-neutral-900 has-checked:shadow-sm"
            >
              <input
                type="radio"
                name="id_address"
                value={addressItem.id_address}
                defaultChecked={isDefaultChecked}
                className="mt-1 w-4 h-4 accent-neutral-900"
              />
              <span className="min-w-0 text-xs text-neutral-600">
                <span className="block text-sm font-semibold text-neutral-900">
                  {addressItem.label}
                  {defaultBadge}
                </span>
                {addressItem.nama_penerima} · {addressItem.no_hp}
                <span className="block">
                  {addressItem.alamat_lengkap}, {addressItem.kota} {addressItem.kode_pos}
                </span>
              </span>
            </label>
          );
        })}
        <Link
          href="/buyer/addresses"
          className="inline-block text-[11px] text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
        >
          Manage saved addresses
        </Link>
      </div>
    );
  }

  let newAddressSection = null;
  if (mode === 'new') {
    let defaultPhoneValue = '';
    if (user && user.no_hp) {
      defaultPhoneValue = user.no_hp;
    }

    let defaultRecipientName = '';
    if (user && user.nama) {
      defaultRecipientName = user.nama;
    }

    let saveAddressBox = (
      <p className="text-[11px] text-neutral-500">
        You already have {MAX_SAVED_ADDRESSES} saved addresses (the maximum). This address will only be used for
        this order.
      </p>
    );
    if (canSaveMore) {
      saveAddressBox = (
        <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
          <input type="checkbox" name="save_address" className="w-4 h-4 accent-neutral-900" />
          Save this address for next time ({addresses.length}/{MAX_SAVED_ADDRESSES} saved)
        </label>
      );
    }

    newAddressSection = (
      <div key="new" className="space-y-3 animate-fade-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          <input
            name="nama_penerima"
            required
            minLength={3}
            defaultValue={defaultRecipientName}
            placeholder="Recipient name"
            aria-label="Recipient name"
            className={inputClass}
          />
          <input
            name="no_hp"
            type="tel"
            required
            defaultValue={defaultPhoneValue}
            placeholder="Phone number"
            aria-label="Phone number"
            className={inputClass}
          />
        </div>
        <textarea
          name="alamat_lengkap"
          rows={2}
          required
          minLength={10}
          placeholder="Street, building, house number"
          aria-label="Full address"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <input name="kota" required placeholder="City" aria-label="City" className={inputClass} />
          <input
            name="kode_pos"
            required
            pattern="[0-9]{5}"
            inputMode="numeric"
            maxLength={5}
            placeholder="Postal code"
            aria-label="Postal code"
            className={inputClass}
          />
        </div>
        {saveAddressBox}
      </div>
    );
  }

  let itemInputs = null;
  if (buyNow) {
    itemInputs = (
      <>
        <input type="hidden" name="buy_product" value={buyNow.productId} />
        <input type="hidden" name="buy_size" value={buyNow.size} />
        <input type="hidden" name="buy_qty" value={buyNow.qty} />
      </>
    );
  } else {
    itemInputs = selectedIds.map(function buildSelectedIdInput(selectedId) {
      return <input key={selectedId} type="hidden" name="cart_item" value={selectedId} />;
    });
  }

  const submitLabel = 'Order Now';

  const isSavedTabDisabled = !hasSaved;

  return (
    <ActionForm action={checkoutAction} className="mt-5 space-y-4">
      <input type="hidden" name="address_mode" value={mode} />
      {itemInputs}

      <div>
        <p className="text-sm font-medium text-neutral-800 mb-2">Shipping address</p>
        <div className="grid grid-cols-2 gap-1 p-1 bg-(--abutab) rounded-xl">
          <button
            type="button"
            onClick={handleSelectSavedMode}
            disabled={isSavedTabDisabled}
            className={`${tabClass('saved')} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Saved address
          </button>
          <button type="button" onClick={handleSelectNewMode} className={tabClass('new')}>
            Type an address
          </button>
        </div>
      </div>

      {savedAddressSection}
      {newAddressSection}

      <div>
        <label htmlFor="catatan" className="block text-sm font-medium text-neutral-800 mb-1.5">
          Note for seller (optional)
        </label>
        <textarea id="catatan" name="catatan" rows={2} maxLength={300} className={inputClass} />
      </div>

      <p className="text-[11px] text-neutral-400">
        Orders are created per store with status “Awaiting Payment”. No payment gateway is required.
      </p>

      {/* total pembayaran n tombol Order Now mengambang di bawah layar */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-neutral-200 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 text-sm text-neutral-950">
            <p>
              Items: <span className="font-semibold">{itemCount}</span> · Shipping: Free
            </p>
            <p className="text-base font-bold">Total Payment {totalText}</p>
          </div>
          <SubmitButton pendingText="Processing..." className="shrink-0 px-6" disabled={disabled}>
            {submitLabel}
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}