'use client';

import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// kolom password pakai ikon mata
export default function PasswordInput({ className = '', ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);

  // ganti tampilan password: titik ke teks biasa
  function handleToggleVisible() {
    setIsVisible(!isVisible);
  }

  let inputType = 'password';
  let toggleLabel = 'Show password';
  let toggleIcon = <FiEye className="w-4 h-4" aria-hidden="true" />;
  if (isVisible) {
    inputType = 'text';
    toggleLabel = 'Hide password';
    toggleIcon = <FiEyeOff className="w-4 h-4" aria-hidden="true" />;
  }

  return (
    <div className="relative">
      <input {...inputProps} type={inputType} className={`${className} pr-11!`} />
      <button
        type="button"
        onClick={handleToggleVisible}
        aria-label={toggleLabel}
        title={toggleLabel}
        className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-neutral-500 hover:text-neutral-950 cursor-pointer"
      >
        {toggleIcon}
      </button>
    </div>
  );
}