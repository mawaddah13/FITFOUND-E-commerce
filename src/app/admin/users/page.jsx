import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdminPage, liftExpiredSuspensions } from '@/lib/auth';
import { deleteUserAction } from '@/app/action/admin';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, UserStatusBadge, AccountStatusBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';

const ROLE_FILTERS = ['all', 'admin', 'seller', 'buyer'];

// cek filter peran n kata kunci trs tampilkan daftar pengguna untuk dikelola admin
export default async function AdminUsersPage({ searchParams }) {
  const admin = await requireAdminPage();
  const resolvedSearchParams = await searchParams;

  let selectedRole = 'all';
  if (resolvedSearchParams && typeof resolvedSearchParams.role === 'string') {
    selectedRole = resolvedSearchParams.role;
  }
  if (!ROLE_FILTERS.includes(selectedRole)) {
    selectedRole = 'all';
  }

  let keyword = '';
  if (resolvedSearchParams && typeof resolvedSearchParams.q === 'string') {
    keyword = resolvedSearchParams.q.trim();
  }

  let queryText = `
    SELECT u.id_user, u.nama, u.email, u.no_hp, u.role, u.status, u.status_akun, u.suspend_sampai, u.created_at, s.nama_toko,
           (SELECT COUNT(*) FROM orders o
            WHERE (o.id_store = s.id_store OR o.id_user = u.id_user)
              AND o.status_order IN ('pending', 'processing', 'shipped'))::int AS active_orders
    FROM users u
    LEFT JOIN stores s ON s.id_user = u.id_user
    WHERE 1 = 1`;
  const queryValues = [];

  if (selectedRole !== 'all') {
    queryValues.push(selectedRole);
    queryText += ` AND u.role = $${queryValues.length}`;
  }
  if (keyword !== '') {
    queryValues.push(`%${keyword}%`);
    queryText += ` AND (u.nama ILIKE $${queryValues.length} OR u.email ILIKE $${queryValues.length})`;
  }
  queryText += ' ORDER BY u.role ASC, u.created_at DESC';

  await liftExpiredSuspensions();
  const resUsers = await pool.query(queryText, queryValues);
  const users = resUsers.rows;

  let hiddenRoleInputElement = null;
  if (selectedRole !== 'all') {
    hiddenRoleInputElement = <input type="hidden" name="role" value={selectedRole} />;
  }

  let usersTableBody = null;
  if (users.length === 0) {
    usersTableBody = (
      <tr>
        <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
          No users found.
        </td>
      </tr>
    );
  } else {
    usersTableBody = users.map(function buildUserRow(userItem) {
      let isSelf = false;
      if (userItem.id_user === admin.id_user) {
        isSelf = true;
      }

      let selfLabelElement = null;
      if (isSelf) {
        selfLabelElement = <span className="text-[11px] text-(--biru)">(you)</span>;
      }

      let storeSuffixText = '';
      if (userItem.nama_toko) {
        storeSuffixText = ` · ${userItem.nama_toko}`;
      }

      let suspendInfoElement = null;
      if (userItem.status_akun === 'suspended') {
        let suspendUntilText = 'until lifted';
        if (userItem.suspend_sampai) {
          suspendUntilText = `until ${formatDate(userItem.suspend_sampai)}`;
        }
        suspendInfoElement = (
          <p className="mt-1 text-[10px] text-neutral-950 whitespace-nowrap">
            {suspendUntilText}
          </p>
        );
      }

      let verificationCellElement = (
        <span className="text-xs text-neutral-500">—</span>
      );
      if (userItem.role === 'seller') {
        verificationCellElement = <UserStatusBadge status={userItem.status} />;
      }

      let deleteFormElement = null;
      if (!isSelf) {
        const boundDeleteUserAction = deleteUserAction.bind(null, userItem.id_user);
        const deleteConfirmText = `Are you sure you want to delete ${userItem.nama}?`;

        // seller / buyer yg masih punya pesanan aktif: kasih tanda kuning, hapusnya nanti ditolak lewat toast
        let activeOrderBadge = null;
        if (userItem.active_orders > 0) {
          activeOrderBadge = (
            <span className="self-center whitespace-nowrap px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700">
              In {userItem.active_orders} active order(s)
            </span>
          );
        }

        deleteFormElement = (
          <>
          {activeOrderBadge}
          <ActionForm
            action={boundDeleteUserAction}
            messageAsToast
            confirmMessage={deleteConfirmText}
            confirmDescription="All of their data (store, products, orders, reviews) will be removed and cannot be restored. To only block access, edit the user and set the account to Suspended instead."
          >
            <SubmitButton size="sm" variant="dangerOutline" pendingText="...">
              Delete
            </SubmitButton>
          </ActionForm>
          </>
        );
      }

      return (
        <tr key={userItem.id_user}>
          <td className="px-4 py-3 min-w-[220px]">
            <p className="font-medium">
              {userItem.nama} {selfLabelElement}
            </p>
            <p className="text-[11px] text-neutral-500">
              {userItem.email}
              {storeSuffixText}
            </p>
          </td>
          <td className="px-4 py-3 capitalize">{userItem.role}</td>
          <td className="px-4 py-3">
            <AccountStatusBadge status={userItem.status_akun} />
            {suspendInfoElement}
          </td>
          <td className="px-4 py-3">{verificationCellElement}</td>
          <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
            {formatDate(userItem.created_at)}
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              <Link
                href={`/admin/users/${userItem.id_user}`}
                className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 transition"
              >
                Edit
              </Link>
              {deleteFormElement}
            </div>
          </td>
        </tr>
      );
    });
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="View and edit Admin, Seller, and Buyer accounts. To stop someone from using FITFOUND, set the account to Inactive or Suspended instead of deleting it."
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ROLE_FILTERS.map(function buildRoleFilterLink(roleKey) {
            let roleHref = `/admin/users?role=${roleKey}`;
            if (roleKey === 'all') {
              roleHref = '/admin/users';
            }

            let roleLinkClass =
              'shrink-0 px-4 py-2 text-xs font-medium rounded-full border capitalize transition bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400';
            if (selectedRole === roleKey) {
              roleLinkClass =
                'shrink-0 px-4 py-2 text-xs font-medium rounded-full border capitalize transition bg-neutral-900 text-white border-neutral-900';
            }

            return (
              <Link key={roleKey} href={roleHref} className={roleLinkClass}>
                {roleKey}
              </Link>
            );
          })}
        </div>
        <form action="/admin/users" method="GET" className="flex gap-2">
          {hiddenRoleInputElement}
          <input
            name="q"
            defaultValue={keyword}
            placeholder="Search name or email"
            className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-xl cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">{usersTableBody}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}