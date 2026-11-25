import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

// cek sesi buyer trs siapkan nav, ringkasan jumlah keranjang, pesanan aktif
export default async function BuyerLayout({ children }) {
  const user = await requireBuyerPage();

  // Shopping Cart n Wishlist tidak ada di sidebar akun (sudah ada ikonnya di navbar), Addresses masuk ke My Profile
  const resCounts = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM orders WHERE id_user = $1 AND status_order IN ('pending','processing','shipped'))::int AS active_orders`,
    [user.id_user]
  );
  const counts = resCounts.rows[0];

  const navLinks = [
    { href: '/buyer/dashboard', label: 'My Profile' },
    { href: '/buyer/orders', label: 'Orders & Tracking', badge: counts.active_orders },
  ];

  const accountSubtitle = 'Buyer Account';

  return (
    <DashboardShell
      title={user.nama}
      subtitle={accountSubtitle}
      links={navLinks}
      plainPaths={['/buyer/cart', '/buyer/wishlist', '/buyer/checkout']}
      fullSidebar
    >
      {children}
    </DashboardShell>
  );
}