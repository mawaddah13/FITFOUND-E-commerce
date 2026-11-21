'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { FiX, FiUser } from 'react-icons/fi';

const EVENT_NAME = 'fitfound:login-prompt';

// mengirim sinyal spy pop up login muncul dari komponen lain
export function openLoginPrompt(message) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { message } }));
}

// tampilkan pop up ajakan login saat user belum masuk akun
export default function LoginPrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const loginRef = useRef(null);

  // tutup pop up login
  const close = useCallback(function handleClose() {
    setIsOpen(false);
  }, []);

  // menunggu event buka pop-up dan mengisi pesan
  useEffect(function registerPromptListener() {
    function handleOpen(event) {
      let nextMessage = 'Sign in to continue.';
      if (event.detail && event.detail.message) {
        nextMessage = event.detail.message;
      }
      setMessage(nextMessage);
      setIsOpen(true);
    }

    window.addEventListener(EVENT_NAME, handleOpen);
    // sudahi menunggu kode pas tampilan dilepas
    return function cleanupListener() {
      window.removeEventListener(EVENT_NAME, handleOpen);
    };
  }, []);

  // atur fokus tombol, kunci scroll, dan tombol escape pas pop up terbuka
  useEffect(function manageModalState() {
    if (!isOpen) {
      return undefined;
    }
    if (loginRef.current) {
      loginRef.current.focus();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return function cleanupModal() {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  if (!isOpen) {
    return null;
  }

  // mengarahkan user ke halaman login sambil membawa alamat halaman saat ini
  function goToLogin() {
    setIsOpen(false);
    let targetPath = '/';
    if (pathname) {
      targetPath = pathname;
    }
    router.push('/login?next=' + encodeURIComponent(targetPath));
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 text-center animate-pop-in"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4 text-neutral-700" />
        </button>

        <div className="mx-auto w-12 h-12 rounded-full bg-(--abumuda) flex items-center justify-center">
          <FiUser className="w-6 h-6 text-neutral-800" />
        </div>

        <h2 id="login-prompt-title" className="mt-4 text-lg font-semibold text-neutral-950">
          You&apos;re not signed in
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500">{message}</p>

        <button
          ref={loginRef}
          type="button"
          onClick={goToLogin}
          className="mt-5 w-full py-3 text-sm font-semibold text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer outline-none"
        >
          Login
        </button>
        <button
          type="button"
          onClick={close}
          className="mt-2 w-full py-2 text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>,
    document.body
  );
}