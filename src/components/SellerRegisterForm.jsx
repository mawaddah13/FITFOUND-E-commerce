'use client';

import { useState, useRef, useEffect, useActionState, startTransition } from 'react';
import { FiCheck, FiUploadCloud } from 'react-icons/fi';
import { registerAction } from '@/app/action/auth';
import PasswordInput from '@/components/PasswordInput';

const inputClass =
  'w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-(--biru) hover:border-neutral-300 text-neutral-900 placeholder:text-neutral-400';
const labelClass = 'block text-sm font-medium text-neutral-800 mb-1.5';

// 3 tahap daftar seller, tampil kayak indikator status pesanan
const STEPS = ['Personal Info', 'Store Info', 'Verification'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

// kotak upload foto (ktp / selfie) + preview kecil
function PhotoField({ id, name, label, hint }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');

  // hapus url preview lama biar tidak numpuk di memori
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleChange(changeEvent) {
    const pickedFile = changeEvent.target.files[0];
    if (!pickedFile) {
      setPreviewUrl('');
      setFileName('');
      return;
    }
    setPreviewUrl(URL.createObjectURL(pickedFile));
    setFileName(pickedFile.name);
  }

  let boxContent = (
    <span className="flex flex-col items-center gap-1.5 text-neutral-500">
      <FiUploadCloud className="w-6 h-6" aria-hidden="true" />
      <span className="text-xs">Click to upload (JPG, PNG, WEBP · max 5 MB)</span>
    </span>
  );
  if (previewUrl) {
    boxContent = (
      <span className="flex items-center gap-3 w-full">
        <img src={previewUrl} alt={label} className="w-16 h-16 rounded-lg object-cover border border-neutral-200" />
        <span className="min-w-0 text-left">
          <span className="block text-xs font-medium text-neutral-900 truncate">{fileName}</span>
          <span className="block text-[11px] text-(--biru)">Click to change photo</span>
        </span>
      </span>
    );
  }

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <label
        htmlFor={id}
        className="flex items-center justify-center min-h-24 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-xl hover:border-(--biru) transition cursor-pointer"
      >
        {boxContent}
      </label>
      <input
        id={id}
        type="file"
        name={name}
        required
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
      <p className="mt-1.5 text-[11px] text-neutral-500">{hint}</p>
    </div>
  );
}

