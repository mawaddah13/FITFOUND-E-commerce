'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiLock } from 'react-icons/fi';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { Field, inputClass } from '@/components/ui';

const ACCOUNT_OPTIONS = [
  {
    value: 'active',
    label: 'Active',
    hint: 'Can sign in and use FITFOUND normally.',
    activeClass: 'border-emerald-600 bg-emerald-50 text-emerald-800',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    hint: 'Account closed, e.g. at the user’s request. Cannot sign in.',
    activeClass: 'border-neutral-700 bg-neutral-100 text-neutral-900',
  },
  {
    value: 'suspended',
    label: 'Suspended',
    hint: 'Blocked for breaking the rules. Cannot sign in; store products are hidden.',
    activeClass: 'border-red-600 bg-red-50 text-red-700',
  },
];

const VERIFY_OPTIONS = [
  { value: 'active', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

// tombol pilihan bentuk kartu buat status akun atau verif toko
function ChoiceGroup({ name, options, value, onChange, disabled = false }) {
  let gridClass = 'grid-cols-1 sm:grid-cols-3';
  if (disabled) {
    gridClass = 'grid-cols-1 sm:grid-cols-3 opacity-60 cursor-not-allowed';
  }

  return (
    <div className={`grid gap-2 ${gridClass}`}>
      {options.map(function buildOptionCard(optionItem) {
        const isSelected = value === optionItem.value;
        let boxClass = 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-400';
        if (isSelected) {
          if (optionItem.activeClass) {
            boxClass = optionItem.activeClass;
          } else {
            boxClass = 'border-neutral-950 bg-neutral-950 text-white';
          }
        }

        let labelCursorClass = 'cursor-pointer';
        if (disabled) {
          labelCursorClass = 'cursor-not-allowed';
        }

        // simpan pilihan pas kartu ini diklik
        function handleOptionChange() {
          onChange(optionItem.value);
        }

        let hintElement = null;
        if (optionItem.hint) {
          hintElement = (
            <span className="block mt-0.5 text-[11px] leading-snug opacity-90">
              {optionItem.hint}
            </span>
          );
        }

        return (
          <label
            key={optionItem.value}
            className={`block rounded-xl border px-3.5 py-2.5 transition ${boxClass} ${labelCursorClass}`}
          >
            <input
              type="radio"
              name={name}
              value={optionItem.value}
              checked={isSelected}
              onChange={handleOptionChange}
              disabled={disabled}
              className="sr-only"
            />
            <span className="block text-sm font-semibold">{optionItem.label}</span>
            {hintElement}
          </label>
        );
      })}
    </div>
  );
}

// form admin buat edit profil user, status akun (active/inactive/suspend), toko seller, n reset password
export default function AdminUserForm({ action, user, isSelf }) {
  const [statusAkun, setStatusAkun] = useState(user.status_akun);

  let initialVerification = 'pending';
  if (user.role === 'seller') {
    initialVerification = user.status;
  }
  const [verifikasi, setVerifikasi] = useState(initialVerification);

  const isSeller = user.role === 'seller';
  const accountChanged = statusAkun !== user.status_akun;

  let phoneDefault = '';
  if (user.no_hp) {
    phoneDefault = user.no_hp;
  }

  let addressDefault = '';
  if (user.alamat) {
    addressDefault = user.alamat;
  }

  let selfNoticeElement = null;
  if (isSelf) {
    selfNoticeElement = (
      <p className="text-xs rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2.5">
        This is your own account. You can’t deactivate it, so you never lock yourself out.
      </p>
    );
  }

  let selfHiddenStatusInput = null;
  if (isSelf) {
    selfHiddenStatusInput = <input type="hidden" name="status_akun" value={user.status_akun} />;
  }

  let nonActiveAccessSection = null;
  if (statusAkun !== 'active') {
    let boxToneClass = 'border-neutral-300 bg-neutral-50';
    if (statusAkun === 'suspended') {
      boxToneClass = 'border-red-200 bg-red-50/40';
    }

    let reasonLabel = 'Reason for deactivation';
    let reasonPlaceholder = 'e.g. Closed at the user’s request through customer support.';
    if (statusAkun === 'suspended') {
      reasonLabel = 'Reason for suspension';
      reasonPlaceholder = 'e.g. Posted abusive language in product reviews.';
    }

    let reasonDefaultValue = '';
    if (user.alasan_status) {
      reasonDefaultValue = user.alasan_status;
    }

    let signOutNotice = null;
    if (accountChanged) {
      signOutNotice = (
        <p className="text-[11px] text-neutral-950">
          Saving will sign this user out right away.
        </p>
      );
    }

    nonActiveAccessSection = (
      <div className={`space-y-4 rounded-xl border p-4 ${boxToneClass}`}>
        <Field
          label={reasonLabel}
          htmlFor="alasan_status"
          hint="The user sees this reason in a pop-up when they try to sign in."
        >
          <textarea
            id="alasan_status"
            name="alasan_status"
            rows={2}
            required
            minLength={5}
            maxLength={500}
            defaultValue={reasonDefaultValue}
            placeholder={reasonPlaceholder}
            className={inputClass}
          />
        </Field>
        {signOutNotice}
      </div>
    );
  }

  let sellerStoreSection = null;
  if (isSeller) {
    let storeNameDefault = '';
    if (user.nama_toko) {
      storeNameDefault = user.nama_toko;
    }

    sellerStoreSection = (
      <div className="space-y-5 rounded-xl border border-neutral-200 p-4">
        <Field label="Store Name" htmlFor="nama_toko">
          <input
            id="nama_toko"
            name="nama_toko"
            required
            minLength={3}
            maxLength={120}
            defaultValue={storeNameDefault}
            placeholder="e.g. Urban Thread"
            className={inputClass}
          />
        </Field>
        <div>
          <p className="block text-sm font-medium text-neutral-950 mb-1.5">Seller Verification</p>
          <ChoiceGroup
            name="status"
            options={VERIFY_OPTIONS}
            value={verifikasi}
            onChange={setVerifikasi}
          />
          <p className="text-[11px] text-neutral-950 mt-1.5">
            Only Approved sellers can open Seller Center and sell.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ActionForm action={action} className="space-y-8">
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
          Profile
        </h3>

        <Field label="Full Name" htmlFor="nama">
          <input
            id="nama"
            name="nama"
            required
            minLength={3}
            maxLength={100}
            defaultValue={user.nama}
            className={inputClass}
          />
        </Field>

        <div>
          <p className="block text-sm font-medium text-neutral-950 mb-1.5">Email</p>
          <div className="flex items-center gap-2 px-4 py-3 text-sm rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-950">
            <FiLock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{user.email}</span>
          </div>
          <p className="text-[11px] text-neutral-950 mt-1">
            Email is this user’s sign-in ID, so only the owner can change it from their own profile. If an admin could
            change it, the account (and its orders and saved addresses) could be handed to someone else without the
            owner knowing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Phone Number" htmlFor="no_hp" hint="Optional. 8–20 digits.">
            <input
              id="no_hp"
              name="no_hp"
              type="tel"
              maxLength={20}
              defaultValue={phoneDefault}
              placeholder="08xxxxxxxxxx"
              className={inputClass}
            />
          </Field>
          <Field label="Address" htmlFor="alamat" hint="Optional.">
            <input
              id="alamat"
              name="alamat"
              maxLength={500}
              defaultValue={addressDefault}
              placeholder="Street, city, postal code"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
          Access
        </h3>

        {selfNoticeElement}

        <div>
          <p className="block text-sm font-medium text-neutral-950 mb-1.5">Account Status</p>
          <ChoiceGroup
            name="status_akun"
            options={ACCOUNT_OPTIONS}
            value={statusAkun}
            onChange={setStatusAkun}
            disabled={isSelf}
          />
          {selfHiddenStatusInput}
          <p className="text-[11px] text-neutral-950 mt-1.5">
            Prefer Inactive or Suspended over deleting: the user’s order history and reviews stay intact, and the
            account can be restored later.
          </p>
        </div>

        {nonActiveAccessSection}
        {sellerStoreSection}
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
            Reset Password
          </h3>
          <p className="text-[11px] text-neutral-950 mt-1.5">
            For users who forgot their password. Leave empty to keep the current one. Nobody can see the old
            password, not even admins — it is stored as a one-way bcrypt hash.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="New Password" htmlFor="new_password" hint="6–72 characters.">
            <input
              id="new_password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              placeholder="Leave empty to keep"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm New Password" htmlFor="confirm_password">
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              placeholder="Type it again"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-100">
        <SubmitButton variant="dark" className="mt-4">
          Save Changes
        </SubmitButton>
        <Link
          href="/admin/users"
          className="mt-4 px-5 py-3 text-sm font-medium rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-950 transition"
        >
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}