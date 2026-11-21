'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { logoutAction } from '@/app/action/auth';

// tampillkan tombol logout beserta dialog konfirmasi sebelum keluar akun
export default function LogoutButton({ className = '', children = 'Logout' }) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const cancelRef = useRef(null);

  // atur fokus ke tombol cancel, kunci scroll, dan tutup lewat tombol escape
  useEffect(function manageLogoutModal() {
    if (!open) {
      return undefined;
    }

    if (cancelRef.current) {
      cancelRef.current.focus();
    }

    // tutup dialog konfirmasi saat tombol escape ditekan
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // kembalikan scroll halaman dan melepas listener saat dialog ditutup
    return function cleanupLogoutModal() {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  // buka dialog konfirmasi logout
  function handleOpenModal() {
    setOpen(true);
  }

  // tutup
  function handleCloseModal() {
    setOpen(false);
  }

  // tandai proses logout lagi berjalan saat form dikirim
  function handleFormSubmit() {
    setIsLoggingOut(true);
  }

  let submitLabel = 'Log out';
  if (isLoggingOut) {
    submitLabel = 'Logging out...';
  }

  let modalContent = null;
  if (open) {
    modalContent = createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={handleCloseModal} />

        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          aria-describedby="logout-desc"
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-pop-in"
        >
          <h2 id="logout-title" className="text-lg font-semibold leading-snug text-neutral-950 whitespace-normal">
            Are you sure you want to log out?
          </h2>
          <p id="logout-desc" className="mt-1.5 text-sm text-neutral-500 whitespace-normal">
            You will need to sign in again to access your account.
          </p>

          <form
            action={logoutAction}
            onSubmit={handleFormSubmit}
            className="mt-6 grid grid-cols-2 gap-3"
          >
            <button
              type="submit"
              disabled={isLoggingOut}
              className="py-3 text-sm font-medium text-red-600 bg-transparent hover:underline underline-offset-4 cursor-pointer outline-none disabled:opacity-50"
            >
              {submitLabel}
            </button>

            <button
              ref={cancelRef}
              type="button"
              onClick={handleCloseModal}
              disabled={isLoggingOut}
              className="py-3 text-sm font-semibold text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 transition cursor-pointer outline-none"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <>
      <button type="button" onClick={handleOpenModal} className={className}>
        {children}
      </button>
      {modalContent}
    </>
  );
}