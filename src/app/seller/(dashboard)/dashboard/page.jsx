import Link from 'next/link';
import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import { Card, StatCard, OrderStatusBadge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/format';

// ambil ringkasan pesanan, stok, pendapatan, n pesanan terbaru trs tampilkan dashboard seller
export default async function SellerDashboardPage() {
  const { store } = await requireSellerPage();

  const resStats = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM orders WHERE id_store = $1 AND status_order = 'pending' AND dibayar_pada IS NULL)::int AS awaiting_payment,
       (SELECT COUNT(*) FROM orders WHERE id_store = $1 AND status_order = 'pending' AND dibayar_pada IS NOT NULL)::int AS to_verify,
       (SELECT COUNT(*) FROM orders WHERE id_store = $1 AND status_order = 'processing')::int AS to_process,
       (SELECT COUNT(*) FROM orders WHERE id_store = $1 AND status_order = 'shipped')::int AS shipped,
       (SELECT COUNT(*) FROM products WHERE id_store = $1 AND stok = 0)::int AS sold_out,
       (SELECT COUNT(*) FROM products WHERE id_store = $1 AND stok BETWEEN 1 AND 5)::int AS low_stock,
       (SELECT COUNT(*) FROM products WHERE id_store = $1)::int AS total_products,
       (SELECT COUNT(*) FROM orders WHERE id_store = $1 AND status_order = 'completed')::int AS completed_orders,
       (SELECT COALESCE(SUM(total_harga), 0) FROM orders WHERE id_store = $1 AND status_order = 'completed') AS revenue`,
    [store.id_store]
  );
  const stats = resStats.rows[0];

  const resRecentOrders = await pool.query(
    `SELECT o.id_order, o.total_harga, o.status_order, o.created_at, u.nama AS nama_buyer
     FROM orders o
     JOIN users u ON u.id_user = o.id_user
     WHERE o.id_store = $1
     ORDER BY o.created_at DESC
     LIMIT 5`,
    [store.id_store]
  );
  const recentOrders = resRecentOrders.rows;

  // ambil produk yg stoknya hampir habis (sisa 1-5) n yg sudah habis (0) buat info di overview
  const resLowStock = await pool.query(
    `SELECT id_product, nama_produk, stok, gambar
     FROM products
     WHERE id_store = $1 AND stok <= 5
     ORDER BY stok ASC, nama_produk ASC
     LIMIT 5`,
    [store.id_store]
  );
  const lowStockProducts = resLowStock.rows;

  const todoItems = [
    {
      label: 'Not Paid Yet',
      value: stats.awaiting_payment,
      href: '/seller/orders?status=pending',
    },
    {
      label: 'Confirm Payment',
      value: stats.to_verify,
      href: '/seller/orders?status=to_confirm',
    },
    {
      label: 'To Process',
      value: stats.to_process,
      href: '/seller/orders?status=processing',
    },
    {
      label: 'Shipped',
      value: stats.shipped,
      href: '/seller/orders?status=shipped',
    },
    {
      label: 'Low Stock',
      value: stats.low_stock,
      href: '/seller/products?stock=low',
      activeClass: 'text-amber-500',
    },
    {
      label: 'Sold Out Products',
      value: stats.sold_out,
      href: '/seller/products?stock=out',
      activeClass: 'text-red-600',
    },
  ];

  let recentOrdersContent = null;
  if (recentOrders.length === 0) {
    recentOrdersContent = (
      <p className="text-sm text-neutral-800 py-6 text-center">No orders yet.</p>
    );
  } else {
    recentOrdersContent = (
      <div className="divide-y divide-neutral-100">
        {recentOrders.map(function buildRecentOrderRow(orderItem) {
          return (
            <Link
              key={orderItem.id_order}
              href={`/seller/orders#order-${orderItem.id_order}`}
              className="py-3 px-2 -mx-2 rounded-xl flex flex-wrap items-center justify-between gap-2 hover:bg-neutral-50 transition-colors duration-200"
            >
              <div>
                <p className="text-sm text-neutral-950">
                  <span className="font-bold">Order #{orderItem.id_order}</span> · {orderItem.nama_buyer}
                </p>
                <p className="text-[11px] text-neutral-800">
                  {formatDate(orderItem.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={orderItem.status_order} />
                <span className="text-sm font-semibold">
                  {formatRupiah(orderItem.total_harga)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  let lowStockContent = (
    <p className="text-sm text-neutral-950 py-6 text-center">All products have enough stock.</p>
  );
  if (lowStockProducts.length > 0) {
    lowStockContent = (
      <div className="divide-y divide-neutral-100">
        {lowStockProducts.map(function buildLowStockRow(productItem) {
          // habis = merah, hampir habis = kuning
          let stockBadgeClass = 'bg-amber-100 text-amber-800';
          let stockBadgeText = `${productItem.stok} left`;
          if (productItem.stok === 0) {
            stockBadgeClass = 'bg-red-100 text-red-700';
            stockBadgeText = 'Sold out';
          }

          return (
            <Link
              key={productItem.id_product}
              href={`/seller/products/${productItem.id_product}/edit`}
              className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-neutral-950 truncate">{productItem.nama_produk}</span>
              <span className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full ${stockBadgeClass}`}>
                {stockBadgeText}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-base font-semibold">To Do List</h3>
        <p className="text-xs text-neutral-700 mt-0.5">
          Things you need to take care of
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 md:divide-x divide-neutral-200">
          {todoItems.map(function buildTodoItem(todoEntry) {
            let todoCountClass = 'text-2xl font-bold text-neutral-300';
            // stok menipis kuning, stok habis merah, sisanya biru
            if (todoEntry.value > 0 && todoEntry.activeClass) {
              todoCountClass = `text-2xl font-bold ${todoEntry.activeClass}`;
            } else if (todoEntry.value > 0) {
              todoCountClass = 'text-2xl font-bold text-(--biru)';
            }

            return (
              <Link
                key={todoEntry.label}
                href={todoEntry.href}
                className="group py-3 px-2 text-center rounded-xl hover:bg-neutral-50 transition-colors duration-200"
              >
                <p className={todoCountClass}>{todoEntry.value}</p>
                <p className="text-xs text-neutral-900 mt-1 group-hover:text-neutral-950">
                  {todoEntry.label}
                </p>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Products"
          value={stats.total_products}
          href="/seller/products"
        />
        <StatCard
          label="Completed Orders"
          value={stats.completed_orders}
          href="/seller/orders?status=completed"
        />
        <StatCard
          label="Revenue (Completed)"
          value={formatRupiah(stats.revenue)}
          href="/seller/orders?status=completed"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">Low &amp; Sold Out Products</h3>
            <p className="text-xs text-neutral-950 mt-0.5">
              Products with 5 items or fewer left in total, including products that are already sold out.
            </p>
          </div>
          <Link href="/seller/products?sort=stock_asc" className="text-xs underline text-neutral-950">
            View all
          </Link>
        </div>
        {lowStockContent}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Recent Orders</h3>
          <Link href="/seller/orders" className="text-xs underline text-neutral-900">
            View all
          </Link>
        </div>
        {recentOrdersContent}
      </Card>
    </div>
  );
}