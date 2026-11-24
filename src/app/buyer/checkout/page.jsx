import Link from 'next/link';
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

// halaman checkout buy now: produk langsung dibeli tanpa masuk ke keranjang
export default async function BuyNowCheckoutPage({ searchParams }) {
  const user = await requireBuyerPage();
  const resolvedSearchParams = await searchParams;

  const productId = toPositiveInt(readParam(resolvedSearchParams, 'product'));
  const sizeName = readParam(resolvedSearchParams, 'size');
  const quantity = toPositiveInt(readParam(resolvedSearchParams, 'qty'));

  let product = null;
  let sizeStock = null;

  if (productId && sizeName !== '' && quantity) {
    // ambil produk dari toko yg aktif beserta stok ukuran yg dipilih
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
    if (resProduct.rows.length > 0) {
      product = resProduct.rows[0];
      if (product.stok_ukuran !== null) {
        sizeStock = product.stok_ukuran;
      }
    }
  }

  if (!product || sizeStock === null) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState
          message="This product is no longer available. Please choose another product."
          actionHref="/products"
          actionLabel="Browse Products"
        />
      </div>
    );
  }

  const productHref = `/products/${product.id_product}`;

  // seller tidak boleh membeli produk tokonya sendiri
  const resOwnStore = await pool.query('SELECT id_store FROM stores WHERE id_user = $1', [user.id_user]);
  if (resOwnStore.rows.length > 0 && resOwnStore.rows[0].id_store === product.id_store) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState
          message="This product belongs to your store, so you can't buy it."
          actionHref="/products"
          actionLabel="Browse Products"
        />
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

  let stockWarning = null;
  if (sizeStock <= 0) {
    stockWarning = 'This size is sold out. Please go back and choose another size.';
  } else if (quantity > sizeStock) {
    stockWarning = `Only ${sizeStock} item(s) left. Please go back and choose a smaller quantity.`;
  }

  let stockWarningElement = null;
  if (stockWarning) {
    stockWarningElement = (
      <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {stockWarning}
      </p>
    );
  }

  let imageElement = (
    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
  );
  if (product.gambar) {
    imageElement = <img src={product.gambar} alt={product.nama_produk} className="w-full h-full object-cover" />;
  }

  let sizeText = '';
  if (hasSize(sizeName)) {
    sizeText = `Size ${sizeName} · `;
  }

  const subtotal = Number(product.harga) * quantity;

  return (
    <div>
      <PageHeader
        title="Checkout"
        description="Buy Now — this product goes straight to checkout and is not added to your cart."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-4">
            {product.nama_toko}
          </p>
          <div className="flex gap-4">
            <Link href={productHref} className="w-20 h-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {imageElement}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={productHref} className="text-sm font-medium text-neutral-950 hover:underline line-clamp-2">
                {product.nama_produk}
              </Link>
              <p className="mt-1 text-xs text-neutral-600">
                {sizeText}
                {quantity} × {formatRupiah(product.harga)}
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-950">{formatRupiah(subtotal)}</p>
            </div>
          </div>
          {stockWarningElement}
          <Link
            href={productHref}
            className="mt-5 inline-block text-xs text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
          >
            Change size or quantity
          </Link>
        </Card>

        <Card className="xl:sticky xl:top-40">
          <h3 className="text-base font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-950">
              <span>Items</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between text-neutral-950">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-neutral-100 text-base font-semibold">
              <span>Total</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
          </div>

          <CheckoutForm
            addresses={addresses}
            user={user}
            buyNow={{ productId: product.id_product, size: sizeName, qty: quantity }}
            disabled={Boolean(stockWarning)}
          />
        </Card>
      </div>
    </div>
  );
}