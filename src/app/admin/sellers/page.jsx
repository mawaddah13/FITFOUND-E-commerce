import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import { approveSellerAction, rejectSellerAction } from '@/app/action/admin';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, EmptyState, UserStatusBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';

const TABS = ['pending', 'active', 'rejected'];
const TAB_LABEL = { pending: 'Pending', active: 'Approved', rejected: 'Rejected' };

// cek pilihan status trs tampilkan daftar akun seller buat disetujui atau ditolak
export default async function SellerVerificationPage({ searchParams }) {
  await requireAdminPage();
  const resolvedSearchParams = await searchParams;

  let activeTab = 'pending';
  if (resolvedSearchParams && typeof resolvedSearchParams.tab === 'string') {
    activeTab = resolvedSearchParams.tab;
  }
  if (!TABS.includes(activeTab)) {
    activeTab = 'pending';
  }

  // ambil data akun seller jg info tokonya sesuai status yg dipilih
  const resSellers = await pool.query(
    `SELECT u.id_user, u.nama, u.email, u.no_hp, u.status, u.created_at, s.nama_toko, s.deskripsi_toko
     FROM users u
     LEFT JOIN stores s ON s.id_user = u.id_user
     WHERE u.role = 'seller' AND u.status = $1
     ORDER BY u.created_at ASC`,
    [activeTab]
  );
  const sellers = resSellers.rows;

  let sellersListContent = null;
  if (sellers.length === 0) {
    const emptyMessageText = `No ${TAB_LABEL[activeTab].toLowerCase()} sellers.`;
    sellersListContent = <EmptyState message={emptyMessageText} />;
  } else {
    sellersListContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sellers.map(function buildSellerCard(sellerItem) {
          let storeTitleText = '(no store name)';
          if (sellerItem.nama_toko) {
            storeTitleText = sellerItem.nama_toko;
          }

          let phoneText = '-';
          if (sellerItem.no_hp) {
            phoneText = sellerItem.no_hp;
          }

          let storeDescriptionElement = null;
          if (sellerItem.deskripsi_toko) {
            storeDescriptionElement = (
              <p className="text-sm text-neutral-600 mt-3">
                {sellerItem.deskripsi_toko}
              </p>
            );
          }

          let approveActionElement = null;
          if (sellerItem.status !== 'active') {
            const boundApproveAction = approveSellerAction.bind(null, sellerItem.id_user);
            approveActionElement = (
              <ActionForm action={boundApproveAction} className="flex-1">
                <SubmitButton
                  variant="success"
                  size="sm"
                  pendingText="Approving..."
                  className="w-full"
                >
                  Approve
                </SubmitButton>
              </ActionForm>
            );
          }

          let rejectActionElement = null;
          if (sellerItem.status !== 'rejected') {
            const boundRejectAction = rejectSellerAction.bind(null, sellerItem.id_user);
            const targetLabel = sellerItem.nama_toko || sellerItem.nama;
            const rejectPromptText = `Reject ${targetLabel}?`;

            rejectActionElement = (
              <ActionForm
                action={boundRejectAction}
                confirmMessage={rejectPromptText}
                confirmDescription="The seller will see the rejection and can delete their account."
                confirmLabel="Reject"
                className="flex-1"
              >
                <SubmitButton
                  variant="dangerOutline"
                  size="sm"
                  pendingText="Rejecting..."
                  className="w-full"
                >
                  Reject
                </SubmitButton>
              </ActionForm>
            );
          }

          return (
            <div
              key={sellerItem.id_user}
              className="bg-white rounded-2xl border border-neutral-200/80 p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{storeTitleText}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Owner: {sellerItem.nama} · {sellerItem.email}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Phone: {phoneText} · Registered {formatDate(sellerItem.created_at)}
                  </p>
                </div>
                <UserStatusBadge status={sellerItem.status} />
              </div>
              {storeDescriptionElement}

              <div className="mt-auto pt-4 flex gap-2">
                {approveActionElement}
                {rejectActionElement}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Seller Verification"
        description="Approve or reject new Seller registrations."
      />

      <div className="flex gap-2 mb-4">
        {TABS.map(function buildSellerTabLink(tabKey) {
          let tabClass =
            'px-4 py-2 text-xs font-medium rounded-full border transition bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400';
          if (activeTab === tabKey) {
            tabClass =
              'px-4 py-2 text-xs font-medium rounded-full border transition bg-neutral-900 text-white border-neutral-900';
          }

          return (
            <Link key={tabKey} href={`/admin/sellers?tab=${tabKey}`} className={tabClass}>
              {TAB_LABEL[tabKey]}
            </Link>
          );
        })}
      </div>

      {sellersListContent}
    </div>
  );
}