'use client';

import Link from 'next/link';
import { FiShoppingCart } from 'react-icons/fi';
import { openLoginPrompt } from '@/components/LoginPrompt';

// tmpil tombol wishlist/ buka pop up login kalau dia guest
export default function CartButton({
  session,
  className = 'p-1 hover:opacity-70 hover:-translate-y-0.5 transition inline-flex cursor-pointer',
  onClick,
  children,
}) {
  let content = <FiShoppingCart className="w-5 h-5 text-neutral-800" />;

  if (children) {
    content = children;
  }

  // on klik jalan lalu buka pop-up login untuk guest
  function handleGuestClick() {
    if (onClick) {
      onClick();
    }
    openLoginPrompt('Sign in to view your shopping cart.');
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={handleGuestClick}
        aria-label="Shopping Cart"
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href="/buyer/cart" onClick={onClick} aria-label="Shopping Cart" className={className}>
      {content}
    </Link>
  );
}