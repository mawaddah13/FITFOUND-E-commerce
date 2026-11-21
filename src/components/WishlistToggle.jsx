'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { openLoginPrompt } from '@/components/LoginPrompt';

// urus status favorit n kirim permintaan tambah/hapus ke server
export default function WishlistToggle({
  productId,
  initialWishlisted = false,
  isLoggedIn,
  className = '',
  refreshOnChange = false,
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  // ubah status wishlist nsinkronkan dengan endpoint api
  async function handleClick() {
    if (!isLoggedIn) {
      openLoginPrompt('Sign in to save items to your wishlist.');
      return;
    }

    const nextWishlisted = !wishlisted;
    setWishlisted(nextWishlisted);
    setIsLoading(true);

    try {
      let apiResponse;
      if (nextWishlisted) {
        apiResponse = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_product: productId }),
        });
      } else {
        apiResponse = await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
      }

      if (!apiResponse.ok) {
        setWishlisted(!nextWishlisted);
      } else if (refreshOnChange) {
        router.refresh();
      }
    } catch {
      setWishlisted(!nextWishlisted);
    } finally {
      setIsLoading(false);
    }
  }

  let buttonLabel = 'Add to wishlist';
  if (wishlisted) {
    buttonLabel = 'Remove from wishlist';
  }

  let heartIcon = <FiHeart className="w-5 h-5 text-neutral-800" />;
  if (wishlisted) {
    heartIcon = <FaHeart className="w-5 h-5 text-red-500" />;
  }

  const buttonClassName = `inline-flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-60 ${className}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={buttonLabel}
      aria-pressed={wishlisted}
      className={buttonClassName}
    >
      {heartIcon}
    </button>
  );
}