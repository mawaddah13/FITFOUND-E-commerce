'use client';

import Link from 'next/link';
import { FiHeart } from 'react-icons/fi';
import { openLoginPrompt } from '@/components/LoginPrompt';

// tmpil tombol wishlist/buka pop up login kalau dia guest
export default function WishlistButton({
  session,
  showLabel = false,
  className = 'hidden md:inline-flex p-1 hover:opacity-70 hover:-translate-y-0.5 transition cursor-pointer',
  onClick,
}) {
  let labelElement = null;
  if (showLabel) {
    labelElement = <span>Wishlist</span>;
  }

  const icon = <FiHeart className="w-5 h-5 text-neutral-800" />;

  // onn klik jalan lalu buka pop up login untuk guest
  function handleGuestClick() {
    if (onClick) {
      onClick();
    }
    openLoginPrompt('Sign in to view and save items to your wishlist.');
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={handleGuestClick}
        aria-label="Wishlist"
        className={className}
      >
        {icon}
        {labelElement}
      </button>
    );
  }

  return (
    <Link href="/buyer/wishlist" onClick={onClick} aria-label="Wishlist" className={className}>
      {icon}
      {labelElement}
    </Link>
  );
}