'use client';

import { useCallback, useState } from 'react';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import SizePickerModal from '@/components/SizePickerModal';
import { openLoginPrompt } from '@/components/LoginPrompt';

// tampilkan tombol tambah ke keranjang n buka modal ukuran atau prompt login
export default function AddToCartButton({ productId, isLoggedIn, disabled = false, className = '' }) {
  const [modalMode, setModalMode] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  // cek status login terus buka prompt login atau modal ukuran
  function openModal(nextMode) {
    if (!isLoggedIn) {
      if (nextMode === 'buy') {
        openLoginPrompt('Sign in to buy this product.');
      } else {
        openLoginPrompt('Sign in to add items to your cart.');
      }
      return;
    }

    setModalMode(nextMode);
  }

  // buka modal mode keranjang
  function handleCartClick() {
    openModal('cart');
  }

  // buka modal mode beli langsung
  function handleBuyNowClick() {
    openModal('buy');
  }

  const closeModal = useCallback(function handleCloseModal() {
    setModalMode('');
  }, []);

  const handleAdded = useCallback(function handleItemAdded() {
    setJustAdded(true);
    setTimeout(function resetAddedState() {
      setJustAdded(false);
    }, 1800);
  }, []);

  let sizePickerElement = null;
  if (modalMode !== '') {
    sizePickerElement = (
      <SizePickerModal
        productId={productId}
        mode={modalMode}
        onClose={closeModal}
        onAdded={handleAdded}
      />
    );
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`block w-full py-2 text-center text-xs font-medium transition ${className} bg-neutral-200! text-neutral-500! hover:bg-neutral-200! cursor-not-allowed`}
      >
        Sold Out
      </button>
    );
  }

  let cartIcon = <FiShoppingCart className="w-4 h-4" aria-hidden="true" />;
  let cartLabel = 'Add to cart';
  if (justAdded) {
    cartIcon = <FiCheck className="w-4 h-4" aria-hidden="true" />;
    cartLabel = 'Added to cart';
  }

  return (
    <>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={handleCartClick}
          aria-label={cartLabel}
          title={cartLabel}
          className="w-10 shrink-0 flex items-center justify-center rounded-lg border border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
        >
          {cartIcon}
        </button>
        <button
          type="button"
          onClick={handleBuyNowClick}
          className={`block flex-1 py-2 text-center text-xs font-medium transition cursor-pointer ${className}`}
        >
          Buy Now
        </button>
      </div>

      {sizePickerElement}
    </>
  );
}