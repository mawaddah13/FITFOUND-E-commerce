'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FiX, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import { formatRupiah } from '@/lib/format';

// baca respons json n kembalikan null kalau bukan json valid
async function readJson(apiResponse) {
  try {
    return await apiResponse.json();
  } catch {
    return null;
  }
}

// pemilih ukuran, jumlah produk kirim ke keranjang
export default function SizePickerModal({ productId, mode = 'cart', onClose, onAdded }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [ukuran, setUkuran] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // detail produk n daftar ukuran pas modal dibuka
  useEffect(function fetchProductSizes() {
    let isActive = true;

    // ambil data produk dan ukuran dari endpoint api
    async function loadProduct() {
      try {
        const apiResponse = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
        const responseData = await readJson(apiResponse);

        if (!isActive) {
          return;
        }

        if (!apiResponse.ok || !responseData || !responseData.product) {
          if (responseData && responseData.error) {
            setErrorMessage(responseData.error);
          } else {
            setErrorMessage(
              `Failed to load sizes. Please Try Again`
            );
          }
          return;
        }

        setProduct(responseData.product);
        setSizes(responseData.sizes);

        const availableSizes = responseData.sizes.filter(function filterAvailableSize(sizeItem) {
          return sizeItem.stok > 0;
        });

        if (availableSizes.length === 1) {
          setUkuran(availableSizes[0].ukuran);
        }
      } catch {
        if (isActive) {
          setErrorMessage('Cannot reach the server. Please check your connection and try again.');
        }
      } finally {
        if (isActive) {
          setIsLoadingData(false);
        }
      }
    }

    loadProduct();

    // batal pembaruan state klo ditutup sblum fetch selesai
    return function cleanupFetch() {
      isActive = false;
    };
  }, [productId]);

  // kunci scroll latar belakang
  useEffect(function bindModalKeyboardAndScroll() {
    function handleKeyDown(keyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // kembali scroll halaman, hapus listener pas dilepas
    return function cleanupModalListeners() {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const selectedSize = sizes.find(function findMatchingSize(sizeItem) {
    return sizeItem.ukuran === ukuran;
  }) || null;

  const totalStock = sizes.reduce(function sumSizeStock(currentSum, sizeItem) {
    return currentSum + Number(sizeItem.stok);
  }, 0);

  let shownStock = totalStock;
  if (selectedSize) {
    shownStock = selectedSize.stok;
  }

  let maxQty = 1;
  if (selectedSize) {
    maxQty = selectedSize.stok;
  }

  // pilih ukuran yang tersedia n hrs ssuai stok
  function chooseSize(sizeItem) {
    if (sizeItem.stok <= 0) {
      return;
    }

    setUkuran(sizeItem.ukuran);
    setErrorMessage('');

    if (jumlah > sizeItem.stok) {
      setJumlah(sizeItem.stok);
    }
  }

  // min 1, mak stok tersedia
  function changeQty(nextQty) {
    if (nextQty < 1 || nextQty > maxQty) {
      return;
    }

    setJumlah(nextQty);
  }

  // kirim item ke keranja,n arahkn ke halaman keranjang/tutup modal
  async function submitSelection(submitMode) {
    if (!selectedSize) {
      setErrorMessage('Please select a size first.');
      return;
    }

    if (jumlah > selectedSize.stok) {
      setErrorMessage(`Only ${selectedSize.stok} item(s) left for size ${ukuran}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // buy now: langsung ke checkout tanpa masuk keranjang
    if (submitMode === 'buy') {
      const checkoutParams = new URLSearchParams({
        product: String(productId),
        size: ukuran,
        qty: String(jumlah),
      });
      router.push(`/buyer/checkout?${checkoutParams.toString()}`);
      onClose();
      return;
    }

    try {
      const apiResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_product: productId, ukuran, jumlah }),
      });
      const responseData = await readJson(apiResponse);

      if (!apiResponse.ok) {
        if (responseData && responseData.error) {
          setErrorMessage(responseData.error);
        } else {
          setErrorMessage(`Failed to add to cart (error ${apiResponse.status}).`);
        }
        setIsSubmitting(false);
        return;
      }

      router.refresh();
      onAdded();
      onClose();
    } catch {
      setErrorMessage('Cannot reach the server. Please try again.');
      setIsSubmitting(false);
    }
  }

  let modalContent = null;
  if (isLoadingData) {
    modalContent = <p className="py-16 text-center text-sm text-neutral-950">Loading sizes...</p>;
  } else if (!product) {
    modalContent = <p className="py-12 px-2 text-center text-sm text-red-600">{errorMessage}</p>;
  } else {
    let stockClassName = 'text-neutral-950';
    if (selectedSize && selectedSize.stok <= 3) {
      stockClassName = 'text-amber-700 font-medium';
    }

    let imageBox = (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
    );
    if (product.gambar) {
      imageBox = <img src={product.gambar} alt={product.nama_produk} className="w-full h-full object-cover" />;
    }

    let selectedSizeSuffix = '';
    if (selectedSize) {
      selectedSizeSuffix = ` (size ${ukuran})`;
    }

    let sizeButtonsSection = <p className="text-xs text-red-600">This product has no sizes yet.</p>;
    if (sizes.length > 0) {
      sizeButtonsSection = (
        <div className="flex flex-wrap gap-2">
          {sizes.map(function renderSizeButton(sizeItem) {
            const isSoldOut = sizeItem.stok <= 0;
            let sizeButtonClass = 'min-w-12 px-4 py-2 text-xs font-medium rounded-lg border transition ';

            if (isSoldOut) {
              sizeButtonClass += 'border-neutral-200 bg-neutral-100 text-neutral-400 line-through cursor-not-allowed';
            } else if (sizeItem.ukuran === ukuran) {
              sizeButtonClass += 'border-neutral-950 bg-neutral-950 text-white cursor-pointer';
            } else {
              sizeButtonClass += 'border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950 cursor-pointer';
            }

            let sizeTitle = `Size ${sizeItem.ukuran}`;
            if (isSoldOut) {
              sizeTitle = `Size ${sizeItem.ukuran} is sold out`;
            }

            // pilih ukuran pas tombol ukuran diklik
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
                className={sizeButtonClass}
              >
                {sizeItem.ukuran}
              </button>
            );
          })}
        </div>
      );
    }

    let errorBanner = null;
    if (errorMessage) {
      errorBanner = (
        <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMessage}</p>
      );
    }

    let buyNowLabel = 'Buy Now';
    if (isSubmitting) {
      buyNowLabel = 'Please wait...';
    }

    let addToCartLabel = 'Add to Cart';
    if (isSubmitting) {
      addToCartLabel = 'Adding...';
    }

    // kurangi jumlah produk
    function handleDecreaseQty() {
      changeQty(jumlah - 1);
    }

    // tambah jumlah
    function handleIncreaseQty() {
      changeQty(jumlah + 1);
    }

    // tambah produk ke keranjang belanja
    function handleAddToCartClick() {
      submitSelection('cart');
    }

    // tambah produk n langsung lanjut ke halaman keranjang
    function handleBuyNowClick() {
      submitSelection('buy');
    }

    const isDecreaseDisabled = !selectedSize || jumlah <= 1;
    const isIncreaseDisabled = !selectedSize || jumlah >= maxQty;
    const isSubmitDisabled = isSubmitting || totalStock <= 0;

    // tombol akhir menyesuaikan tombol yg diklik di kartu produk
    let submitButton = (
      <button
        type="button"
        onClick={handleAddToCartClick}
        disabled={isSubmitDisabled}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiShoppingCart className="w-4 h-4" />
        {addToCartLabel}
      </button>
    );
    if (mode === 'buy') {
      submitButton = (
        <button
          type="button"
          onClick={handleBuyNowClick}
          disabled={isSubmitDisabled}
          className="mt-6 w-full py-3 text-sm font-medium text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buyNowLabel}
        </button>
      );
    }

    modalContent = (
      <>
        <div className="flex gap-4 pr-8">
          <div className="w-24 h-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">{imageBox}</div>
          <div className="min-w-0 flex flex-col justify-end">
            <p className="text-sm text-neutral-950 line-clamp-2">{product.nama_produk}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-950">{formatRupiah(product.harga)}</p>
            <p className={`mt-0.5 text-xs ${stockClassName}`}>
              Stock: {shownStock}
              {selectedSizeSuffix}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-neutral-200">
          <p className="text-sm font-semibold text-neutral-950 mb-3">Size</p>
          {sizeButtonsSection}
        </div>

        <div className="mt-5 pt-5 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-950">Quantity</p>
          <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handleDecreaseQty}
              disabled={isDecreaseDisabled}
              aria-label="Decrease quantity"
              className="w-9 h-9 flex items-center justify-center text-neutral-950 hover:bg-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <FiMinus className="w-4 h-4" />
            </button>
            <span className="w-12 h-9 flex items-center justify-center text-sm text-neutral-950 border-x border-neutral-300">
              {jumlah}
            </span>
            <button
              type="button"
              onClick={handleIncreaseQty}
              disabled={isIncreaseDisabled}
              aria-label="Increase quantity"
              className="w-9 h-9 flex items-center justify-center text-neutral-950 hover:bg-neutral-100 disabled:text-neutral-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorBanner}

        {submitButton}
      </>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select size"
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto animate-fade-up"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1 text-neutral-950 hover:text-neutral-600 cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>
        {modalContent}
      </div>
    </div>,
    document.body
  );
}