import pool from '@/lib/db';
import { requireAdminPage } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

// cek sesi admin trs atur nav n jumlah antrean verifi penjual
export default async function AdminLayout({ children }) {
  const user = await requireAdminPage();

  const resPendingSellers = await pool.query(
    "SELECT COUNT(*)::int AS total FROM users WHERE role = 'seller' AND status = 'pending'"
  );

  const navLinks = [
    { href: '/admin/dashboard', label: 'Overview' },
    { href: '/admin/users', label: 'User Management' },
    {
      href: '/admin/sellers',
      label: 'Seller Verification',
      badge: resPendingSellers.rows[0].total,
    },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/products', label: 'Product Moderation' },
  ];

  return (
    <DashboardShell
      title={user.nama}
      subtitle="Administrator"
      links={navLinks}
      panelLabel="Admin Panel"
      homeHref="/admin/dashboard"
    >
      {children}
    </DashboardShell>
  );
}