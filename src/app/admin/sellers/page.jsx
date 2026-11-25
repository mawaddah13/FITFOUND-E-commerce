import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import { approveSellerAction, rejectSellerAction } from '@/app/action/admin';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import RejectSellerForm from '@/components/RejectSellerForm';
import PhotoLightbox from '@/components/PhotoLightbox';
import { PageHeader, EmptyState, UserStatusBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';

// tab All = semua seller (pending, approved, rejected)
const TABS = ['all', 'pending', 'active', 'rejected'];
const TAB_LABEL = { all: 'All', pending: 'Pending', active: 'Approved', rejected: 'Rejected' };

// cek pilihan status trs tampilkan daftar akun seller buat disetujui atau ditolak
export default async function SellerVerificationPage({ searchParams }) {
  await requireAdminPage();
  const resolvedSearchParams = await searchParams;

  let activeTab = 'all';
  if (resolvedSearchParams && typeof resolvedSearchParams.tab === 'string') {
    activeTab = resolvedSearchParams.tab;
  }
  if (!TABS.includes(activeTab)) {
    activeTab = 'all';
  }

  // ambil data akun seller jg info tokonya sesuai status yg dipilih
  const resSellers = await pool.query(
    `SELECT u.id_user, u.nama, u.email, u.no_hp, u.alamat, u.status, u.alasan_tolak, u.created_at,
            s.nama_toko, s.deskripsi_toko, s.foto_ktp, s.foto_wajah
     FROM users u
     LEFT JOIN stores s ON s.id_user = u.id_user
     WHERE u.role = 'seller' AND ($1 = 'all' OR u.status = $1)
     ORDER BY u.created_at ASC`,
    [activeTab]
  );
  const sellers = resSellers.rows;

  let sellersListContent = null;
  if (sellers.length === 0) {
    let emptyMessageText = `No ${TAB_LABEL[activeTab].toLowerCase()} sellers.`;
    if (activeTab === 'all') {
      emptyMessageText = 'No sellers yet.';
    }
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

          // approve / reject cuma buat seller yg masih pending
          // (yg sudah approved tidak bisa direject, yg rejected tidak bisa diapprove)
          let sellerActionsElement = null;
          if (sellerItem.status === 'pending') {
            const boundApproveAction = approveSellerAction.bind(null, sellerItem.id_user);
            const boundRejectAction = rejectSellerAction.bind(null, sellerItem.id_user);
            const targetLabel = sellerItem.nama_toko || sellerItem.nama;
            sellerActionsElement = (
              <div className="relative z-10 mt-auto pt-4 flex flex-wrap gap-2">
                <ActionForm
                  action={boundApproveAction}
                  messageAsToast
                  confirmMessage={`Approve ${targetLabel}?`}
                  confirmDescription="This store will be able to sell products on FITFOUND."
                  confirmLabel="Approve"
                  confirmTone="neutral"
                  className="flex-1"
                >
                  <SubmitButton
                    variant="success"
                    size="sm"
                    pendingText="Approving..."
                    className="w-full"
                  >
                    Approve
                  </SubmitButton>
                </ActionForm>
                <RejectSellerForm action={boundRejectAction} storeLabel={targetLabel} />
              </div>
            );
          }

          let addressText = '-';
          if (sellerItem.alamat) {
            addressText = sellerItem.alamat;
          }

          // foto ktp n selfie yg diupload seller waktu daftar
          const verificationPhotos = [
            { kind: 'ktp', label: 'ID Card (KTP)', fileName: sellerItem.foto_ktp },
            { kind: 'face', label: 'Selfie with ID', fileName: sellerItem.foto_wajah },
          ];
          const verificationElement = (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {verificationPhotos.map(function buildVerificationPhoto(photoItem) {
                if (!photoItem.fileName) {
                  return (
                    <div key={photoItem.kind}>
                      <p className="text-[11px] font-medium text-neutral-700 mb-1">{photoItem.label}</p>
                      <div className="aspect-[4/3] rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-[11px] text-neutral-500">
                        No photo
                      </div>
                    </div>
                  );
                }
                const photoUrl = photoItem.fileName;
                return (
                  <div key={photoItem.kind}>
                    <p className="text-[11px] font-medium text-neutral-700 mb-1">{photoItem.label}</p>
                    {/* foto dipencet = membesar, ada tombol X buat kembali */}
                    <div className="relative z-10">
                      <PhotoLightbox
                        src={photoUrl}
                        alt={`${photoItem.label} of ${sellerItem.nama}`}
                        className="w-full aspect-[4/3] object-cover rounded-xl border border-neutral-200 hover:opacity-80 transition"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );

          let rejectReasonElement = null;
          if (sellerItem.status === 'rejected') {
            rejectReasonElement = (
              <p className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <span className="font-semibold">Reason: </span>
                {sellerItem.alasan_tolak || 'No reason given.'}
              </p>
            );
          }

          return (
            <div
              key={sellerItem.id_user}
              className="relative bg-white rounded-2xl border border-neutral-200/80 p-5 flex flex-col hover:border-neutral-400 hover:shadow-md transition"
            >
              {/* seluruh kartu bisa dipencet buat lihat detail seller lebih jelas (bukan edit) */}
              <Link
                href={`/admin/sellers/${sellerItem.id_user}`}
                aria-label={`View details of ${storeTitleText}`}
                className="absolute inset-0 rounded-2xl"
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{storeTitleText}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Owner: {sellerItem.nama} · {sellerItem.email}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Phone: {phoneText} · Registered {formatDate(sellerItem.created_at)}
                  </p>
                  <p className="text-xs text-neutral-500">Address: {addressText}</p>
                </div>
                <UserStatusBadge status={sellerItem.status} />
              </div>
              {storeDescriptionElement}
              {verificationElement}
              {rejectReasonElement}

              {sellerActionsElement}
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