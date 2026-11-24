'use client';

import { useState, useActionState } from 'react';
import { registerAction } from '@/app/action/auth';
import PasswordInput from '@/components/PasswordInput';

const inputClass =
  'w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-(--biru) hover:border-neutral-300 text-neutral-900 placeholder:text-neutral-400';

export default function RegisterForm({ onSwitch }) {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  let initialRole = 'buyer';
  if (state && state.values && state.values.role) {
    initialRole = state.values.role;
  }

  const [role, setRole] = useState(initialRole);

  let buttonText = 'Create Account';
  if (isPending) {
    buttonText = 'Creating account...';
  }

  let errorBox = null;
  if (state && state.error) {
    errorBox = (
      <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center animate-fade-up">
        {state.error}
      </div>
    );
  }

  const isSeller = role === 'seller';

  let indicatorClass =
    'absolute top-1 bottom-1 left-1 w-[calc(50%-0.375rem)] rounded-lg bg-neutral-900 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0';
  if (isSeller) {
    indicatorClass =
      'absolute top-1 bottom-1 left-1 w-[calc(50%-0.375rem)] rounded-lg bg-neutral-900 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-[calc(100%+0.25rem)]';
  }

  let buyerBtnClass =
    'relative z-10 py-2.5 text-xs font-medium rounded-lg transition-colors duration-300 cursor-pointer text-white';
  if (isSeller) {
    buyerBtnClass =
      'relative z-10 py-2.5 text-xs font-medium rounded-lg transition-colors duration-300 cursor-pointer text-neutral-600 hover:text-neutral-950';
  }

  let sellerBtnClass =
    'relative z-10 py-2.5 text-xs font-medium rounded-lg transition-colors duration-300 cursor-pointer text-neutral-600 hover:text-neutral-950';
  if (isSeller) {
    sellerBtnClass =
      'relative z-10 py-2.5 text-xs font-medium rounded-lg transition-colors duration-300 cursor-pointer text-white';
  }

  let roleHint = 'Buyer accounts are for shopping and cannot be changed into Seller accounts later.';
  if (isSeller) {
    roleHint =
      'Seller accounts need Admin approval. Before selling, add your phone number and address in Store Profile.';
  }

  let storeFieldWrapperClass =
    'grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] grid-rows-[0fr] opacity-0 -mt-4';
  let storeTabIndex = -1;
  if (isSeller) {
    storeFieldWrapperClass =
      'grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] grid-rows-[1fr] opacity-100';
    storeTabIndex = 0;
  }

  let defaultNama = '';
  let defaultToko = '';
  let defaultEmail = '';
  if (state && state.values) {
    if (state.values.nama) {
      defaultNama = state.values.nama;
    }
    if (state.values.nama_toko) {
      defaultToko = state.values.nama_toko;
    }
    if (state.values.email) {
      defaultEmail = state.values.email;
    }
  }

  function handleSelectBuyer() {
    setRole('buyer');
  }

  function handleSelectSeller() {
    setRole('seller');
  }

  return (
    <>
      {errorBox}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="role" value={role} />

        <div>
          <p className="block text-sm font-medium text-neutral-800 mb-2">Register as</p>
          <div className="relative grid grid-cols-2 gap-1 p-1 rounded-xl border border-neutral-200">
            <span aria-hidden="true" className={indicatorClass} />
            <button
              type="button"
              onClick={handleSelectBuyer}
              aria-pressed={!isSeller}
              className={buyerBtnClass}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={handleSelectSeller}
              aria-pressed={isSeller}
              className={sellerBtnClass}
            >
              Seller
            </button>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">{roleHint}</p>
        </div>

        <div>
          <label htmlFor="reg-nama" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Full Name
          </label>
          <input
            id="reg-nama"
            type="text"
            name="nama"
            required
            defaultValue={defaultNama}
            placeholder="Your full name"
            className={inputClass}
          />
        </div>

        <div className={storeFieldWrapperClass}>
          <div className="overflow-hidden">
            <label htmlFor="reg-toko" className="block text-sm font-medium text-neutral-800 mb-1.5">
              Store Name
            </label>
            <input
              id="reg-toko"
              type="text"
              name="nama_toko"
              required={isSeller}
              disabled={!isSeller}
              tabIndex={storeTabIndex}
              defaultValue={defaultToko}
              placeholder="Your fashion store name"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            name="email"
            required
            defaultValue={defaultEmail}
            placeholder="email@gmail.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-neutral-800 mb-1.5">
            Password
          </label>
          <PasswordInput
            id="reg-password"
            name="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
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