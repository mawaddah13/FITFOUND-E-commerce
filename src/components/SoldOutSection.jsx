'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

// produk yg stoknya habis disembunyikan dulu di bawah katalog, baru tampil kalau tombolnya dipencet (kayak shopee)
export default function SoldOutSection({ count, children }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleToggle() {
    setIsOpen(!isOpen);
  }

  let buttonText = `Show sold out products (${count})`;
  let chevronClass = '';
  if (isOpen) {
    buttonText = 'Hide sold out products';
    chevronClass = 'rotate-180';
  }

  let soldOutGrid = null;
  if (isOpen) {
    soldOutGrid = <div className="mt-6 animate-fade-up">{children}</div>;
  }

  return (
    <div className="mt-10 pt-8 border-t border-neutral-200">
      <div className="text-center">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-300 rounded-full text-sm font-medium text-neutral-950 hover:border-neutral-900 transition cursor-pointer"
        >
          {buttonText}
          <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${chevronClass}`} aria-hidden="true" />
        </button>
      </div>
      {soldOutGrid}
    </div>
  );
}