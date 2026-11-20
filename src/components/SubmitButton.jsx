'use client';

import { usePendingForm } from '@/components/ActionForm';

const VARIANTS = {
  primary: 'bg-(--biru) hover:bg-(--biruhover) text-white',
  dark: 'bg-neutral-950 hover:bg-neutral-800 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800',
  dangerOutline: 'bg-white border border-red-200 hover:bg-red-50 text-red-600',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
};

export default function SubmitButton({
  children,
  pendingText = 'Saving...',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}) {
  const isPending = usePendingForm();

  let sizeClass = 'px-5 py-3 text-sm';
  if (size === 'sm') {
    sizeClass = 'px-3 py-1.5 text-xs';
  }

  let buttonLabel = children;
  if (isPending) {
    buttonLabel = pendingText;
  }

  return (
    <button
      type="submit"
      disabled={isPending || disabled}
      className={`${VARIANTS[variant]} ${sizeClass} font-medium rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer ${className}`}
    >
      {buttonLabel}
    </button>
  );
}