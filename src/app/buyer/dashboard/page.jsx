import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import { updateProfileAction, changePasswordAction } from '@/app/action/buyer';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import { PageHeader, Card, Field, StatCard, inputClass } from '@/components/ui';
import { formatDate } from '@/lib/format';
import PasswordInput from '@/components/PasswordInput';

// muat statistik n data profil trs tampilkan halaman dashboard buyer
export default async function BuyerDashboardPage() {
  const user = await requireBuyerPage();

  const resStats = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM orders WHERE id_user = $1)::int AS total_orders,
       (SELECT COUNT(*) FROM orders WHERE id_user = $1 AND status_order = 'completed')::int AS completed_orders,
       (SELECT COUNT(*) FROM wishlists WHERE id_user = $1)::int AS wishlist_count,
       (SELECT COUNT(*) FROM addresses WHERE id_user = $1)::int AS address_count`,
    [user.id_user]
  );
  const stats = resStats.rows[0];

  let phoneDefaultValue = '';
  if (user.no_hp) {
    phoneDefaultValue = user.no_hp;
  }

  let addressDefaultValue = '';
  if (user.alamat) {
    addressDefaultValue = user.alamat;
  }

  const memberDescription = `Member since ${formatDate(user.created_at)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description={memberDescription} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total_orders} href="/buyer/orders" />
        <StatCard
          label="Completed"
          value={stats.completed_orders}
          href="/buyer/orders?tab=completed"
        />
        <StatCard label="Wishlist" value={stats.wishlist_count} href="/buyer/wishlist" />
        <StatCard label="Addresses" value={stats.address_count} href="/buyer/addresses" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold mb-4">Account Information</h3>
          <ActionForm action={updateProfileAction} className="space-y-4">
            <Field label="Full Name" htmlFor="nama">
              <input
                id="nama"
                name="nama"
                required
                minLength={3}
                defaultValue={user.nama}
                className={inputClass}
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={user.email}
                className={inputClass}
              />
            </Field>
            <Field label="Phone Number" htmlFor="no_hp">
              <input
                id="no_hp"
                name="no_hp"
                type="tel"
                required
                defaultValue={phoneDefaultValue}
                className={inputClass}
              />
            </Field>
            <Field label="Address" htmlFor="alamat" hint="Street, city, and postal code.">
              <textarea
                id="alamat"
                name="alamat"
                rows={2}
                required
                minLength={10}
                maxLength={500}
                defaultValue={addressDefaultValue}
                className={inputClass}
              />
            </Field>
            <SubmitButton>Save Profile</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-4">Change Password</h3>
          <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
            <Field label="Current Password" htmlFor="current_password">
              <PasswordInput
                id="current_password"
                name="current_password"
                required
                className={inputClass}
              />
            </Field>
            <Field label="New Password" htmlFor="new_password" hint="Minimum 6 characters.">
              <PasswordInput
                id="new_password"
                name="new_password"
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <Field label="Confirm New Password" htmlFor="confirm_password">
              <PasswordInput
                id="confirm_password"
                name="confirm_password"
                required
                minLength={6}
                className={inputClass}
              />
            </Field>
            <SubmitButton variant="dark">Change Password</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}