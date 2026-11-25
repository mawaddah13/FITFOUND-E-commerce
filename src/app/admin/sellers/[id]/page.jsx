import Link from 'next/link';
import { FiArrowLeft, FiUser, FiShoppingBag, FiShield } from 'react-icons/fi';
import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import { approveSellerAction, rejectSellerAction } from '@/app/action/admin';
import { toPositiveInt } from '@/lib/validation';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import RejectSellerForm from '@/components/RejectSellerForm';
import PhotoLightbox from '@/components/PhotoLightbox';
import { Card, UserStatusBadge, AccountStatusBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';

// link kembali polos (tanpa background), ukuran kecil
const backLinkClass =
  'inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:underline underline-offset-4 transition';

// satu baris info: label di kiri, isinya di kanan
function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-neutral-100 last:border-b-0">
      <dt className="sm:w-36 shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-950 break-words">{children}</dd>
    </div>
  );
}

// judul tiap kotak (data pribadi, data toko, dokumen)
function SectionTitle({ icon: SectionIcon, title }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-950 mb-2">
      <SectionIcon className="w-5 h-5" aria-hidden="true" />
      {title}
    </h3>
  );
}

// foto ktp / selfie ukuran besar, klik buat lihat lebih besar (ada tombol X buat kembali)
function VerificationPhoto({ label, photoPath, ownerName }) {
  let photoElement = (
    <div className="aspect-[4/3] rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-sm text-neutral-500">
      No photo uploaded
    </div>
  );
  if (photoPath) {
    photoElement = (
      <PhotoLightbox
        src={photoPath}
        alt={`${label} of ${ownerName}`}
        caption="Click to view larger"
        className="w-full aspect-[4/3] object-contain bg-neutral-100 rounded-xl border border-neutral-200 group-hover:opacity-90 transition"
      />
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-neutral-800 mb-2">{label}</p>
      {photoElement}
    </div>
  );
}

// halaman detail seller (cuma lihat), dipisah: data pribadi, data toko, dokumen verifikasi
export default async function AdminSellerDetailPage({ params }) {
  await requireAdminPage();
  const resolvedParams = await params;
  const sellerId = toPositiveInt(resolvedParams.id);

  let seller = null;
  if (sellerId) {
    const resSeller = await pool.query(
      `SELECT u.id_user, u.nama, u.email, u.no_hp, u.alamat, u.status, u.status_akun, u.alasan_tolak, u.created_at,
              s.id_store, s.nama_toko, s.deskripsi_toko, s.gambar_toko, s.foto_ktp, s.foto_wajah,
              (SELECT COUNT(*) FROM products p WHERE p.id_store = s.id_store)::int AS total_products,
              (SELECT COUNT(*) FROM orders o WHERE o.id_store = s.id_store AND o.status_order = 'completed')::int AS completed_orders
       FROM users u
       LEFT JOIN stores s ON s.id_user = u.id_user
       WHERE u.id_user = $1 AND u.role = 'seller'`,
      [sellerId]
    );
    seller = resSeller.rows[0] || null;
  }

  if (!seller) {
    return (
      <div>
        <Link href="/admin/sellers" className={backLinkClass}>
          <FiArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to Seller Verification
        </Link>
        <Card className="mt-6">
          <p className="text-sm text-neutral-950">This seller does not exist or has been deleted.</p>
        </Card>
      </div>
    );
  }

  const storeName = seller.nama_toko || '(no store name)';

  let storeImageElement = (
    <span className="w-14 h-14 shrink-0 rounded-xl bg-neutral-900 text-white text-xl font-semibold flex items-center justify-center">
      {storeName.charAt(0).toUpperCase()}
    </span>
  );
  if (seller.gambar_toko) {
    storeImageElement = (
      <img
        src={seller.gambar_toko}
        alt={storeName}
        className="w-14 h-14 shrink-0 rounded-xl object-cover border border-neutral-200"
      />
    );
  }

  let rejectReasonElement = null;
  if (seller.status === 'rejected') {
    rejectReasonElement = (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Rejection Reason</p>
        <p className="mt-1 text-sm text-red-700">{seller.alasan_tolak || 'No reason given.'}</p>
      </div>
    );
  }

  // approve / reject cuma buat seller yg masih pending
  let sellerActionsElement = null;
  if (seller.status === 'pending') {
    const boundApproveAction = approveSellerAction.bind(null, seller.id_user);
    const boundRejectAction = rejectSellerAction.bind(null, seller.id_user);
    sellerActionsElement = (
      <div className="flex flex-wrap gap-3">
        <ActionForm
          action={boundApproveAction}
          messageAsToast
          confirmMessage={`Approve ${storeName}?`}
          confirmDescription="This store will be able to sell products on FITFOUND."
          confirmLabel="Approve"
          confirmTone="neutral"
          className="flex-1"
        >
          <SubmitButton variant="success" pendingText="Approving..." className="w-full">
            Approve Seller
          </SubmitButton>
        </ActionForm>
        <RejectSellerForm action={boundRejectAction} storeLabel={storeName} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/sellers" className={backLinkClass}>
        <FiArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Back to Seller Verification
      </Link>

      {/* kepala halaman: logo toko, nama toko, pemilik, status */}
      <div className="flex flex-wrap items-center gap-4">
        {storeImageElement}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-950 break-words">{storeName}</h2>
          <p className="text-sm text-neutral-700">Owned by {seller.nama}</p>
        </div>
        <UserStatusBadge status={seller.status} />
      </div>

      {rejectReasonElement}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle icon={FiUser} title="Personal Info" />
          <dl>
            <InfoRow label="Full Name">{seller.nama}</InfoRow>
            <InfoRow label="Email">{seller.email}</InfoRow>
            <InfoRow label="Phone">{seller.no_hp || '-'}</InfoRow>
            <InfoRow label="Account">
              <AccountStatusBadge status={seller.status_akun} />
            </InfoRow>
            <InfoRow label="Registered">{formatDate(seller.created_at)}</InfoRow>
          </dl>
        </Card>

        <Card>
          <SectionTitle icon={FiShoppingBag} title="Store Info" />
          <dl>
            <InfoRow label="Store Name">{storeName}</InfoRow>
            <InfoRow label="Store Address">{seller.alamat || '-'}</InfoRow>
            <InfoRow label="Description">{seller.deskripsi_toko || '-'}</InfoRow>
            <InfoRow label="Products">{seller.total_products}</InfoRow>
            <InfoRow label="Completed Orders">{seller.completed_orders}</InfoRow>
          </dl>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={FiShield} title="Verification Documents" />
        <p className="text-xs text-neutral-600 mb-4">
          Compare the face and name on the ID card with the selfie before approving.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <VerificationPhoto label="ID Card (KTP)" photoPath={seller.foto_ktp} ownerName={seller.nama} />
          <VerificationPhoto label="Selfie with ID" photoPath={seller.foto_wajah} ownerName={seller.nama} />
        </div>
      </Card>

      {/* tombol approve / reject di bawah, cuma muncul kalau masih pending */}
      {sellerActionsElement}
    </div>
  );
}