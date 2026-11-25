'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

// foto kecil yg kalau dipencet membesar di tengah layar, ada tombol X buat kembali
export default function PhotoLightbox({ src, alt, className = '', caption = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  // tutup pakai tombol escape n kunci scroll halaman belakang selama foto dibuka
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(keyEvent) {
      if (keyEvent.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  // klik di area gelap (bukan fotonya) = tutup
  function handleBackdropClick(clickEvent) {
    if (clickEvent.target === clickEvent.currentTarget) {
      setIsOpen(false);
    }
  }

  let captionElement = null;
  if (caption) {
    captionElement = <span className="mt-1.5 block text-[11px] text-neutral-500">{caption}</span>;
  }

  let viewer = null;
  if (isOpen) {
    viewer = createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 md:p-10 animate-fade-in"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close photo"
          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-lg hover:bg-neutral-200 transition cursor-pointer"
        >
          <FiX className="w-6 h-6" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-pop-in"
        />
      </div>,
      document.body
    );
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className="block w-full text-left group cursor-zoom-in">
        <img src={src} alt={alt} className={className} />
        {captionElement}
      </button>
      {viewer}
    </>
  );
}