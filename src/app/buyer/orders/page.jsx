import Link from 'next/link';
import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import { PageHeader, EmptyState, OrderStatusBadge, Notice } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/format';

// daftar tab status pesanan di halaman riwayat order buyer
const TABS = {
  all: { label: 'All', statuses: null },
  active: {
    label: 'In Progress',
    statuses: ['pending', 'processing', 'shipped'],
  },
  completed: { label: 'Completed', statuses: ['completed'] },
  cancelled: { label: 'Cancelled', statuses: ['cancelled'] },
};

// cek filter tab pesanan lalu tampilkan riwayat pesanan pembeli
export default async function BuyerOrdersPage({ searchParams }) {
  const user = await requireBuyerPage();
  const resolvedSearchParams = await searchParams;

  let activeTab = 'all';
  if (resolvedSearchParams && typeof resolvedSearchParams.tab === 'string') {
    activeTab = resolvedSearchParams.tab;
  }
  if (!TABS[activeTab]) {
    activeTab = 'all';
  }

  let createdCount = 0;
  if (resolvedSearchParams && resolvedSearchParams.created !== undefined) {
    const parsedCreated = Number(resolvedSearchParams.created);
    if (!Number.isNaN(parsedCreated) && parsedCreated > 0) {
      createdCount = parsedCreated;
    }
  }

  // ambil ringkasan order, jumlah item, foto pertama, dan nama barang pertama per order
  let queryText = `
    SELECT o.id_order, o.nama_toko, o.total_harga, o.status_order, o.created_at,
           COUNT(oi.id_order_item)::int AS item_count,
           (ARRAY_AGG(oi.gambar ORDER BY oi.id_order_item))[1] AS cover,
           (ARRAY_AGG(oi.nama_produk ORDER BY oi.id_order_item))[1] AS first_item
    FROM orders o
    LEFT JOIN order_items oi ON oi.id_order = o.id_order
    WHERE o.id_user = $1`;
  const queryValues = [user.id_user];

  if (TABS[activeTab].statuses) {
    queryValues.push(TABS[activeTab].statuses);
    queryText += ` AND o.status_order = ANY($${queryValues.length})`;
  }
  queryText += ' GROUP BY o.id_order ORDER BY o.created_at DESC';

  const resOrders = await pool.query(queryText, queryValues);
  const orders = resOrders.rows;

  let checkoutNoticeElement = null;
  if (createdCount > 0) {
    checkoutNoticeElement = (
      <Notice>
        Checkout successful! {createdCount} order(s) created. Your cart has been emptied.
      </Notice>
    );
  }

  let orderListContent = null;
  if (orders.length === 0) {
    orderListContent = (
      <EmptyState
        message="No orders here yet."
        actionHref="/products"
        actionLabel="Browse Products"
      />
    );
  } else {
    orderListContent = (
      <div className="space-y-3">
        {orders.map(function buildOrderCard(orderItem) {
          let coverImageElement = null;
          if (orderItem.cover) {
            coverImageElement = (
              <img src={orderItem.cover} alt="" className="w-full h-full object-cover" />
            );
          }

          let extraItemsText = '';
          if (orderItem.item_count > 1) {
            extraItemsText = ` +${orderItem.item_count - 1} more`;
          }

          return (
            <Link
              key={orderItem.id_order}
              href={`/buyer/orders/${orderItem.id_order}`}
              className="flex gap-4 items-center bg-white rounded-2xl border border-neutral-200/80 p-4 hover:border-neutral-400 transition"
            >
              <span className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                {coverImageElement}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-neutral-950">
                    Order #{orderItem.id_order}
                  </span>
                  <OrderStatusBadge status={orderItem.status_order} />
                </div>
                <p className="text-sm text-neutral-800 truncate">
                  {orderItem.first_item}
                  {extraItemsText}
                </p>
                <p className="text-[11px] text-neutral-800 mt-0.5">
                  {orderItem.nama_toko} · {formatDate(orderItem.created_at)}
                </p>
              </div>
              <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
                {formatRupiah(orderItem.total_harga)}
              </p>
            </Link>
          );
        })}
      </div>
    );
  }

  const tabKeys = Object.keys(TABS);

  return (
    <div>
      <PageHeader
        title="Orders & Tracking"
        description="Your order history and delivery status."
      />

      {checkoutNoticeElement}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {tabKeys.map(function buildOrderTabLink(tabKey) {
          let tabHref = `/buyer/orders?tab=${tabKey}`;
          if (tabKey === 'all') {
            tabHref = '/buyer/orders';
          }

          let tabLinkClass =
            'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400';
          if (activeTab === tabKey) {
            tabLinkClass = 'bg-neutral-900 text-white border-neutral-900';
          }

          return (
            <Link
              key={tabKey}
              href={tabHref}
              className={`shrink-0 px-4 py-2 text-xs font-medium rounded-full border transition ${tabLinkClass}`}
            >
              {TABS[tabKey].label}
            </Link>
          );
        })}
      </div>

      {orderListContent}
    </div>
  );
}