'use client';

import { useCallback, useState } from 'react';
import SizePickerModal from '@/components/SizePickerModal';
import { openLoginPrompt } from '@/components/LoginPrompt';

// tampilkan tombol tambah ke keranjang n buka modal ukuran atau prompt login
export default function AddToCartButton({ productId, isLoggedIn, disabled = false, className = '' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // cek status login terus buka prompt login atau modal ukuran
  function handleClick() {
    if (!isLoggedIn) {
      openLoginPrompt('Sign in to add items to your cart.');
      return;
    }

    setIsModalOpen(true);
  }

  const closeModal = useCallback(function handleCloseModal() {
    setIsModalOpen(false);
  }, []);

  const handleAdded = useCallback(function handleItemAdded() {
    setJustAdded(true);
    setTimeout(function resetAddedState() {
      setJustAdded(false);
    }, 1800);
  }, []);

  let buttonLabel = 'Add to Cart';
  if (disabled) {
    buttonLabel = 'Sold Out';
  } else if (justAdded) {
    buttonLabel = 'Added ✓';
  }

  let stateClass = 'cursor-pointer';
  if (disabled) {
    stateClass = 'bg-neutral-200! text-neutral-500! hover:bg-neutral-200! cursor-not-allowed';
  }

  let sizePickerElement = null;
  if (isModalOpen) {
    sizePickerElement = (
      <SizePickerModal productId={productId} onClose={closeModal} onAdded={handleAdded} />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`block w-full py-2 text-center text-xs font-medium transition ${className} ${stateClass}`}
      >
        {buttonLabel}
      </button>

      {sizePickerElement}
    </>
  );
}