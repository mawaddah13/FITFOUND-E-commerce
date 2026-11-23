import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import Link from 'next/link';
import DashboardShell from '@/components/DashboardShell';

// cek sesi seller aktif trs atur nav n jumlah pesanan masuk di seller center
export default async function SellerLayout({ children }) {
  const { store } = await requireSellerPage();

  const resPendingOrders = await pool.query(
    "SELECT COUNT(*)::int AS total FROM orders WHERE id_store = $1 AND status_order IN ('pending', 'processing')",
    [store.id_store]
  );

  const navGroups = [
    {
      title: '',
      links: [{ href: '/seller/dashboard', label: 'Dashboard' }],
    },
    {
      title: 'Order',
      links: [
        {
          href: '/seller/orders',
          label: 'My Orders',
          badge: resPendingOrders.rows[0].total,
        },
      ],
    },
    {
      title: 'Product',
      links: [
        { href: '/seller/products', label: 'My Products' },
        { href: '/seller/products/new', label: 'Add New Product' },
      ],
    },
    {
      title: 'Store',
      links: [{ href: '/seller/store', label: 'Store Profile' }],
    },
  ];

  const storeProfile = {
    name: store.nama_toko,
    image: store.gambar_toko,
    href: '/seller/store',
  };

  const switchToShoppingAction = (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-3 py-1.5 text-[11px] font-semibold rounded-full border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors duration-200"
    >
      Switch to Shopping →
    </Link>
  );

  return (
    <DashboardShell
      groups={navGroups}
      panelLabel="Seller Center"
      homeHref="/seller/dashboard"
      profile={storeProfile}
      topAction={switchToShoppingAction}
    >
      {children}
    </DashboardShell>
  );
}