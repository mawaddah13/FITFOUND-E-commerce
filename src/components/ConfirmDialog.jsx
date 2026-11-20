'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  open,
  title,
  description = '',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isPending = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    if (cancelRef.current) {
      cancelRef.current.focus();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  let confirmClass = 'text-red-600';
  if (tone === 'neutral') {
    confirmClass = 'text-neutral-700';
  }

  let confirmText = confirmLabel;
  if (isPending) {
    confirmText = 'Please wait...';
  }

  let descriptionNode = null;
  if (description) {
    descriptionNode = (
      <p className="mt-1.5 text-sm text-neutral-500 whitespace-normal">{description}</p>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onCancel} />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-pop-in"
      >
        <h2 id="confirm-title" className="text-lg font-semibold leading-snug text-neutral-950 whitespace-normal">
          {title}
        </h2>
        {descriptionNode}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`py-3 text-sm font-medium bg-transparent hover:underline underline-offset-4 cursor-pointer outline-none disabled:opacity-50 ${confirmClass}`}
          >
            {confirmText}
          </button>

          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="py-3 text-sm font-semibold text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 transition cursor-pointer outline-none"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}