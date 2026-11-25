'use client';

import { useState } from 'react';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';

// tombol tolak seller, pas dipencet muncul kolom alasan dulu baru bisa dikirim
export default function RejectSellerForm({ action, storeLabel }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition cursor-pointer"
      >
        Reject
      </button>
    );
  }

  return (
    <ActionForm
      action={action}
      messageAsToast
      confirmMessage={`Reject ${storeLabel}?`}
      confirmDescription="The seller will see this reason on their account page."
      confirmLabel="Reject"
      className="w-full mt-1 space-y-2"
    >
      <label htmlFor={`reject-${storeLabel}`} className="block text-xs font-medium text-neutral-800">
        Reason for rejection
      </label>
      <textarea
        id={`reject-${storeLabel}`}
        name="alasan_tolak"
        required
        minLength={5}
        maxLength={500}
        rows={3}
        placeholder="e.g. The ID card photo is blurry, please register again with a clear photo."
        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
        >
          Cancel
        </button>
        <SubmitButton variant="danger" size="sm" pendingText="Rejecting..." className="flex-1">
          Reject Seller
        </SubmitButton>
      </div>
    </ActionForm>
  );
}