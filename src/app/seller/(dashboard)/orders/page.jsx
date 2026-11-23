import Link from 'next/link';
import pool from '@/lib/db';
import { requireSellerPage } from '@/lib/auth';
import OrderStatusPanel from '@/components/OrderStatusPanel';
import { PageHeader, EmptyState, OrderStatusBadge } from '@/components/ui';
import { formatRupiah, formatDate, ORDER_STATUS } from '@/lib/format';
import { hasSize } from '@/lib/sizes';

const FILTERS = ['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'];

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

  // ambil pesanan masuk ke toko jg info pembeli n barangnya
  let queryText = `
    SELECT o.id_order, o.total_harga, o.status_order, o.alamat_pengiriman, o.catatan, o.created_at,
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

  if (activeFilter !== 'all') {
    queryValues.push(activeFilter);
    queryText += ` AND o.status_order = $${queryValues.length}`;
  }
  queryText += ' GROUP BY o.id_order, u.nama, u.email ORDER BY o.created_at DESC';

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
              <div className="text-xs text-neutral-600">
                <span className="font-semibold text-neutral-800">Note:</span>{' '}
                {orderItem.catatan}
              </div>
            );
          }

          return (
            <div
              key={orderItem.id_order}
              className="bg-white rounded-2xl border border-neutral-200/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Order #{orderItem.id_order}
                    </span>
                    <OrderStatusBadge status={orderItem.status_order} />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
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
                          <p className="text-[11px] text-neutral-500">
                            {sizePrefixText}
                            {itemEntry.jumlah} × {formatRupiah(itemEntry.harga)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-800">Ship to:</span>{' '}
                    {orderItem.alamat_pengiriman}
                  </div>
                  {noteSectionElement}
                </div>

                <OrderStatusPanel
                  idOrder={orderItem.id_order}
                  status={orderItem.status_order}
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

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTERS.map(function buildOrderFilterLink(filterKey) {
          let filterHref = `/seller/orders?status=${filterKey}`;
          if (filterKey === 'all') {
            filterHref = '/seller/orders';
          }

          let filterLabel = ORDER_STATUS[filterKey].label;
          if (filterKey === 'all') {
            filterLabel = 'All';
          }

          let filterLinkClass =
            'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400';
          if (activeFilter === filterKey) {
            filterLinkClass = 'bg-neutral-900 text-white border-neutral-900';
          }

          return (
            <Link
              key={filterKey}
              href={filterHref}
              className={`shrink-0 px-4 py-2 text-xs font-medium rounded-full border transition ${filterLinkClass}`}
            >
              {filterLabel}
            </Link>
          );
        })}
      </div>

      {ordersListContent}
    </div>
  );
}