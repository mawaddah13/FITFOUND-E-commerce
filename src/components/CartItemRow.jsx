'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

// ubah angka jd format rupiah 
function rupiah(value) {
  let numericAmount = 0;
  if (value) {
    numericAmount = Number(value);
  }
  return `Rp ${numericAmount.toLocaleString('id-ID')}`;
}

// tampilkan satu baris item keranjang dgn tombol ubah jumlah n hapus
export default function CartItemRow({ item }) {
  const router = useRouter();
  const [jumlah, setJumlah] = useState(item.jumlah);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const closeConfirm = useCallback(function handleCloseConfirm() {
    setIsConfirmOpen(false);
  }, []);

  // cek batas stok trs kirim perubahan jumlah item ke api
  async function updateQuantity(nextQty) {
    if (nextQty < 1 || nextQty > item.stok) {
      return;
    }

    const previousQty = jumlah;
    setJumlah(nextQty);
    setIsLoading(true);
    setError('');

    try {
      const apiResponse = await fetch(`/api/cart/${item.id_cart_item}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jumlah: nextQty }),
      });
      const responseData = await apiResponse.json();

      if (!apiResponse.ok) {
        setJumlah(previousQty);
        let errorMessage = 'Could not update quantity. Please try again.';
        if (responseData && responseData.error) {
          errorMessage = responseData.error;
        }
        setError(errorMessage);
      } else {
        router.refresh();
      }
    } catch {
      setJumlah(previousQty);
      setError('Cannot reach the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // hapus item dari keranjang setelah dikonfirmasi
  async function removeItem() {
    setIsConfirmOpen(false);
    setIsLoading(true);
    setError('');

    try {
      const apiResponse = await fetch(`/api/cart/${item.id_cart_item}`, {
        method: 'DELETE',
      });

      if (!apiResponse.ok) {
        const responseData = await apiResponse.json();
        let errorMessage = 'Could not remove item. Please try again.';
        if (responseData && responseData.error) {
          errorMessage = responseData.error;
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Cannot reach the server. Please check your connection and try again.');
      setIsLoading(false);
    }
  }

  // kurangi jumlah atau buka konfirmasi hapus klo tinggal satu
  function handleDecreaseClick() {
    if (jumlah <= 1) {
      setIsConfirmOpen(true);
    } else {
      updateQuantity(jumlah - 1);
    }
  }

  // tambah jumlah item 
  function handleIncreaseClick() {
    updateQuantity(jumlah + 1);
  }

  // dialog konfirmasi hapus item
  function handleOpenConfirm() {
    setIsConfirmOpen(true);
  }

  const isOverStock = jumlah > item.stok;

  let rowLoadingClass = '';
  if (isLoading) {
    rowLoadingClass = 'opacity-60';
  }

  let thumbnailImage = null;
  if (item.gambar) {
    thumbnailImage = (
      <img src={item.gambar} alt={item.nama_produk} className="w-full h-full object-cover" />
    );
  }

  let stockWarningBanner = null;
  if (isOverStock) {
    if (item.stok <= 0) {
      stockWarningBanner = (
        <p className="text-[11px] text-red-600">
          Size {item.ukuran} is out of stock. Please remove this item.
        </p>
      );
    } else {
      stockWarningBanner = (
        <p className="text-[11px] text-red-600">
          Only {item.stok} left for size {item.ukuran}. Please reduce the quantity.
        </p>
      );
    }
  }

  let errorBanner = null;
  if (error) {
    errorBanner = <p className="text-[11px] text-red-600">{error}</p>;
  }

  const isIncreaseDisabled = isLoading || jumlah >= item.stok;

  return (
    <div className={`flex gap-4 py-5 ${rowLoadingClass}`}>
      <Link
        href={`/products/${item.id_product}`}
        className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-neutral-100"
      >
        {thumbnailImage}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-neutral-400">{item.nama_toko}</p>
            <Link
              href={`/products/${item.id_product}`}
              className="text-sm font-medium text-neutral-900 hover:underline line-clamp-2"
            >
              {item.nama_produk}
            </Link>
            <p className="text-xs text-neutral-500 mt-0.5">
              Size: {item.ukuran} · {rupiah(item.harga)}
            </p>
          </div>
          <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
            {rupiah(Number(item.harga) * jumlah)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center border border-neutral-200 rounded-xl bg-white">
            <button
              type="button"
              onClick={handleDecreaseClick}
              disabled={isLoading}
              className="w-9 h-9 text-lg text-neutral-950 hover:bg-neutral-100 rounded-l-xl disabled:opacity-30 cursor-pointer"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">{jumlah}</span>
            <button
              type="button"
              onClick={handleIncreaseClick}
              disabled={isIncreaseDisabled}
              className="w-9 h-9 text-lg text-neutral-950 hover:bg-neutral-100 rounded-r-xl disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={isLoading}
            className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
          >
            Remove
          </button>
        </div>

        {stockWarningBanner}
        {errorBanner}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Remove product from cart?"
        description={`${item.nama_produk} (size ${item.ukuran}) will be removed from your cart.`}
        confirmLabel="Remove"
        onConfirm={removeItem}
        onCancel={closeConfirm}
      />
    </div>
  );
}