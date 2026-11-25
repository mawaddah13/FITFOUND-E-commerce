import Link from 'next/link';
import { ORDER_STATUS, USER_STATUS, ACCOUNT_STATUS } from '@/lib/format';
import FieldError from '@/components/FieldError';

export const inputClass =
  'w-full px-4 py-3 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-(--biru) text-neutral-950 placeholder:text-neutral-400';

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-neutral-950">{title}</h2>
        {description && <p className="text-sm text-neutral-950 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-neutral-200/80 p-5 md:p-6 ${className}`}>{children}</div>
  );
}

// kolom form + label + pesan error merah tetap di bawahnya (kalau isiannya salah)
export function Field({ label, htmlFor, hint, children }) {
  return (
    <div data-field-slot={htmlFor}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-950 mb-1.5">
        {label}
      </label>
      {children}
      <FieldError name={htmlFor} />
      {hint && <p className="text-[11px] text-neutral-950 mt-1">{hint}</p>}
    </div>
  );
}

export function OrderStatusBadge({ status }) {
  let info = ORDER_STATUS[status];
  if (!info) {
    info = { label: status, className: 'bg-neutral-50 text-neutral-600 border-neutral-200' };
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${info.className}`}>
      {info.label}
    </span>
  );
}

export function UserStatusBadge({ status }) {
  let info = USER_STATUS[status];
  if (!info) {
    info = USER_STATUS.active;
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${info.className}`}>
      {info.label}
    </span>
  );
}

export function AccountStatusBadge({ status }) {
  let info = ACCOUNT_STATUS[status];
  if (!info) {
    info = ACCOUNT_STATUS.active;
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${info.className}`}>
      {info.label}
    </span>
  );
}


export function StatCard({ label, value, href }) {
  const content = (
    <>
      <p className="text-xs text-neutral-950">{label}</p>
      <p className="text-2xl font-bold text-neutral-950 mt-1">{value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="block bg-white rounded-2xl border border-neutral-200/80 p-5 hover:border-neutral-400 hover-lift">
        {content}
      </Link>
    );
  }
  return <div className="bg-white rounded-2xl border border-neutral-200/80 p-5">{content}</div>;
}

export function EmptyState({ message, actionHref, actionLabel }) {
  return (
    <div className="py-14 px-6 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
      <p className="text-sm text-neutral-950">{message}</p>
      {actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-4 px-5 py-2.5 text-sm font-medium bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Notice({ children, type = 'success' }) {
  let className = 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (type === 'info') {
    className = 'bg-blue-50 border-blue-200 text-blue-700';
  }
  return <div className={`mb-5 p-3.5 rounded-xl border text-sm ${className}`}>{children}</div>;
}