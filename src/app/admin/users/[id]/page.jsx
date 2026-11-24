import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdminPage, liftExpiredSuspensions } from '@/lib/auth';
import { updateUserAction } from '@/app/action/admin';
import { toPositiveInt } from '@/lib/validation';
import AdminUserForm from '@/components/AdminUserForm';
import { PageHeader, Card, UserStatusBadge, AccountStatusBadge } from '@/components/ui';
import { formatDate, ROLE_LABELS } from '@/lib/format';

// tampilkan pesan pas data pengguna tidak ditemukan atau tidak valid
function UserMissing() {
  return (
    <div>
      <PageHeader title="Edit User" />
      <Card>
        <p className="text-sm text-neutral-950">
          This user does not exist or has been deleted.
        </p>
        <Link
          href="/admin/users"
          className="mt-3 inline-block text-xs font-medium text-neutral-950 underline underline-offset-4"
        >
          Back to User Management
        </Link>
      </Card>
    </div>
  );
}

// cek id pengguna trs ambil detail akun n formulir edit untuk admin
export default async function AdminEditUserPage({ params }) {
  const admin = await requireAdminPage();
  const resolvedParams = await params;
  const targetUserId = toPositiveInt(resolvedParams.id);

  if (!targetUserId) {
    return <UserMissing />;
  }

  await liftExpiredSuspensions();

  const resUser = await pool.query(
    `SELECT u.id_user, u.nama, u.email, u.no_hp, u.alamat, u.role, u.status, u.status_akun,
            u.alasan_status, u.suspend_sampai, u.created_at,
            s.id_store, s.nama_toko, s.deskripsi_toko,
            (SELECT COUNT(*) FROM orders o WHERE o.id_user = u.id_user)::int AS total_orders
     FROM users u
     LEFT JOIN stores s ON s.id_user = u.id_user
     WHERE u.id_user = $1`,
    [targetUserId]
  );
  if (resUser.rows.length === 0) {
    return <UserMissing />;
  }

  const rawUser = resUser.rows[0];
  let suspendUntilIso = null;
  if (rawUser.suspend_sampai) {
    suspendUntilIso = new Date(rawUser.suspend_sampai).toISOString();
  }

  const userRecord = {
    id_user: rawUser.id_user,
    nama: rawUser.nama,
    email: rawUser.email,
    no_hp: rawUser.no_hp,
    alamat: rawUser.alamat,
    role: rawUser.role,
    status: rawUser.status,
    status_akun: rawUser.status_akun,
    alasan_status: rawUser.alasan_status,
    suspend_sampai: suspendUntilIso,
    created_at: rawUser.created_at,
    id_store: rawUser.id_store,
    nama_toko: rawUser.nama_toko,
    deskripsi_toko: rawUser.deskripsi_toko,
    total_orders: rawUser.total_orders,
  };

  let isSelf = false;
  if (userRecord.id_user === admin.id_user) {
    isSelf = true;
  }

  let selfBadgeElement = null;
  if (isSelf) {
    selfBadgeElement = <span className="text-[11px] text-(--biru)">(you)</span>;
  }

  let suspendUntilRowElement = null;
  if (userRecord.status_akun === 'suspended') {
    let suspendUntilDisplay = 'Admin lifts it';
    if (userRecord.suspend_sampai) {
      suspendUntilDisplay = formatDate(userRecord.suspend_sampai);
    }

    suspendUntilRowElement = (
      <div className="flex justify-between gap-3">
        <dt>Until</dt>
        <dd className="text-right">{suspendUntilDisplay}</dd>
      </div>
    );
  }

  let reasonRowElement = null;
  if (userRecord.status_akun !== 'active' && userRecord.alasan_status) {
    reasonRowElement = (
      <div>
        <dt>Reason</dt>
        <dd className="mt-1 text-xs rounded-lg bg-(--abumuda) px-3 py-2">
          {userRecord.alasan_status}
        </dd>
      </div>
    );
  }

  let verificationRowElement = null;
  if (userRecord.role === 'seller') {
    verificationRowElement = (
      <div className="flex justify-between gap-3">
        <dt>Verification</dt>
        <dd>
          <UserStatusBadge status={userRecord.status} />
        </dd>
      </div>
    );
  }

  let storeRowElement = null;
  if (userRecord.nama_toko) {
    storeRowElement = (
      <div className="flex justify-between gap-3">
        <dt>Store</dt>
        <dd className="font-medium text-right truncate">{userRecord.nama_toko}</dd>
      </div>
    );
  }

  const boundUpdateUserAction = updateUserAction.bind(null, userRecord.id_user);

  return (
    <div>
      <PageHeader
        title="Edit User"
        description="Admin can edit every detail of this account: name, email, phone, address, store, access, and password."
        action={
          <Link
            href="/admin/users"
            className="text-xs font-medium text-neutral-950 underline underline-offset-4 hover:text-black"
          >
            Back to User Management
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
        <Card>
          <AdminUserForm
            action={boundUpdateUserAction}
            user={userRecord}
            isSelf={isSelf}
          />
        </Card>

        <Card className="xl:sticky xl:top-24">
          <h3 className="text-sm font-semibold text-neutral-950 mb-4">
            Current Account
          </h3>
          <dl className="space-y-3 text-sm text-neutral-950">
            <div className="flex justify-between gap-3">
              <dt>Role</dt>
              <dd className="font-medium">
                {ROLE_LABELS[userRecord.role]} {selfBadgeElement}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Account</dt>
              <dd>
                <AccountStatusBadge status={userRecord.status_akun} />
              </dd>
            </div>
            {suspendUntilRowElement}
            {reasonRowElement}
            {verificationRowElement}
            {storeRowElement}
            <div className="flex justify-between gap-3">
              <dt>Orders placed</dt>
              <dd>{userRecord.total_orders}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Joined</dt>
              <dd className="text-right">{formatDate(userRecord.created_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}