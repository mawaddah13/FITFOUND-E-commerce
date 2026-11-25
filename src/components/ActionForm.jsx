'use client';

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  startTransition,
} from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showToast } from '@/components/Toaster';

const PendingContext = createContext(false);

// ubah isi form jadi teks supaya bisa dibandingkan (file dibaca dari nama n ukurannya)
function serializeForm(formElement) {
  const parts = [];
  for (const [fieldName, fieldValue] of new FormData(formElement).entries()) {
    if (typeof fieldValue === 'string') {
      parts.push(`${fieldName}=${fieldValue}`);
    } else {
      parts.push(`${fieldName}=file:${fieldValue.name}:${fieldValue.size}`);
    }
  }
  return parts.join('&');
}

export function usePendingForm() {
  return useContext(PendingContext);
}

export default function ActionForm({
  action,
  children,
  className = '',
  confirmMessage = '',
  confirmDescription = '',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmTone = 'danger',
  resetOnSuccess = false,
  showMessage = true,
  messageAsToast = false,
  skipIfUnchanged = false,
}) {
  // kalau pakai toast, pesan dikirim langsung begitu server menjawab
  // (sebelum baris/form-nya hilang krn data di-refresh), jadi toast "berhasil dihapus" tetap muncul
  async function runAction(prevState, formData) {
    const result = await action(prevState, formData);
    if (messageAsToast && result) {
      if (result.error) {
        showToast('error', result.error);
      } else if (result.success) {
        showToast('success', result.success);
      }
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(runAction, null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const formRef = useRef(null);
  const pendingDataRef = useRef(null);
  const savedSnapshotRef = useRef(null);

  // simpan isi awal form, buat cek apakah user benar2 mengubah sesuatu
  useEffect(() => {
    if (skipIfUnchanged && formRef.current) {
      savedSnapshotRef.current = serializeForm(formRef.current);
    }
  }, [skipIfUnchanged]);

  useEffect(() => {
    if (resetOnSuccess && state && state.success && formRef.current) {
      formRef.current.reset();
    }
    // setelah berhasil disimpan, isi form sekarang jadi patokan baru
    if (skipIfUnchanged && state && state.success && formRef.current) {
      savedSnapshotRef.current = serializeForm(formRef.current);
    }
  }, [state, resetOnSuccess, skipIfUnchanged]);


  function sendForm(formData) {
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // tidak ada yg diubah: jangan kirim n jangan munculkan notifikasi apa pun
    if (skipIfUnchanged && savedSnapshotRef.current === serializeForm(event.currentTarget)) {
      return;
    }

    if (confirmMessage) {
      pendingDataRef.current = formData;
      setIsConfirmOpen(true);
      return;
    }

    sendForm(formData);
  }

  function handleConfirm() {
    setIsConfirmOpen(false);
    if (pendingDataRef.current) {
      sendForm(pendingDataRef.current);
      pendingDataRef.current = null;
    }
  }

  const handleCancel = useCallback(() => {
    setIsConfirmOpen(false);
    pendingDataRef.current = null;
  }, []);

  let messageBox = null;
  if (messageAsToast) {
    messageBox = null;
  } else if (showMessage && state && state.error) {
    messageBox = (
      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
        {state.error}
      </div>
    );
  } else if (showMessage && state && state.success) {
    messageBox = (
      <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
        {state.success}
      </div>
    );
  }

  let confirmDialogNode = null;
  if (confirmMessage) {
    confirmDialogNode = (
      <ConfirmDialog
        open={isConfirmOpen}
        title={confirmMessage}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={confirmTone}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <PendingContext.Provider value={isPending}>
      <form ref={formRef} onSubmit={handleSubmit} className={className}>
        {messageBox}
        {children}
      </form>


      {confirmDialogNode}
    </PendingContext.Provider>
  );
}