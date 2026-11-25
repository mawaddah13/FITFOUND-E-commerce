import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import {
  cancelOrderByBuyerAction,
  confirmReceivedAction,
  markOrderPaidAction,
} from '@/app/action/order';
import { submitReviewAction } from '@/app/action/buyer';
import ActionForm from '@/components/ActionForm';
import SubmitButton from '@/components/SubmitButton';
import StarRatingInput from '@/components/StarRatingInput';
import { Card, OrderStatusBadge, inputClass } from '@/components/ui';
import { formatRupiah, formatDate, formatStepDate, getStatusDate } from '@/lib/format';
import { hasSize } from '@/lib/sizes';
import { activeAccountSql } from '@/lib/products';

// daftar tahap status order buat tampilan tracking
const TRACKING_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
];

// cek id pesanan lalu tampilkan pelacakan status, daftar item, alamat, dan ulasan
export default async function BuyerOrderDetailPage({ params }) {
  const user = await requireBuyerPage();
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);

  // kalau id order bukan angka bulat positif, lempar ke 404
  if (!Number.isInteger(orderId) || orderId <= 0) {
    notFound();
  }

  // pastikan order ada n memang milik user yg sedang login
  const resOrder = await pool.query(
    `SELECT id_order, nama_toko, total_harga, status_order, alamat_pengiriman, catatan, dibayar_pada,
            created_at, updated_at
     FROM orders WHERE id_order = $1 AND id_user = $2`,
    [orderId, user.id_user]
  );
  if (resOrder.rows.length === 0) {
    notFound();
  }
  const order = resOrder.rows[0];

  // ambil rincian barang di order ini beserta ulasan user (kalau sudah pernah diulas)
  const resOrderItems = await pool.query(
    `SELECT oi.id_order_item, oi.id_product, oi.nama_produk, oi.gambar, oi.ukuran, oi.jumlah, oi.harga_satuan,
            r.rating, r.komentar,
            (su.id_user IS NOT NULL) AS masih_dijual
     FROM order_items oi
     LEFT JOIN reviews r ON r.id_order = oi.id_order AND r.id_product = oi.id_product
     LEFT JOIN products p ON p.id_product = oi.id_product
     LEFT JOIN stores s ON s.id_store = p.id_store
     LEFT JOIN users su ON su.id_user = s.id_user
       AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
     WHERE oi.id_order = $1
     ORDER BY oi.id_order_item`,
    [orderId]
  );
  const items = resOrderItems.rows;

  // ambil riwayat status buat tanggal di tiap tahapan
  const resHistory = await pool.query(
    `SELECT status_order AS status, created_at AS tanggal
     FROM order_status_history WHERE id_order = $1
     ORDER BY created_at ASC`,
    [orderId]
  );
  const statusHistory = resHistory.rows;

  // cari posisi langkah status order saat ini di TRACKING_STEPS
  let currentStepIndex = -1;
  for (let idx = 0; idx < TRACKING_STEPS.length; idx += 1) {
    if (TRACKING_STEPS[idx].key === order.status_order) {
      currentStepIndex = idx;
    }
  }

  const isCancelled = order.status_order === 'cancelled';
  const isCompleted = order.status_order === 'completed';

  // catat id produk yg sudah tampil form ulasannya biar tidak muncul 2x kalau ada beda ukuran
  const reviewedProductIds = [];

  // kalau dibatalkan tampilkan info tanggal batal, kalau jalan tampilkan langkah tracking
  let trackingContent = null;
  if (isCancelled) {
    trackingContent = (
      <p className="text-sm text-red-600">
        This order was cancelled on {formatDate(order.updated_at)}.
      </p>
    );
  } else {
    trackingContent = (
      <ol className="flex items-start">
        {TRACKING_STEPS.map(function buildTrackingStep(stepItem, stepIdx) {
          const isStepDone = stepIdx <= currentStepIndex;
          const isLastStep = stepIdx === TRACKING_STEPS.length - 1;

          // pasang garis penghubung kecuali di langkah paling akhir
          let stepConnector = null;
          if (!isLastStep) {
            stepConnector = (
              <span className="absolute top-4 left-1/2 w-full h-0.5 bg-neutral-300" />
            );
          }

          // tahap yg sudah terlewati pakai warna biru n tanda centang
          let circleClass =
            'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-neutral-100 text-neutral-700 border-2 border-neutral-300';
          let circleContent = stepIdx + 1;
          if (isStepDone) {
            circleClass =
              'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-(--biru) text-white';
            circleContent = '✓';
          }

          let stepLabelClass = 'mt-2 text-[11px] sm:text-xs text-neutral-700';
          if (isStepDone) {
            stepLabelClass = 'mt-2 text-[11px] sm:text-xs text-neutral-900 font-medium';
          }

          // tanggal tahap ini diperbarui
          let stepDateElement = null;
          const stepDate = getStatusDate(statusHistory, stepItem.key, order.created_at);
          if (isStepDone && stepDate) {
            const stepDateText = formatStepDate(stepDate);
            stepDateElement = (
              <span className="mt-1 text-[11px] leading-snug text-neutral-800">
                {stepDateText.day}
                <br />
                {stepDateText.time}
              </span>
            );
          }

          return (
            <li
              key={stepItem.key}
              className="relative flex-1 flex flex-col items-center text-center"
            >
              {stepConnector}
              <span className={circleClass}>{circleContent}</span>
              <span className={stepLabelClass}>{stepItem.label}</span>
              {stepDateElement}
            </li>
          );
        })}
      </ol>
    );
  }

  // tombol batalkan order cuma muncul pas statusnya masih pending n belum dibayar
  let cancelOrderActionElement = null;
  if (order.status_order === 'pending' && !order.dibayar_pada) {
    const boundCancelAction = cancelOrderByBuyerAction.bind(null, order.id_order);
    cancelOrderActionElement = (
      <ActionForm
        action={boundCancelAction}
        confirmMessage="Cancel this order?"
        confirmDescription="The items will be returned to the store's stock."
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
      >
        <SubmitButton variant="dangerOutline" pendingText="Cancelling...">
          Cancel Order
        </SubmitButton>
      </ActionForm>
    );
  }

  // tombol konfirmasi terima barang cuma muncul pas statusnya shipped
  let confirmReceivedActionElement = null;
  if (order.status_order === 'shipped') {
    const boundConfirmAction = confirmReceivedAction.bind(null, order.id_order);
    confirmReceivedActionElement = (
      <ActionForm
        action={boundConfirmAction}
        confirmMessage="Have you received this order?"
        confirmDescription="The order will be marked as Completed and you can review the products."
        confirmLabel="Yes, Received"
        cancelLabel="Not Yet"
        confirmTone="neutral"
      >
        <SubmitButton variant="success" pendingText="Confirming...">
          I Have Received This Order
        </SubmitButton>
      </ActionForm>
    );
  }

  // tombol bayar (tanpa foto bukti), setelah dibayar tinggal tunggu seller konfirmasi
  let paymentSection = null;
  if (order.status_order === 'pending' && !order.dibayar_pada) {
    const boundPayAction = markOrderPaidAction.bind(null, order.id_order);
    paymentSection = (
      <ActionForm
        action={boundPayAction}
        confirmMessage={`Pay ${formatRupiah(order.total_harga)} for this order?`}
        confirmDescription="The seller will confirm your payment, then the order goes to Processing."
        confirmLabel="Pay Now"
        cancelLabel="Not Yet"
        confirmTone="neutral"
        className="mt-6 p-4 rounded-xl bg-(--abumuda) flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-950">Waiting for payment</p>
          <p className="text-xs text-neutral-800 mt-0.5">
            Pay {formatRupiah(order.total_harga)} to {order.nama_toko} to continue this order.
          </p>
        </div>
        <SubmitButton size="sm" variant="dark" pendingText="Paying..." className="px-6 py-2.5">
          Pay Now
        </SubmitButton>
      </ActionForm>
    );
  } else if (order.status_order === 'pending') {
    paymentSection = (
      <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <p className="text-sm font-semibold text-emerald-800">Paid on {formatDate(order.dibayar_pada)}</p>
        <p className="text-xs text-emerald-800 mt-0.5">Waiting for the seller to confirm your payment.</p>
      </div>
    );
  }

  // kasih catatan kecil kalau order belum selesai maupun dibatalkan
  let reviewHintElement = null;
  if (!isCompleted && !isCancelled) {
    reviewHintElement = (
      <p className="mt-3 text-[11px] text-neutral-700">
        You can rate and review products after the order status is “Completed”.
      </p>
    );
  }

  // tampilkan blok catatan buyer kalau memang ada isinya
  let noteSectionElement = null;
  if (order.catatan) {
    noteSectionElement = (
      <>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-800 mt-5 mb-1">
          Note
        </h4>
        <p className="text-sm text-neutral-700">{order.catatan}</p>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/buyer/orders" className="text-xs text-neutral-800 hover:text-neutral-900">
          ← Back to orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-950">
            Order #{order.id_order}
          </h2>
          <OrderStatusBadge status={order.status_order} />
        </div>
        <p className="text-sm text-neutral-800 mt-1">
          {order.nama_toko} · Ordered {formatDate(order.created_at)}
        </p>
      </div>

      <Card>
        <h3 className="text-base font-semibold mb-5">Order Tracking</h3>
        {trackingContent}
        {paymentSection}

        <div className="mt-6 flex flex-wrap gap-3">
          {cancelOrderActionElement}
          {confirmReceivedActionElement}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <Card>
          <h3 className="text-base font-semibold mb-2">Items</h3>
          <div className="divide-y divide-neutral-100">
            {items.map(function buildOrderItemRow(orderItem) {
              let reviewSection = null;
              let canReview = false;
              if (
                isCompleted &&
                orderItem.id_product &&
                !reviewedProductIds.includes(orderItem.id_product)
              ) {
                canReview = true;
              }

              // kalau sudah pernah diulas tampilkan rating n komentarnya, kalau belum n memenuhi syarat tampilkan form ulasan
              if (orderItem.rating) {
                const filledStars = '★'.repeat(orderItem.rating);
                const emptyStars = '★'.repeat(5 - orderItem.rating);
                reviewSection = (
                  <div className="mt-3 p-3 rounded-xl bg-(--abumuda)">
                    <p className="text-base leading-none text-amber-400">
                      {filledStars}
                      <span className="text-neutral-300">{emptyStars}</span>
                      <span className="ml-2 text-[11px] text-neutral-950">Your review</span>
                    </p>
                    <p className="text-xs text-neutral-900 mt-1">{orderItem.komentar}</p>
                  </div>
                );
              } else if (canReview) {
                const boundReviewAction = submitReviewAction.bind(
                  null,
                  order.id_order,
                  orderItem.id_product
                );
                reviewSection = (
                  <ActionForm
                    action={boundReviewAction}
                    className="mt-3 p-4 rounded-xl bg-(--abumuda) space-y-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        How do you like this product?
                      </p>
                      <p className="text-[11px] text-neutral-950">
                        Your review helps other shoppers choose.
                      </p>
                    </div>
                    <StarRatingInput />
                    <textarea
                      name="komentar"
                      rows={2}
                      required
                      minLength={5}
                      maxLength={500}
                      placeholder="What did you like? How is the quality, size, and material?"
                      className={inputClass}
                    />
                    <SubmitButton size="sm" variant="dark" pendingText="Posting...">
                      Post Review
                    </SubmitButton>
                  </ActionForm>
                );
              }

              if (orderItem.id_product) {
                reviewedProductIds.push(orderItem.id_product);
              }

              let itemThumbElement = null;
              if (orderItem.gambar) {
                itemThumbElement = (
                  <img
                    src={orderItem.gambar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                );
              }

              // kalau produk masih ada di katalog bisa diklik ke halaman detail produknya
              // produk yg sudah dihapus / tokonya nonaktif tetap ada di riwayat, tp tidak bisa diklik
              let itemTitleElement = (
                <p className="text-sm font-medium">
                  {orderItem.nama_produk} (no longer available)
                </p>
              );
              if (orderItem.id_product && orderItem.masih_dijual) {
                itemTitleElement = (
                  <Link
                    href={`/products/${orderItem.id_product}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {orderItem.nama_produk}
                  </Link>
                );
              }

              // tampilkan label ukuran hanya kalau produk punya ukuran
              let sizePrefixText = '';
              if (hasSize(orderItem.ukuran)) {
                sizePrefixText = `Size ${orderItem.ukuran} · `;
              }

              const lineSubtotal = Number(orderItem.harga_satuan) * orderItem.jumlah;

              return (
                <div key={orderItem.id_order_item} className="py-4">
                  <div className="flex gap-4">
                    <span className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      {itemThumbElement}
                    </span>
                    <div className="flex-1 min-w-0">
                      {itemTitleElement}
                      <p className="text-xs text-neutral-800 mt-0.5">
                        {sizePrefixText}
                        {orderItem.jumlah} × {formatRupiah(orderItem.harga_satuan)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">
                      {formatRupiah(lineSubtotal)}
                    </p>
                  </div>
                  {reviewSection}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between pt-4 border-t border-neutral-100 text-base font-semibold">
            <span>Total</span>
            <span>{formatRupiah(order.total_harga)}</span>
          </div>
          {reviewHintElement}
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-3">Shipping Address</h3>
          <p className="text-sm text-neutral-700 whitespace-pre-line">
            {order.alamat_pengiriman}
          </p>
          {noteSectionElement}
        </Card>
      </div>
    </div>
  );
}