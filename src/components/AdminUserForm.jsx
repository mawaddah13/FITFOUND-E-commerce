'use client';

import { useState } from 'react';
import Link from 'next/link';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import PasswordInput from '@/components/PasswordInput';
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

// batas isian jam n menit (lama hari tidak dibatasi)
const MAX_SUSPEND_HOURS = 24;
const MAX_SUSPEND_MINUTES = 60;

// ubah angka isian jadi bilangan bulat, kosong = 0
function toWholeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.trunc(number);
}

// susun teks lama suspend, misal: 3 days 4 hours 30 minutes
function durationText(days, hours, minutes) {
  const parts = [];
  if (days > 0) {
    parts.push(`${days} day${days === 1 ? '' : 's'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  }
  return parts.join(' ');
}

// tampilkan tanggal n jam akhir suspend
function formatUntil(isoValue) {
  return new Date(isoValue).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
  const [suspendDays, setSuspendDays] = useState('1');
  const [suspendHours, setSuspendHours] = useState('0');
  const [suspendMinutes, setSuspendMinutes] = useState('0');

  // suspend yg masih berjalan dikunci: tidak bisa dicabut / diubah sebelum waktunya habis
  const isLocked = user.status_akun === 'suspended' && Boolean(user.suspend_sampai);

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
  if (isSelf || isLocked) {
    selfHiddenStatusInput = <input type="hidden" name="status_akun" value={user.status_akun} />;
  }

  // ubah isian lama suspend
  function handleDaysChange(changeEvent) {
    setSuspendDays(changeEvent.target.value);
  }

  function handleHoursChange(changeEvent) {
    setSuspendHours(changeEvent.target.value);
  }

  function handleMinutesChange(changeEvent) {
    setSuspendMinutes(changeEvent.target.value);
  }

  let suspendDurationSection = null;
  if (statusAkun === 'suspended' && !isLocked) {
    const summaryText = durationText(
      toWholeNumber(suspendDays),
      toWholeNumber(suspendHours),
      toWholeNumber(suspendMinutes)
    );

    let summaryElement = null;
    if (summaryText) {
      summaryElement = (
        <p className="text-[11px] text-neutral-950">
          Suspended for <span className="font-semibold">{summaryText}</span> from the moment you save. It
          can&apos;t be lifted early — the account opens again automatically when the time is up.
        </p>
      );
    }

    suspendDurationSection = (
      <div className="space-y-2">
        <p className="block text-sm font-medium text-neutral-950">Suspension length</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Days" htmlFor="suspend_hari" hint="Minimum 1.">
            <input
              id="suspend_hari"
              name="suspend_hari"
              type="number"
              required
              min={1}
              step={1}
              value={suspendDays}
              onChange={handleDaysChange}
              className={inputClass}
            />
          </Field>
          <Field label="Hours" htmlFor="suspend_jam" hint={`0–${MAX_SUSPEND_HOURS}`}>
            <input
              id="suspend_jam"
              name="suspend_jam"
              type="number"
              required
              min={0}
              max={MAX_SUSPEND_HOURS}
              step={1}
              value={suspendHours}
              onChange={handleHoursChange}
              className={inputClass}
            />
          </Field>
          <Field label="Minutes" htmlFor="suspend_menit" hint={`0–${MAX_SUSPEND_MINUTES}`}>
            <input
              id="suspend_menit"
              name="suspend_menit"
              type="number"
              required
              min={0}
              max={MAX_SUSPEND_MINUTES}
              step={1}
              value={suspendMinutes}
              onChange={handleMinutesChange}
              className={inputClass}
            />
          </Field>
        </div>
        {summaryElement}
      </div>
    );
  }

  let lockedSuspendSection = null;
  if (isLocked) {
    let lockedReasonElement = null;
    if (user.alasan_status) {
      lockedReasonElement = (
        <p className="text-xs text-red-700">
          <span className="font-semibold">Reason:</span> {user.alasan_status}
        </p>
      );
    }

    lockedSuspendSection = (
      <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50/40 p-4">
        <p className="text-sm font-semibold text-red-700">
          Suspended until {formatUntil(user.suspend_sampai)}
        </p>
        {lockedReasonElement}
        <p className="text-[11px] text-neutral-950">
          A suspension has a fixed end time, so it can&apos;t be lifted or changed early. The account opens
          again automatically when the time is up. You can still edit the profile and password below.
        </p>
      </div>
    );
  }

  let nonActiveAccessSection = null;
  if (statusAkun !== 'active' && !isLocked) {
    let boxToneClass = 'border-neutral-300 bg-neutral-50';
    if (statusAkun === 'suspended') {
      boxToneClass = 'border-red-200 bg-red-50/40';
    }

    let reasonLabel = 'Reason for deactivation';
    let reasonPlaceholder = 'e.g. Closed at the user’s request through customer support.';
    if (statusAkun === 'suspended') {
      reasonLabel = 'Reason for suspension';
      reasonPlaceholder = 'e.g. Violated platform terms of use.';
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
        {suspendDurationSection}
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

    let storeDescriptionDefault = '';
    if (user.deskripsi_toko) {
      storeDescriptionDefault = user.deskripsi_toko;
    }

    // pilihan verif cuma muncul kalau seller masih pending
    // kalau sudah di-approve / reject, cukup atur lewat Account Status di atas
    let verificationSection = <input type="hidden" name="status" value={user.status} />;
    if (user.status === 'pending') {
      verificationSection = (
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
      );
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
        <Field label="Store Description" htmlFor="deskripsi_toko" hint="Optional. Shown on the store page.">
          <textarea
            id="deskripsi_toko"
            name="deskripsi_toko"
            rows={3}
            maxLength={1000}
            defaultValue={storeDescriptionDefault}
            className={inputClass}
          />
        </Field>
        {verificationSection}
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

        <Field label="Email" htmlFor="email" hint="Used for signing in to FITFOUND.">
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={150}
            defaultValue={user.email}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Phone Number" htmlFor="no_hp" hint="8–20 digits.">
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
          <Field label="Address" htmlFor="alamat">
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
            disabled={isSelf || isLocked}
          />
          {selfHiddenStatusInput}
          <p className="text-[11px] text-neutral-950 mt-1.5">
            Prefer Inactive or Suspended over deleting: the user’s order history and reviews stay intact, and the
            account can be restored later.
          </p>
        </div>

        {lockedSuspendSection}
        {nonActiveAccessSection}
        {sellerStoreSection}
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
            Reset Password
          </h3>
          <p className="text-[11px] text-neutral-950 mt-1.5">
            For users who forgot their password. Leave empty to keep the current one
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="New Password" htmlFor="new_password" hint="6–72 characters.">
            <PasswordInput
              id="new_password"
              name="new_password"
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              placeholder="Leave empty to keep"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm New Password" htmlFor="confirm_password">
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
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