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

const PendingContext = createContext(false);

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
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const formRef = useRef(null);
  const pendingDataRef = useRef(null);

  useEffect(() => {
    if (resetOnSuccess && state && state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state, resetOnSuccess]);

  function sendForm(formData) {
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

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
  if (showMessage && state && state.error) {
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