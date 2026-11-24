import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

// cek sesi seller aktif trs atur nav n jumlah pesanan masuk di seller center
export default async function SellerLayout({ children }) {
  const { user, store } = await requireSellerPage();

  const resPendingOrders = await pool.query(
    "SELECT COUNT(*)::int AS total FROM orders WHERE id_store = $1 AND ((status_order = 'pending' AND dibayar_pada IS NOT NULL) OR status_order = 'processing')",
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

  // sapaan Hello, nama seller ditaruh di sidebar kiri supaya To Do List sejajar dgn menu
  return (
    <DashboardShell
      title={`Hello, ${user.nama}`}
      subtitle={store.nama_toko}
      groups={navGroups}
      panelLabel="Seller Center"
      homeHref="/seller/dashboard"
      profile={storeProfile}
    >
      {children}
    </DashboardShell>
  );
}