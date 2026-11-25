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
import { FieldErrorsContext } from '@/components/FieldError';

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

// ambil nama kolom dari label-nya (misal "Price (Rp)" jadi "Price") buat pesan error
function readFieldLabel(fieldElement) {
  let labelText = '';
  if (fieldElement.id) {
    const labelElement = fieldElement.form.querySelector(`label[for="${fieldElement.id}"]`);
    if (labelElement) {
      labelText = labelElement.textContent;
    }
  }
  if (!labelText) {
    labelText = fieldElement.getAttribute('aria-label') || '';
  }
  labelText = labelText.replace(/\(.*?\)/g, '').trim();
  if (!labelText) {
    return 'This field';
  }
  return labelText;
}

// bikin pesan error yg jelas sesuai jenis kesalahannya (kosong, minus, kepanjangan, dll)
function buildFieldMessage(fieldElement) {
  const validity = fieldElement.validity;
  const label = readFieldLabel(fieldElement);
  if (validity.valueMissing) {
    if (fieldElement.type === 'file') {
      return 'Please upload a photo.';
    }
    return `${label} is required.`;
  }
  if (validity.badInput || validity.stepMismatch) {
    return `${label} must be a whole number.`;
  }
  if (validity.rangeUnderflow) {
    if (Number(fieldElement.min) === 1) {
      return `${label} must be greater than 0.`;
    }
    if (Number(fieldElement.min) === 0) {
      return `${label} cannot be negative.`;
    }
    return `${label} must be at least ${fieldElement.min}.`;
  }
  if (validity.rangeOverflow) {
    return `${label} must be at most ${fieldElement.max}.`;
  }
  if (validity.tooShort) {
    return `${label} must be at least ${fieldElement.minLength} characters.`;
  }
  if (validity.tooLong) {
    return `${label} must be at most ${fieldElement.maxLength} characters.`;
  }
  if (validity.typeMismatch) {
    return `Please enter a valid ${label.toLowerCase()}.`;
  }
  if (validity.patternMismatch) {
    return `${label} format is not valid.`;
  }
  return fieldElement.validationMessage;
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
  inlineErrors = true,
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

  // error per kolom (tampil tetap di bawah kolomnya)
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastServerState, setLastServerState] = useState(state);
  if (lastServerState !== state) {
    setLastServerState(state);
    // server bilang kolom mana yg salah: tampilkan di bawah kolom itu
    if (inlineErrors && state && state.error && state.field) {
      setFieldErrors({ [state.field]: state.error });
    } else {
      setFieldErrors({});
    }
  }

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

  // cek isian di browser dulu: kolom yg salah dikasih pesan merah di bawahnya
  function checkFieldsInline(formElement) {
    const nextErrors = {};
    let firstInvalidField = null;
    for (const fieldElement of formElement.elements) {
      if (!fieldElement.willValidate || fieldElement.checkValidity()) {
        continue;
      }
      const slotElement = fieldElement.closest('[data-field-slot]');
      if (!slotElement) {
        // kolom tanpa tempat pesan: pakai pesan bawaan browser
        fieldElement.reportValidity();
        return false;
      }
      const slotName = slotElement.getAttribute('data-field-slot');
      if (!nextErrors[slotName]) {
        nextErrors[slotName] = buildFieldMessage(fieldElement);
      }
      if (!firstInvalidField) {
        firstInvalidField = fieldElement;
      }
    }
    setFieldErrors(nextErrors);
    if (firstInvalidField) {
      firstInvalidField.focus();
      return false;
    }
    return true;
  }

  // pesan merah kolom hilang begitu kolom itu diubah lagi
  function handleFieldInput(inputEvent) {
    const slotElement = inputEvent.target.closest('[data-field-slot]');
    if (!slotElement) {
      return;
    }
    const slotName = slotElement.getAttribute('data-field-slot');
    if (fieldErrors[slotName]) {
      const nextErrors = { ...fieldErrors };
      delete nextErrors[slotName];
      setFieldErrors(nextErrors);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (inlineErrors && !checkFieldsInline(event.currentTarget)) {
      return;
    }
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
  } else if (inlineErrors && state && state.error && state.field) {
    // error sudah tampil di bawah kolomnya, tidak perlu kotak merah di atas
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
      <FieldErrorsContext.Provider value={fieldErrors}>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onInput={handleFieldInput}
          onChange={handleFieldInput}
          noValidate={inlineErrors}
          className={className}
        >
          {messageBox}
          {children}
        </form>
      </FieldErrorsContext.Provider>


      {confirmDialogNode}
    </PendingContext.Provider>
  );
}