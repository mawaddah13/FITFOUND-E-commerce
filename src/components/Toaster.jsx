'use client';

import { useEffect, useState } from 'react';

// kirim toast dari komponen mana saja: showToast('success', 'Product deleted.')
export function showToast(type, text) {
  window.dispatchEvent(new CustomEvent('fitfound:toast', { detail: { type, text } }));
}

// wadah toast di pojok kanan atas, tetap tampil walau form / baris tabelnya sudah hilang
export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let nextId = 1;

    function handleToast(toastEvent) {
      const toastId = nextId;
      nextId += 1;
      setToasts((currentToasts) => [...currentToasts, { id: toastId, ...toastEvent.detail }]);
      // hilang sendiri setelah 4 detik
      setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((toastItem) => toastItem.id !== toastId));
      }, 4000);
    }

    window.addEventListener('fitfound:toast', handleToast);
    return () => window.removeEventListener('fitfound:toast', handleToast);
  }, []);

  function closeToast(toastId) {
    setToasts((currentToasts) => currentToasts.filter((toastItem) => toastItem.id !== toastId));
  }

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-24 right-4 z-[90] w-[calc(100%-2rem)] max-w-sm space-y-2">
      {toasts.map((toastItem) => {
        let toneClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
        if (toastItem.type === 'error') {
          toneClass = 'bg-red-50 border-red-200 text-red-700';
        }

        return (
          <div
            key={toastItem.id}
            role="status"
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm animate-fade-up ${toneClass}`}
          >
            <p className="flex-1">{toastItem.text}</p>
            <button
              type="button"
              onClick={() => closeToast(toastItem.id)}
              aria-label="Close"
              className="shrink-0 font-semibold leading-none cursor-pointer opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}