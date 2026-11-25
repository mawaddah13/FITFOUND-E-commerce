import { redirect } from 'next/navigation';
import { FiMail, FiMessageCircle } from 'react-icons/fi';
import pool from '@/lib/db';
import { getCurrentUser, getStoreByUserId } from '@/lib/auth';
import { deleteRejectedAccountAction, continueAsSellerAction } from '@/app/action/auth';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';
import { SUPPORT_CONTACT } from '@/data/contact';

// cek status verif akun penjual trs tampilkan halaman tunggu, penolakan, atau pop up disetujui
export default async function PendingSellerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'seller') {
    redirect('/');
  }

  const store = await getStoreByUserId(user.id_user);

  // sudah disetujui n pop up-nya sudah pernah dilihat: langsung ke seller center
  const isApproved = user.status === 'active';
  if (isApproved && (!store || store.persetujuan_dilihat !== false)) {
    redirect('/seller/dashboard');
  }

  // baru disetujui admin: tampilkan pop up dulu sebelum masuk seller center
  if (isApproved) {
    return (
      <div className="min-h-screen bg-(--abumuda) flex items-center justify-center p-6">
        <div className="fixed inset-0 bg-black/40 animate-fade-in" aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approved-title"
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-8 md:p-10 text-center animate-pop-in"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
            🎉
          </div>
          <h1 id="approved-title" className="mt-5 text-2xl font-semibold text-neutral-950">
            Your store has been approved!
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Congratulations, &quot;{store.nama_toko}&quot; is now verified by the Admin. You can start
            adding products and receiving orders.
          </p>
          <ActionForm action={continueAsSellerAction} className="mt-6">
            <SubmitButton pendingText="Opening Seller Center..." className="w-full">
              Continue as Seller
            </SubmitButton>
          </ActionForm>
        </div>
      </div>
    );
  }

  const isRejected = user.status === 'rejected';

  let storeLabelForRejected = '';
  let storeLabelForPending = '';
  if (store) {
    storeLabelForRejected = ` for "${store.nama_toko}"`;
    storeLabelForPending = ` with "${store.nama_toko}"`;
  }

  let badgeToneClass = 'bg-amber-50 text-amber-600';
  let badgeIcon = '⏳';
  if (isRejected) {
    badgeToneClass = 'bg-red-50 text-red-600';
    badgeIcon = '✕';
  }

  let statusSectionContent = null;
  if (isRejected) {
    // alasan penolakan dari admin
    const reasonResult = await pool.query('SELECT alasan_tolak FROM users WHERE id_user = $1', [user.id_user]);
    let rejectReason = 'No reason was given by the Admin.';
    if (reasonResult.rows[0] && reasonResult.rows[0].alasan_tolak) {
      rejectReason = reasonResult.rows[0].alasan_tolak;
    }

    statusSectionContent = (
      <>
        <h1 className="mt-5 text-2xl font-semibold text-neutral-950">Registration Rejected</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sorry, your Seller registration{storeLabelForRejected} has been rejected by the Admin.
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Reason</p>
          <p className="mt-1 text-sm text-red-700">{rejectReason}</p>
        </div>

        {/* kontak admin buat tanya / banding di luar aplikasi */}
        <div className="mt-4 p-4 rounded-2xl bg-(--abumuda) text-left">
          <p className="text-sm font-semibold text-neutral-950">Need help or want to appeal?</p>
          <p className="mt-1 text-xs text-neutral-600">Contact the FITFOUND Admin team:</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <a
              href={`mailto:${SUPPORT_CONTACT.email}?subject=${encodeURIComponent('Seller registration appeal')}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-900 hover:border-neutral-900 transition"
            >
              <FiMail className="w-4 h-4" aria-hidden="true" />
              {SUPPORT_CONTACT.email}
            </a>
            <a
              href={`https://wa.me/${SUPPORT_CONTACT.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-900 hover:border-neutral-900 transition"
            >
              <FiMessageCircle className="w-4 h-4" aria-hidden="true" />
              {SUPPORT_CONTACT.whatsappLabel}
            </a>
          </div>
        </div>

        <p className="mt-5 text-xs text-neutral-600">
          You can also delete this account and register again with the correct data.
        </p>
        <ActionForm
          action={deleteRejectedAccountAction}
          confirmMessage="Delete your account permanently?"
          confirmDescription="This cannot be undone. Your account and store data will be removed."
          confirmLabel="Delete Account"
          className="mt-3"
        >
          <SubmitButton variant="danger" pendingText="Deleting..." className="w-full">
            Delete Account
          </SubmitButton>
        </ActionForm>
      </>
    );
  } else {
    statusSectionContent = (
      <>
        <h1 className="mt-5 text-2xl font-semibold text-neutral-950">
          Your account is under review.
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Thank you for registering as a Seller{storeLabelForPending}. The Admin will verify
          your account soon. Please check again later.
        </p>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-(--abumuda) flex flex-col items-center justify-center gap-8 p-6">
      <Logo href="/seller/pending" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 md:p-10 text-center animate-pop-in">
        <div
          className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl ${badgeToneClass}`}
        >
          {badgeIcon}
        </div>

        {statusSectionContent}

        <div className="mt-5">
          <LogoutButton className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-4 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}