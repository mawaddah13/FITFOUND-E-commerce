import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import { PageHeader, Card, StatCard, UserStatusBadge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/format';

// ambil statistik platform n 6 pengguna terbaru trs tampilkan ringkasan dasbor admin
export default async function AdminDashboardPage() {
  await requireAdminPage();

  const resStats = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'buyer')::int AS buyers,
       (SELECT COUNT(*) FROM users WHERE role = 'seller' AND status = 'active')::int AS sellers,
       (SELECT COUNT(*) FROM users WHERE role = 'seller' AND status = 'pending')::int AS pending_sellers,
       (SELECT COUNT(*) FROM products)::int AS products,
       (SELECT COUNT(*) FROM categories)::int AS categories,
       (SELECT COUNT(*) FROM orders)::int AS orders,
       (SELECT COALESCE(SUM(total_harga), 0) FROM orders WHERE status_order = 'completed') AS gmv`
  );
  const stats = resStats.rows[0];

  const resLatestUsers = await pool.query(
    `SELECT u.id_user, u.nama, u.email, u.role, u.status, u.created_at, s.nama_toko
     FROM users u
     LEFT JOIN stores s ON s.id_user = u.id_user
     WHERE u.role <> 'admin'
     ORDER BY u.created_at DESC
     LIMIT 6`
  );
  const latestUsers = resLatestUsers.rows;

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Overview" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Buyers"
          value={stats.buyers}
          href="/admin/users?role=buyer"
        />
        <StatCard
          label="Approved Sellers"
          value={stats.sellers}
          href="/admin/users?role=seller"
        />
        <StatCard
          label="Pending Sellers"
          value={stats.pending_sellers}
          href="/admin/sellers"
        />
        <StatCard
          label="Products"
          value={stats.products}
          href="/admin/products"
        />
        <StatCard
          label="Categories"
          value={stats.categories}
          href="/admin/categories"
        />
        <StatCard label="Orders" value={stats.orders} />
        <div className="col-span-2">
          <StatCard
            label="Completed Sales (GMV)"
            value={formatRupiah(stats.gmv)}
          />
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Newest Users</h3>
          <Link href="/admin/users" className="text-xs underline text-neutral-600">
            Manage users
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {latestUsers.map(function buildLatestUserRow(userEntry) {
            let storeSegmentText = '';
            if (userEntry.nama_toko) {
              storeSegmentText = ` · ${userEntry.nama_toko}`;
            }

            let sellerStatusBadgeElement = null;
            if (userEntry.role === 'seller') {
              sellerStatusBadgeElement = <UserStatusBadge status={userEntry.status} />;
            }

            return (
              <div
                key={userEntry.id_user}
                className="py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {userEntry.nama}{' '}
                    <span className="text-xs font-normal text-neutral-500 capitalize">
                      · {userEntry.role}
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {userEntry.email}
                    {storeSegmentText} · {formatDate(userEntry.created_at)}
                  </p>
                </div>
                {sellerStatusBadgeElement}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}