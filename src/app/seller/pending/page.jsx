import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, getStoreByUserId } from '@/lib/auth';
import { deleteRejectedAccountAction } from '@/app/action/auth';
import { cancelSellerApplicationAction } from '@/app/action/account';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';

// cek status verif akun penjual trs tampilkan halaman tunggu atau penolakan
export default async function PendingSellerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'seller') {
    redirect('/');
  }
  if (user.status === 'active') {
    redirect('/seller/dashboard');
  }

  const store = await getStoreByUserId(user.id_user);
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
    statusSectionContent = (
      <>
        <h1 className="mt-5 text-2xl font-semibold text-neutral-950">Registration Rejected</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sorry, your Seller registration{storeLabelForRejected} has been rejected by the Admin.
          You can delete this account, or cancel the application and keep using your account for shopping.
        </p>
        <ActionForm
          action={deleteRejectedAccountAction}
          confirmMessage="Delete your account permanently?"
          confirmDescription="This cannot be undone. Your account and store data will be removed."
          confirmLabel="Delete Account"
          className="mt-6"
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
          your account soon. Meanwhile, you can keep shopping.
        </p>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-(--abumuda) flex flex-col items-center justify-center gap-8 p-6">
      <Logo href="/" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-100 shadow-sm p-8 md:p-10 text-center animate-pop-in">
        <div
          className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl ${badgeToneClass}`}
        >
          {badgeIcon}
        </div>

        {statusSectionContent}

        <Link
          href="/"
          className="mt-4 block w-full py-3 text-sm font-semibold text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-200"
        >
          Continue Shopping
        </Link>

        <ActionForm
          action={cancelSellerApplicationAction}
          confirmMessage="Cancel your seller application?"
          confirmDescription="Your store application will be removed and your account becomes a regular Buyer account."
          confirmLabel="Cancel Application"
          cancelLabel="Keep Application"
          className="mt-3"
        >
          <SubmitButton variant="outline" pendingText="Cancelling..." className="w-full">
            Cancel Seller Application
          </SubmitButton>
        </ActionForm>

        <div className="mt-5">
          <LogoutButton className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-4 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}