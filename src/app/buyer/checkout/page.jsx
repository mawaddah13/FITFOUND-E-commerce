import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import CheckoutForm from '@/components/CheckoutForm';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { formatRupiah } from '@/lib/format';
import { hasSize } from '@/lib/sizes';
import { toPositiveInt } from '@/lib/validation';
import { activeAccountSql } from '@/lib/products';

// baca nilai parameter url sbg teks
function readParam(params, paramKey) {
  if (params && typeof params[paramKey] === 'string') {
    return params[paramKey].trim();
  }
  return '';
}

// ambil produk buy now (1 produk, langsung dari tabel produk, tidak lewat keranjang)
async function loadBuyNowItem(productId, sizeName, quantity) {
  const resProduct = await pool.query(
    `SELECT p.id_product, p.nama_produk, p.harga, p.gambar, s.id_store, s.nama_toko,
            ps.stok AS stok_ukuran
     FROM products p
     JOIN stores s ON s.id_store = p.id_store
     JOIN users su ON su.id_user = s.id_user
       AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
     LEFT JOIN product_sizes ps ON ps.id_product = p.id_product AND ps.ukuran = $2
     WHERE p.id_product = $1`,
    [productId, sizeName]
  );
  if (resProduct.rows.length === 0 || resProduct.rows[0].stok_ukuran === null) {
    return [];
  }

  const productRow = resProduct.rows[0];
  return [
    {
      key: `buy-${productRow.id_product}`,
      id_product: productRow.id_product,
      nama_produk: productRow.nama_produk,
      harga: productRow.harga,
      gambar: productRow.gambar,
      id_store: productRow.id_store,
      nama_toko: productRow.nama_toko,
      ukuran: sizeName,
      jumlah: quantity,
      stok: productRow.stok_ukuran,
    },
  ];
}

// ambil item keranjang yg dicentang (hanya milik user ini n dari toko yg aktif)
async function loadCartItems(userId, cartItemIds) {
  const resItems = await pool.query(
    `SELECT ci.id_cart_item, ci.id_product, ci.ukuran, ci.jumlah,
            p.nama_produk, p.harga, p.gambar, s.id_store, s.nama_toko,
            COALESCE(ps.stok, 0) AS stok
     FROM carts c
     JOIN cart_items ci ON ci.id_cart = c.id_cart
     JOIN products p ON p.id_product = ci.id_product
     JOIN stores s ON s.id_store = p.id_store
     JOIN users su ON su.id_user = s.id_user
       AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
     LEFT JOIN product_sizes ps ON ps.id_product = ci.id_product AND ps.ukuran = ci.ukuran
     WHERE c.id_user = $1
       AND ci.id_cart_item = ANY($2::int[])
     ORDER BY s.nama_toko ASC, ci.created_at DESC`,
    [userId, cartItemIds]
  );

  const items = [];
  for (const rowItem of resItems.rows) {
    items.push({
      key: `cart-${rowItem.id_cart_item}`,
      id_cart_item: rowItem.id_cart_item,
      id_product: rowItem.id_product,
      nama_produk: rowItem.nama_produk,
      harga: rowItem.harga,
      gambar: rowItem.gambar,
      id_store: rowItem.id_store,
      nama_toko: rowItem.nama_toko,
      ukuran: rowItem.ukuran,
      jumlah: rowItem.jumlah,
      stok: rowItem.stok,
    });
  }
  return items;
}

