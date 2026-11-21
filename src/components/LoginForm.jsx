'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertOctagon, FiSlash } from 'react-icons/fi';
import { loginAction } from '@/app/action/auth';
import { formatDate } from '@/lib/format';

const inputClass =
  'w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-(--biru) hover:border-neutral-300 text-neutral-900 placeholder:text-neutral-400';

// susun label jumlah satuan jam atau hari yang tersisa
function formatUnitLabel(value, singular, plural) {
  if (value > 1) {
    return `${value} ${plural} left`;
  }
  return `${value} ${singular} left`;
}

// hitung sisa waktu suspend
function timeLeft(until) {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) {
    return 'ending now';
  }
  const hours = Math.ceil(diff / (60 * 60 * 1000));
  if (hours < 24) {
    return formatUnitLabel(hours, 'hour', 'hours');
  }
  const days = Math.ceil(hours / 24);
  return formatUnitLabel(days, 'day', 'days');
}

// pop up klo akun disuspen/nonaktif
function BlockedDialog({ blocked, onClose }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const isSuspended = blocked.type === 'suspended';

  let periodInfo = <p>This account stays closed until customer support reactivates it.</p>;
  if (isSuspended && blocked.until) {
    periodInfo = (
      <p>
        <span className="font-semibold">Suspended until:</span> {formatDate(blocked.until)}{' '}
        <span className="text-red-600">({timeLeft(blocked.until)})</span>
      </p>
    );
  } else if (isSuspended) {
    periodInfo = (
      <p>
        <span className="font-semibold">Suspended until:</span> an admin lifts the suspension
      </p>
    );
  }

  let badgeClass =
    'w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-neutral-100 text-neutral-950';
  let badgeIcon = <FiSlash className="w-6 h-6" />;
  let dialogTitle = 'Your account is inactive';
  if (isSuspended) {
    badgeClass =
      'w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-600';
    badgeIcon = <FiAlertOctagon className="w-6 h-6" />;
    dialogTitle = 'Your account is suspended';
  }

  let reasonText = 'No reason was given.';
  if (blocked.reason) {
    reasonText = blocked.reason;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="blocked-title"
        className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-xl animate-fade-up"
      >
        <div className={badgeClass}>{badgeIcon}</div>
        <h2 id="blocked-title" className="text-lg font-semibold text-neutral-950">
          {dialogTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-950">
          You can’t sign in right now. Your order history is kept safe.
        </p>

        <div className="mt-4 rounded-xl bg-(--abumuda) p-4 space-y-2 text-sm text-neutral-950">
          <p>
            <span className="font-semibold">Reason:</span> {reasonText}
          </p>
          {periodInfo}
        </div>

        <p className="mt-4 text-xs text-neutral-950">
          Think this is a mistake? Please contact FITFOUND customer support.
        </p>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-5 w-full py-3 text-sm font-medium text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition cursor-pointer"
        >
          I Understand
        </button>
      </div>
    </div>,
    document.body
  );
}

// tampilkan form login beserta pesan error, notifikasi, dan pop-up status akun
export default function LoginForm({ nextPath = '', notice = '', onSwitch }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [closedState, setClosedState] = useState(null);

  let blockedInfo = null;
  if (state && state.blocked && closedState !== state) {
    blockedInfo = state.blocked;
  }

  let buttonText = 'Login';
  if (isPending) {
    buttonText = 'Signing in...';
  }

  let errorBox = null;
  if (!state && notice) {
    errorBox = (
      <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center animate-fade-up">
        {notice}
      </div>
    );
  }
  if (state && state.error) {
    errorBox = (
      <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center animate-fade-up">
        {state.error}
      </div>
    );
  }

  let defaultEmail = '';
  if (state && state.email) {
    defaultEmail = state.email;
  }

  let blockedModal = null;
  if (blockedInfo) {
    blockedModal = <BlockedDialog blocked={blockedInfo} onClose={handleCloseBlocked} />;
  }

  function handleCloseBlocked() {
    setClosedState(state);
  }

  return (
    <>
      {errorBox}
      {blockedModal}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            required
            defaultValue={defaultEmail}
            placeholder="email@gmail.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            required
            placeholder="Your password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 mt-2 bg-(--biru) hover:bg-(--biruhover) hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(67,83,255,0.7)] text-white text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
        >
          {buttonText}
        </button>

        <p className="pt-4 text-center text-sm text-neutral-400">
          {"Don't have an account? "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-neutral-900 font-medium hover:underline underline-offset-4 cursor-pointer"
          >
            Sign Up here
          </button>
        </p>
      </form>
    </>
  );
}