// form daftar seller 3 tahap: informasi pribadi, informasi toko, verifikasi n keamanan
export default function SellerRegisterForm({ onSwitch }) {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [step, setStep] = useState(1);
  const [clientError, setClientError] = useState('');
  const formRef = useRef(null);

  // kalau server nolak, langsung loncat ke tahap yg salah
  const [lastState, setLastState] = useState(state);
  if (lastState !== state) {
    setLastState(state);
    if (state && state.step) {
      setStep(state.step);
    }
    setClientError('');
  }

  let values = {};
  if (state && state.values) {
    values = state.values;
  }

  // cek isian di tahap yg lagi tampil, tampilkan pesan bawaan browser kalau ada yg kosong / salah
  function isCurrentStepValid() {
    // ambil kotak tahap yg lagi tampil lewat data-step (tidak pakai ref per tahap)
    const formElement = formRef.current;
    if (!formElement) {
      return true;
    }
    const stepBox = formElement.querySelector(`[data-step="${step}"]`);
    if (!stepBox) {
      return true;
    }
    const fields = stepBox.querySelectorAll('input, textarea');
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    if (step === 3) {
      for (const photoName of ['foto_ktp', 'foto_wajah']) {
        const photoFile = formElement.elements[photoName].files[0];
        if (photoFile && photoFile.size > MAX_PHOTO_SIZE) {
          setClientError(`"${photoFile.name}" is larger than 5 MB.`);
          return false;
        }
      }
      if (formElement.elements.password.value !== formElement.elements.konfirmasi_password.value) {
        setClientError('Password confirmation does not match.');
        return false;
      }
    }

    setClientError('');
    return true;
  }

  // enter / tombol next: lanjut tahap berikutnya, di tahap terakhir baru kirim ke server
  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (!isCurrentStepValid()) {
      return;
    }
    if (step < STEPS.length) {
      setStep(step + 1);
      return;
    }
    const formData = new FormData(submitEvent.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleBack() {
    setClientError('');
    setStep(step - 1);
  }

  let errorText = clientError;
  if (!errorText && state && state.error) {
    errorText = state.error;
  }
  let errorBox = null;
  if (errorText) {
    errorBox = (
      <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center animate-fade-up">
        {errorText}
      </div>
    );
  }

  const stepper = (
    <ol className="flex items-start w-full mb-6">
      {STEPS.map(function buildStepItem(stepLabel, stepIndex) {
        const stepNumber = stepIndex + 1;
        const isDone = stepNumber < step;
        const isCurrent = stepNumber === step;
        const isLast = stepNumber === STEPS.length;

        let circleClass = 'border-neutral-300 bg-white text-neutral-500';
        let labelTone = 'text-neutral-500';
        if (isDone) {
          circleClass = 'border-neutral-950 bg-neutral-950 text-white';
          labelTone = 'text-neutral-950';
        } else if (isCurrent) {
          circleClass = 'border-(--biru) bg-(--biru) text-white ring-4 ring-blue-100';
          labelTone = 'text-neutral-950 font-semibold';
        }

        let connectorLine = null;
        if (!isLast) {
          let lineColorClass = 'bg-neutral-300';
          if (isDone) {
            lineColorClass = 'bg-neutral-950';
          }
          connectorLine = <span className={`absolute top-3.5 left-1/2 w-full h-0.5 transition-colors duration-300 ${lineColorClass}`} />;
        }

        let markerContent = stepNumber;
        if (isDone) {
          markerContent = <FiCheck className="w-4 h-4" />;
        }

        return (
          <li key={stepLabel} className="relative flex-1 flex flex-col items-center text-center px-1">
            {connectorLine}
            <span
              className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300 ${circleClass}`}
            >
              {markerContent}
            </span>
            <span className={`mt-2 text-[11px] sm:text-xs leading-tight ${labelTone}`}>{stepLabel}</span>
          </li>
        );
      })}
    </ol>
  );

  // semua tahap tetap ada di form (cuma disembunyikan) supaya isiannya ikut terkirim
  function stepClass(stepNumber) {
    if (stepNumber === step) {
      return 'space-y-4 animate-fade-up';
    }
    return 'hidden';
  }

  let submitText = 'Next';
  if (step === STEPS.length) {
    submitText = 'Create Seller Account';
    if (isPending) {
      submitText = 'Creating account...';
    }
  }

  let backButton = null;
  if (step > 1) {
    backButton = (
      <button
        type="button"
        onClick={handleBack}
        disabled={isPending}
        className="flex-1 py-3.5 text-sm font-medium rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-100 transition cursor-pointer disabled:opacity-50"
      >
        Back
      </button>
    );
  }

  return (
    <>
      {stepper}
      {errorBox}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="role" value="seller" />

        {/* tahap 1: informasi pribadi */}
        <div data-step="1" className={stepClass(1)}>
          <div>
            <label htmlFor="seller-nama" className={labelClass}>Full Name</label>
            <input
              id="seller-nama"
              type="text"
              name="nama"
              required
              minLength={3}
              maxLength={100}
              defaultValue={values.nama}
              placeholder="Name as written on your ID card"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seller-email" className={labelClass}>Email</label>
            <input
              id="seller-email"
              type="email"
              name="email"
              required
              defaultValue={values.email}
              placeholder="email@gmail.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seller-hp" className={labelClass}>Phone Number</label>
            <input
              id="seller-hp"
              type="tel"
              name="no_hp"
              required
              pattern="[0-9+\-\s]{8,20}"
              defaultValue={values.no_hp}
              placeholder="08xxxxxxxxxx"
              className={inputClass}
            />
          </div>
        </div>

        {/* tahap 2: informasi toko */}
        <div data-step="2" className={stepClass(2)}>
          <div>
            <label htmlFor="seller-toko" className={labelClass}>Store Name</label>
            <input
              id="seller-toko"
              type="text"
              name="nama_toko"
              required
              minLength={3}
              maxLength={120}
              defaultValue={values.nama_toko}
              placeholder="Your fashion store name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seller-alamat" className={labelClass}>Store Address</label>
            <textarea
              id="seller-alamat"
              name="alamat"
              required
              minLength={10}
              rows={3}
              defaultValue={values.alamat}
              placeholder="Street, city, and postal code"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seller-deskripsi" className={labelClass}>
              Store Description <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="seller-deskripsi"
              name="deskripsi_toko"
              maxLength={500}
              rows={2}
              defaultValue={values.deskripsi_toko}
              placeholder="What do you sell?"
              className={inputClass}
            />
          </div>
        </div>

        {/* tahap 3: verifikasi n keamanan */}
        <div data-step="3" className={stepClass(3)}>
          <PhotoField
            id="seller-ktp"
            name="foto_ktp"
            label="ID Card Photo (KTP)"
            hint="Make sure your name, NIK, and photo are clearly visible."
          />
          <PhotoField
            id="seller-wajah"
            name="foto_wajah"
            label="Selfie with ID Card"
            hint="Hold your ID card next to your face so the Admin can match them."
          />
          <div>
            <label htmlFor="seller-password" className={labelClass}>Password</label>
            <PasswordInput
              id="seller-password"
              name="password"
              required
              minLength={6}
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seller-password2" className={labelClass}>Confirm Password</label>
            <PasswordInput
              id="seller-password2"
              name="konfirmasi_password"
              required
              minLength={6}
              placeholder="Type your password again"
              className={inputClass}
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            Your ID photos are used by the Admin to verify your store.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          {backButton}
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3.5 bg-(--biru) hover:bg-(--biruhover) text-white text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {submitText}
          </button>
        </div>

        <p className="pt-4 text-center text-sm text-neutral-400">
          {'Already have an account? '}
          <button
            type="button"
            onClick={onSwitch}
            className="text-neutral-900 font-medium hover:underline underline-offset-4 cursor-pointer"
          >
            Sign In here
          </button>
        </p>
      </form>
    </>
  );
}