'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiShoppingBag } from 'react-icons/fi';
import CartItemRow from '@/components/CartItemRow';
import { Card } from '@/components/ui';

// angka ubah jadi rupiah
function rupiah(value) {
  let numericValue = 0;
  if (value) {
    numericValue = Number(value);
  }
  return `Rp ${numericValue.toLocaleString('id-ID')}`;
}

// kotak centang utk memilih item atau toko di keranjang
function CheckBox({ checked, onChange, disabled = false, label }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={label}
      className="w-4 h-4 shrink-0 accent-neutral-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

// daftar item keranjang per toko, ringkasan, form checkout
export default function CartView({ items, ownStoreId }) {
  // cek item keranjang bisa dipilih utk checkout atau tidak
  function canSelect(cartItem) {
    const isOwnProduct = ownStoreId !== null && cartItem.id_store === ownStoreId;
    return cartItem.tersedia && !isOwnProduct && cartItem.stok > 0 && cartItem.jumlah <= cartItem.stok;
  }

  // ambil id item keranjang yg bisa dipilih
  function getSelectableIds(sourceItems) {
    const selectableItems = sourceItems.filter(function filterSelectableItem(cartItem) {
      return canSelect(cartItem);
    });
    const ids = [];
    for (const selectableItem of selectableItems) {
      ids.push(selectableItem.id_cart_item);
    }
    return ids;
  }

  const [selectedIds, setSelectedIds] = useState(function initSelectedIds() {
    return getSelectableIds(items);
  });

  const selectableIds = getSelectableIds(items);
  const activeSelected = selectedIds.filter(function filterActiveSelected(itemId) {
    return selectableIds.includes(itemId);
  });
  const selectedItems = items.filter(function filterSelectedCartItem(cartItem) {
    return activeSelected.includes(cartItem.id_cart_item);
  });

  const groups = [];
  for (const cartItem of items) {
    let matchedGroup = groups.find(function findStoreGroup(groupItem) {
      return groupItem.id_store === cartItem.id_store;
    });

    if (!matchedGroup) {
      matchedGroup = {
        id_store: cartItem.id_store,
        nama_toko: cartItem.nama_toko,
        items: [],
      };
      groups.push(matchedGroup);
    }

    matchedGroup.items.push(cartItem);
  }

  // ubah status centang satu item keranjang
  function toggleItem(itemId) {
    if (activeSelected.includes(itemId)) {
      const nextSelected = activeSelected.filter(function removeItemId(existingId) {
        return existingId !== itemId;
      });
      setSelectedIds(nextSelected);
    } else {
      const nextSelected = [];
      for (const existingId of activeSelected) {
        nextSelected.push(existingId);
      }
      nextSelected.push(itemId);
      setSelectedIds(nextSelected);
    }
  }

  // ubah status centang seluruh item yg bisa dipilih dalam satu toko
  function toggleGroup(groupItem) {
    const groupIds = getSelectableIds(groupItem.items);
    const allGroupChecked =
      groupIds.length > 0 &&
      groupIds.every(function checkGroupId(groupId) {
        return activeSelected.includes(groupId);
      });

    if (allGroupChecked) {
      const remainingIds = activeSelected.filter(function keepOutsideGroup(existingId) {
        return !groupIds.includes(existingId);
      });
      setSelectedIds(remainingIds);
    } else {
      const mergedSet = new Set();
      for (const existingId of activeSelected) {
        mergedSet.add(existingId);
      }
      for (const groupId of groupIds) {
        mergedSet.add(groupId);
      }
      setSelectedIds(Array.from(mergedSet));
    }
  }

  const isAllChecked =
    selectableIds.length > 0 &&
    selectableIds.every(function checkAllId(selectableId) {
      return activeSelected.includes(selectableId);
    });

  // pilih atau lepas centang semua item yg bisa di-checkout
  function toggleAll() {
    if (isAllChecked) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableIds);
    }
  }

  let totalQty = 0;
  let totalPrice = 0;
  for (const selectedItem of selectedItems) {
    totalQty += selectedItem.jumlah;
    totalPrice += Number(selectedItem.harga) * selectedItem.jumlah;
  }

  const isSelectAllDisabled = selectableIds.length === 0;

  let emptySelectionHint = null;
  if (activeSelected.length === 0) {
    emptySelectionHint = (
      <p className="text-[11px] text-neutral-950">Tick the items you want to checkout.</p>
    );
  }

  const isCheckoutDisabled = activeSelected.length === 0;

  // checkout tidak langsung membuat pesanan, tapi ke halaman konfirmasi pesanan dulu
  // widthClass beda: di bar mobile tombolnya kecil, di kartu desktop tombolnya selebar kartu
  function buildCheckoutButton(widthClass) {
    if (isCheckoutDisabled) {
      return (
        <span className={`${widthClass} py-3 text-center text-sm font-medium rounded-xl bg-neutral-200 text-neutral-500 cursor-not-allowed`}>
          Checkout
        </span>
      );
    }
    return (
      <Link
        href={`/buyer/checkout?items=${activeSelected.join(',')}`}
        className={`${widthClass} py-3 text-center text-sm font-medium rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 transition`}
      >
        Checkout ({activeSelected.length})
      </Link>
    );
  }

  return (
    <div className="pb-52 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-4">
          <label className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200/80 px-5 md:px-6 py-4 text-sm font-medium text-neutral-950 cursor-pointer">
            <CheckBox
              checked={isAllChecked}
              onChange={toggleAll}
              disabled={isSelectAllDisabled}
              label="Select all items"
            />
            Select All ({selectableIds.length})
          </label>

          {groups.map(function buildStoreGroupCard(groupItem) {
            const groupIds = getSelectableIds(groupItem.items);
            const groupChecked =
              groupIds.length > 0 &&
              groupIds.every(function checkGroupSelected(groupId) {
                return activeSelected.includes(groupId);
              });
            const isOwnStore = ownStoreId !== null && groupItem.id_store === ownStoreId;
            const isGroupDisabled = groupIds.length === 0;

            let ownStoreWarning = null;
            if (isOwnStore) {
              ownStoreWarning = (
                <span className="text-[11px] text-red-600">
                  Your own store — cannot be checked out
                </span>
              );
            }

            // toggle centang grup toko saat header toko diklik
            function handleGroupToggle() {
              toggleGroup(groupItem);
            }

            return (
              <div
                key={groupItem.id_store}
                className="bg-white rounded-2xl border border-neutral-200/80 px-5 md:px-6 py-2"
              >
                <label className="pt-3 flex items-center gap-3 cursor-pointer">
                  <CheckBox
                    checked={groupChecked}
                    onChange={handleGroupToggle}
                    disabled={isGroupDisabled}
                    label={`Select all items from ${groupItem.nama_toko}`}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-950">
                    {groupItem.nama_toko}
                  </span>
                  {ownStoreWarning}
                </label>
                <div className="divide-y divide-neutral-100">
                  {groupItem.items.map(function buildCartItemRow(cartItem) {
                    const isItemChecked = activeSelected.includes(cartItem.id_cart_item);
                    const isItemDisabled = !canSelect(cartItem);

                    // centang atau lepas centang pas kotak centang dipencet
                    function handleItemToggle() {
                      toggleItem(cartItem.id_cart_item);
                    }

                    return (
                      <div key={cartItem.id_cart_item} className="flex items-center gap-3">
                        <CheckBox
                          checked={isItemChecked}
                          onChange={handleItemToggle}
                          disabled={isItemDisabled}
                          label={`Select ${cartItem.nama_produk}`}
                        />
                        <div className="flex-1 min-w-0">
                          <CartItemRow item={cartItem} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ringkasan belanja di samping (laptop), sticky ikut turun saat discroll */}
        <Card className="hidden lg:block lg:sticky lg:top-28">
          <h3 className="text-base font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-950">
              <span>Selected items</span>
              <span>{totalQty}</span>
            </div>
            <div className="flex justify-between text-neutral-950">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-neutral-100 text-base font-semibold">
              <span>Total</span>
              <span>{rupiah(totalPrice)}</span>
            </div>
          </div>
          <div className="mt-3">{emptySelectionHint}</div>
          <div className="mt-5 flex">{buildCheckoutButton('w-full')}</div>
        </Card>
      </div>

      {/* kartu ringkasan belanja mengambang di bawah layar (HP & tablet), selalu terlihat walau discroll */}
      <div className="lg:hidden fixed inset-x-3 bottom-3 z-30">
        <div className="overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-800">
                <span className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
                  <FiShoppingBag className="w-4 h-4 text-(--biru)" />
                </span>
                Order Summary
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-semibold text-neutral-950">
                {totalQty} selected
              </span>
            </div>
            <p className="mt-1.5 text-xs text-neutral-800">
              Shipping: <span className="font-semibold text-(--biru)">Free</span>
            </p>
            {emptySelectionHint}
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-bold text-neutral-950 leading-tight">{rupiah(totalPrice)}</p>
              <p className="text-xs text-neutral-700">Total</p>
            </div>
            {buildCheckoutButton('shrink-0 px-6')}
          </div>
        </div>
      </div>
    </div>
  );
}