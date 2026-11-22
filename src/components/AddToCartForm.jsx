'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isSizelessList, sizeSuffix } from '@/lib/sizes';

// tampilkan form pilih ukuran n jumlah utk tambah produk ke keranjang
export default function AddToCartForm({ productId, sizes = [] }) {
  const router = useRouter();

  const firstAvailableSize = sizes.find(function findAvailableSize(sizeItem) {
    return sizeItem.stok > 0;
  });

  let initialSize = '';
  if (firstAvailableSize) {
    initialSize = firstAvailableSize.ukuran;
  }

  const [ukuran, setUkuran] = useState(initialSize);
  const [jumlah, setJumlah] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedSize = sizes.find(function findMatchingSize(sizeItem) {
    return sizeItem.ukuran === ukuran;
  }) || null;

  let stock = 0;
  if (selectedSize) {
    stock = selectedSize.stok;
  }

  const isOutOfStock = !firstAvailableSize;
  const isSizeless = isSizelessList(sizes);

  // pilih ukuran tersedia n sesuaikan jumlah dgn stok ukuran
  function chooseSize(sizeItem) {
    if (sizeItem.stok <= 0) {
      return;
    }

    setUkuran(sizeItem.ukuran);
    setFeedback(null);

    if (Number(jumlah) > sizeItem.stok) {
      setJumlah(sizeItem.stok);
    }
  }

  // perbarui nilai jumlah pas input angka diubah
  function handleQtyChange(changeEvent) {
    setJumlah(changeEvent.target.value);
  }

  // cek input ukuran n jumlah lalu kirim item ke keranjang
  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (!selectedSize) {
      setFeedback({ type: 'error', text: 'Please select a size first.' });
      return;
    }

    const qty = Number(jumlah);
    if (!Number.isInteger(qty) || qty < 1) {
      setFeedback({ type: 'error', text: 'Quantity must be at least 1 item.' });
      return;
    }

    if (qty > stock) {
      setFeedback({ type: 'error', text: `Only ${stock} item(s) left${sizeSuffix(ukuran)}.` });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const apiResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_product: productId, ukuran, jumlah: qty }),
      });
      const responseData = await apiResponse.json();

      if (!apiResponse.ok) {
        let errorText = 'Could not add item to cart. Please try again.';
        if (responseData && responseData.error) {
          errorText = responseData.error;
        }
        setFeedback({ type: 'error', text: errorText });
      } else {
        setFeedback({ type: 'success', text: responseData.message });
        router.refresh();
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Cannot reach the server. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  let sizeSection = null;
  if (isSizeless) {
    let sizelessStockText = `${stock} available`;
    let sizelessStockClass = 'text-neutral-500';
    if (isOutOfStock) {
      sizelessStockText = 'Sold out';
    } else if (stock <= 3) {
      sizelessStockText = `Only ${stock} left`;
      sizelessStockClass = 'text-amber-700 font-medium';
    }

    sizeSection = <p className={`text-xs ${sizelessStockClass}`}>{sizelessStockText}</p>;
  } else {
    let selectedSizeHint = null;
    if (selectedSize) {
      let hintText = `${stock} available in size ${ukuran}`;
      let hintClass = 'text-neutral-500';
      if (stock <= 3) {
        hintText = `Only ${stock} left in size ${ukuran}`;
        hintClass = 'text-amber-700 font-medium';
      }

      selectedSizeHint = <p className={`text-[11px] ${hintClass}`}>{hintText}</p>;
    }

    sizeSection = (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="block text-xs font-medium text-neutral-700">Select Size</p>
          {selectedSizeHint}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {sizes.map(function buildSizeButton(sizeItem) {
            const isSoldOut = sizeItem.stok <= 0;
            let sizeClass = 'inline-block min-w-12 px-4 py-2 text-xs font-medium rounded-xl border transition ';

            if (isSoldOut) {
              sizeClass += 'border-neutral-200 bg-neutral-100 text-neutral-400 line-through cursor-not-allowed';
            } else if (sizeItem.ukuran === ukuran) {
              sizeClass += 'bg-neutral-950 text-white border-neutral-950 cursor-pointer';
            } else {
              sizeClass += 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 cursor-pointer';
            }

            let sizeTitle = `Size ${sizeItem.ukuran}`;
            if (isSoldOut) {
              sizeTitle = `Size ${sizeItem.ukuran} is sold out`;
            }

            // pilih ukuran saat tombol diklik
            function handleSizeClick() {
              chooseSize(sizeItem);
            }

            return (
              <button
                key={sizeItem.ukuran}
                type="button"
                onClick={handleSizeClick}
                disabled={isSoldOut}
                title={sizeTitle}
                className={sizeClass}
              >
                {sizeItem.ukuran}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  let maxQtyInput = 1;
  if (stock > 0) {
    maxQtyInput = stock;
  }

  let submitButtonLabel = 'Add to Cart';
  if (isOutOfStock) {
    submitButtonLabel = 'Sold Out';
  } else if (isLoading) {
    submitButtonLabel = 'Adding...';
  }

  let submitButtonClass =
    'bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  if (isOutOfStock) {
    submitButtonClass = 'bg-neutral-200 text-neutral-500 cursor-not-allowed';
  }

  let feedbackBanner = null;
  if (feedback && feedback.type === 'success') {
    feedbackBanner = (
      <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        {feedback.text}{' '}
        <Link href="/buyer/cart" className="font-semibold underline">
          View cart
        </Link>
      </p>
    );
  } else if (feedback && feedback.type === 'error') {
    feedbackBanner = (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        {feedback.text}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pt-4 space-y-5">
      {sizeSection}

      <div className="flex items-center gap-3">
        <div className="w-24">
          <label htmlFor="qty" className="sr-only">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min="1"
            max={maxQtyInput}
            value={jumlah}
            onChange={handleQtyChange}
            disabled={isOutOfStock}
            className="w-full px-3 py-3 text-sm text-center bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isOutOfStock || isLoading}
          className={`flex-1 py-3.5 text-sm font-medium rounded-xl transition ${submitButtonClass}`}
        >
          {submitButtonLabel}
        </button>
      </div>

      {feedbackBanner}
    </form>
  );
}