import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

// cek sesi buyer trs siapkan nav, ringkasan jumlah keranjang, pesanan aktif
export default async function BuyerLayout({ children }) {
  const user = await requireBuyerPage();

  const resCounts = await pool.query(
    `SELECT
       (SELECT COALESCE(SUM(ci.jumlah), 0) FROM cart_items ci
          JOIN carts c ON c.id_cart = ci.id_cart WHERE c.id_user = $1)::int AS cart_count,
       (SELECT COUNT(*) FROM orders WHERE id_user = $1 AND status_order IN ('pending','processing','shipped'))::int AS active_orders`,
    [user.id_user]
  );
  const counts = resCounts.rows[0];

  const navLinks = [
    { href: '/buyer/dashboard', label: 'My Profile' },
    { href: '/buyer/cart', label: 'Shopping Cart', badge: counts.cart_count },
    { href: '/buyer/orders', label: 'Orders & Tracking', badge: counts.active_orders },
    { href: '/buyer/wishlist', label: 'Wishlist' },
    { href: '/buyer/addresses', label: 'Addresses' },
  ];

  let accountSubtitle = 'Buyer Account';
  if (user.role === 'buyer') {
    navLinks.push({ href: '/buyer/become-seller', label: 'Become a Seller' });
  } else if (user.role === 'seller' && user.status === 'active') {
    accountSubtitle = 'Shopping as Seller';
    navLinks.push({ href: '/seller/dashboard', label: 'Seller Center →' });
  } else if (user.role === 'seller' && user.status === 'pending') {
    accountSubtitle = 'Buyer Account · Seller Pending';
    navLinks.push({ href: '/seller/pending', label: 'Seller Application (Pending)' });
  } else if (user.role === 'seller' && user.status === 'rejected') {
    navLinks.push({ href: '/seller/pending', label: 'Seller Application (Rejected)' });
  }

  return (
    <DashboardShell title={user.nama} subtitle={accountSubtitle} links={navLinks}>
      {children}
    </DashboardShell>
  );
}