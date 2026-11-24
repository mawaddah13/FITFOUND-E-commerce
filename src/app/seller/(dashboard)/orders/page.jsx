import Link from 'next/link';
import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import OrderStatusPanel from '@/components/OrderStatusPanel';
import { PageHeader, EmptyState, OrderStatusBadge } from '@/components/ui';
import { formatRupiah, formatDate, ORDER_STATUS } from '@/lib/format';
import { hasSize } from '@/lib/sizes';

// to_confirm = masih Pending tp buyer sudah bayar, tinggal Confirm Payment
const FILTERS = [
  'all',
  'pending',
  'to_confirm',
  'processing',
  'shipped',
  'completed',
  'cancelled',
];

// pilihan urutan pesanan di Incoming Orders
const ORDER_SORTS = {
  newest: { label: 'Newest', sql: 'o.created_at DESC' },
  oldest: { label: 'Oldest', sql: 'o.created_at ASC' },
  total_desc: { label: 'Total: High to Low', sql: 'o.total_harga DESC, o.created_at DESC' },
  total_asc: { label: 'Total: Low to High', sql: 'o.total_harga ASC, o.created_at DESC' },
};

const selectClass =
  'w-full px-3 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900';

// cek filter status trs tampilkan daftar pesanan masuk untuk toko seller
export default async function SellerOrdersPage({ searchParams }) {
  const { store } = await requireSellerPage();
  const resolvedSearchParams = await searchParams;

  let activeFilter = 'all';
  if (resolvedSearchParams && typeof resolvedSearchParams.status === 'string') {
    activeFilter = resolvedSearchParams.status;
  }
  if (!FILTERS.includes(activeFilter)) {
    activeFilter = 'all';
  }

  let sortKey = 'newest';
  if (resolvedSearchParams && typeof resolvedSearchParams.sort === 'string') {
    sortKey = resolvedSearchParams.sort;
  }
  if (!ORDER_SORTS[sortKey]) {
    sortKey = 'newest';
  }

  // ambil pesanan masuk ke toko jg info pembeli n barangnya
  let queryText = `
    SELECT o.id_order, o.total_harga, o.status_order, o.alamat_pengiriman, o.catatan, o.created_at,
           o.dibayar_pada,
           COALESCE(
             (SELECT JSON_AGG(JSON_BUILD_OBJECT('status', h.status_order, 'tanggal', h.created_at) ORDER BY h.created_at)
              FROM order_status_history h WHERE h.id_order = o.id_order),
             '[]'
           ) AS riwayat,
           u.nama AS nama_buyer, u.email AS email_buyer,
           COALESCE(
             JSON_AGG(JSON_BUILD_OBJECT(
               'id', oi.id_order_item, 'nama', oi.nama_produk, 'ukuran', oi.ukuran,
               'jumlah', oi.jumlah, 'harga', oi.harga_satuan, 'gambar', oi.gambar
             ) ORDER BY oi.id_order_item) FILTER (WHERE oi.id_order_item IS NOT NULL),
             '[]'
           ) AS items
    FROM orders o
    JOIN users u ON u.id_user = o.id_user
    LEFT JOIN order_items oi ON oi.id_order = o.id_order
    WHERE o.id_store = $1`;
  const queryValues = [store.id_store];

  if (activeFilter === 'to_confirm') {
    queryText += " AND o.status_order = 'pending' AND o.dibayar_pada IS NOT NULL";
  } else if (activeFilter !== 'all') {
    queryValues.push(activeFilter);
    queryText += ` AND o.status_order = $${queryValues.length}`;
  }
  queryText += ` GROUP BY o.id_order, u.nama, u.email ORDER BY ${ORDER_SORTS[sortKey].sql}`;

  const resOrders = await pool.query(queryText, queryValues);
  const orders = resOrders.rows;

  let ordersListContent = null;
  if (orders.length === 0) {
    ordersListContent = <EmptyState message="No orders found." />;
  } else {
    ordersListContent = (
      <div className="space-y-4">
        {orders.map(function buildSellerOrderCard(orderItem) {
          let noteSectionElement = null;
          if (orderItem.catatan) {
            noteSectionElement = (
              <div className="text-xs text-neutral-900">
                <span className="font-semibold text-neutral-800">Note:</span>{' '}
                {orderItem.catatan}
              </div>
            );
          }

          return (
            <div
              key={orderItem.id_order}
              id={`order-${orderItem.id_order}`}
              className="scroll-mt-28 bg-white rounded-2xl border border-neutral-200/80 p-5 target:border-neutral-900 target:ring-2 target:ring-neutral-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-neutral-950">
                      Order #{orderItem.id_order}
                    </span>
                    <OrderStatusBadge status={orderItem.status_order} />
                  </div>
                  <p className="text-[11px] text-neutral-800 mt-1">
                    {orderItem.nama_buyer} ({orderItem.email_buyer}) ·{' '}
                    {formatDate(orderItem.created_at)}
                  </p>
                </div>
                <p className="text-base font-semibold">
                  {formatRupiah(orderItem.total_harga)}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-3">
                  {orderItem.items.map(function buildOrderItemRow(itemEntry) {
                    let itemThumbElement = null;
                    if (itemEntry.gambar) {
                      itemThumbElement = (
                        <img
                          src={itemEntry.gambar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      );
                    }

                    let sizePrefixText = '';
                    if (hasSize(itemEntry.ukuran)) {
                      sizePrefixText = `Size ${itemEntry.ukuran} · `;
                    }

                    return (
                      <div key={itemEntry.id} className="flex items-center gap-3">
                        <span className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                          {itemThumbElement}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{itemEntry.nama}</p>
                          <p className="text-[11px] text-neutral-800">
                            {sizePrefixText}
                            {itemEntry.jumlah} × {formatRupiah(itemEntry.harga)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 text-xs text-neutral-900">
                    <span className="font-semibold text-neutral-800">Ship to:</span>{' '}
                    {orderItem.alamat_pengiriman}
                  </div>
                  {noteSectionElement}
                </div>

                <OrderStatusPanel
                  idOrder={orderItem.id_order}
                  status={orderItem.status_order}
                  paidAt={orderItem.dibayar_pada}
                  history={orderItem.riwayat}
                  createdAt={orderItem.created_at}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Incoming Orders"
        description="Orders for products from your store."
      />

      {/* filter status pakai dropdown (tab-nya terlalu banyak) + urutan pesanan */}
      <form
        action="/seller/orders"
        method="GET"
        className="mb-4 p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[240px_240px_auto] gap-3 items-end"
      >
        <label className="block">
          <span className="block text-xs font-medium text-neutral-950 mb-1">Status</span>
          <select name="status" defaultValue={activeFilter} className={selectClass}>
            {FILTERS.map(function buildStatusOption(filterKey) {
              let filterLabel = 'All';
              if (filterKey === 'to_confirm') {
                filterLabel = 'Paid — Needs Confirmation';
              } else if (filterKey !== 'all') {
                filterLabel = ORDER_STATUS[filterKey].label;
              }
              return (
                <option key={filterKey} value={filterKey}>
                  {filterLabel}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-neutral-950 mb-1">Sort by</span>
          <select name="sort" defaultValue={sortKey} className={selectClass}>
            {Object.keys(ORDER_SORTS).map(function buildSortOption(optionKey) {
              return (
                <option key={optionKey} value={optionKey}>
                  {ORDER_SORTS[optionKey].label}
                </option>
              );
            })}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2.5 text-sm font-medium bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            Apply
          </button>
          <Link
            href="/seller/orders"
            className="px-4 py-2.5 text-sm font-medium bg-white border border-neutral-300 text-neutral-950 rounded-xl hover:border-neutral-900 transition"
          >
            Reset Filter
          </Link>
        </div>
      </form>

      {ordersListContent}
    </div>
  );
}