// halaman konfirmasi pesanan: dari Buy Now atau dari Checkout keranjang, pesanan baru dibuat setelah klik Order Now
export default async function OrderConfirmationPage({ searchParams }) {
  const user = await requireBuyerPage();
  const resolvedSearchParams = await searchParams;

  // ?items=1,2,3 = dari keranjang, ?product=..&size=..&qty=.. = dari Buy Now
  const rawItemIds = readParam(resolvedSearchParams, 'items');
  const isFromCart = rawItemIds !== '';

  let orderItems = [];
  let buyNow = null;
  let selectedIds = [];
  let backHref = '/buyer/cart';
  let backLabel = 'Back to cart';

  if (isFromCart) {
    const idSet = new Set();
    for (const rawId of rawItemIds.split(',')) {
      const parsedId = toPositiveInt(rawId);
      if (parsedId) {
        idSet.add(parsedId);
      }
    }
    selectedIds = Array.from(idSet);
    if (selectedIds.length > 0) {
      orderItems = await loadCartItems(user.id_user, selectedIds);
    }
    if (orderItems.length !== selectedIds.length) {
      orderItems = [];
    }
  } else {
    const productId = toPositiveInt(readParam(resolvedSearchParams, 'product'));
    const sizeName = readParam(resolvedSearchParams, 'size');
    const quantity = toPositiveInt(readParam(resolvedSearchParams, 'qty'));
    if (productId && sizeName !== '' && quantity) {
      orderItems = await loadBuyNowItem(productId, sizeName, quantity);
      buyNow = { productId, size: sizeName, qty: quantity };
      backHref = `/products/${productId}`;
      backLabel = 'Change size or quantity';
    }
  }

  if (orderItems.length === 0) {
    let emptyMessage = 'This product is no longer available. Please choose another product.';
    if (isFromCart) {
      emptyMessage = 'Some selected items are no longer available. Please go back to your cart and choose again.';
    }

    return (
      <div>
        <PageHeader title="Order Confirmation" />
        <EmptyState message={emptyMessage} actionHref={backHref} actionLabel={backLabel} />
      </div>
    );
  }

  const resAddresses = await pool.query(
    `SELECT id_address, label, nama_penerima, no_hp, alamat_lengkap, kota, kode_pos, is_default
     FROM addresses WHERE id_user = $1
     ORDER BY is_default DESC, created_at DESC`,
    [user.id_user]
  );
  const addresses = resAddresses.rows;

  // cek stok tiap item n kelompokkan per toko (1 toko = 1 pesanan)
  const storeGroups = [];
  const warnings = [];
  let totalQty = 0;
  let totalPrice = 0;

  for (const orderItem of orderItems) {
    let sizeLabel = '';
    if (hasSize(orderItem.ukuran)) {
      sizeLabel = ` size ${orderItem.ukuran}`;
    }

    if (orderItem.stok <= 0) {
      warnings.push(`"${orderItem.nama_produk}"${sizeLabel} is sold out.`);
    } else if (orderItem.jumlah > orderItem.stok) {
      warnings.push(`Only ${orderItem.stok} left for "${orderItem.nama_produk}"${sizeLabel}.`);
    }

    totalQty += orderItem.jumlah;
    totalPrice += Number(orderItem.harga) * orderItem.jumlah;

    let matchedGroup = storeGroups.find(function findStoreGroup(groupItem) {
      return groupItem.id_store === orderItem.id_store;
    });
    if (!matchedGroup) {
      matchedGroup = { id_store: orderItem.id_store, nama_toko: orderItem.nama_toko, items: [] };
      storeGroups.push(matchedGroup);
    }
    matchedGroup.items.push(orderItem);
  }

  let warningElement = null;
  if (warnings.length > 0) {
    warningElement = (
      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
        {warnings.map(function buildWarning(warningText) {
          return <p key={warningText}>{warningText}</p>;
        })}
        <Link href={backHref} className="inline-block font-semibold hover:underline underline-offset-4">
          {backLabel}
        </Link>
      </div>
    );
  }

  let pageDescription = 'Check the products, quantity, shipping address, and total before placing your order.';
  if (buyNow) {
    pageDescription += ' Buy Now items are not added to your cart.';
  }

  return (
    <div className="pb-52 lg:pb-0">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 mb-2 text-xs font-medium text-neutral-950 hover:underline underline-offset-4"
      >
        <FiArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        {backLabel}
      </Link>

      <PageHeader title="Order Confirmation" description={pageDescription} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-4">
          {warningElement}

          {storeGroups.map(function buildStoreCard(groupItem) {
            return (
              <Card key={groupItem.id_store}>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-4">
                  {groupItem.nama_toko}
                </p>
                <div className="divide-y divide-neutral-100">
                  {groupItem.items.map(function buildItemRow(orderItem) {
                    const productHref = `/products/${orderItem.id_product}`;

                    let imageElement = (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                        No Image
                      </div>
                    );
                    if (orderItem.gambar) {
                      imageElement = (
                        <img src={orderItem.gambar} alt={orderItem.nama_produk} className="w-full h-full object-cover" />
                      );
                    }

                    let sizeText = '';
                    if (hasSize(orderItem.ukuran)) {
                      sizeText = `Size ${orderItem.ukuran} · `;
                    }

                    return (
                      <div key={orderItem.key} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                        <Link href={productHref} className="w-16 h-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {imageElement}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={productHref}
                            className="text-sm font-medium text-neutral-950 hover:underline underline-offset-4 line-clamp-2"
                          >
                            {orderItem.nama_produk}
                          </Link>
                          <p className="mt-1 text-xs text-neutral-800">
                            {sizeText}
                            {orderItem.jumlah} × {formatRupiah(orderItem.harga)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-neutral-950">
                          {formatRupiah(Number(orderItem.harga) * orderItem.jumlah)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="lg:sticky lg:top-28">
          <h3 className="text-base font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-950">
              <span>Items</span>
              <span>{totalQty}</span>
            </div>
            <div className="flex justify-between text-neutral-950">
              <span>Stores (orders)</span>
              <span>{storeGroups.length}</span>
            </div>
            <div className="flex justify-between text-neutral-950">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-neutral-100 text-base font-semibold">
              <span>Total Payment</span>
              <span>{formatRupiah(totalPrice)}</span>
            </div>
          </div>

          <CheckoutForm
            addresses={addresses}
            user={user}
            selectedIds={selectedIds}
            buyNow={buyNow}
            totalText={formatRupiah(totalPrice)}
            itemCount={totalQty}
            storeCount={storeGroups.length}
            disabled={warnings.length > 0}
          />
        </Card>
      </div>
    </div>
  );
}