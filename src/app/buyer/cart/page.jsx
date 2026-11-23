import pool from '@/lib/db';
import { requireBuyerPage } from '@/lib/auth';
import CartView from '@/components/CartView';
import { PageHeader, EmptyState } from '@/components/ui';

// tmpilkan isi keranjang, alamat, status toko trs tampilkan halaman keranjang
export default async function CartPage() {
  const user = await requireBuyerPage();

  // ambil semua item di keranjang user, info produk, ukuran, stok per ukuran, n toko
  const resCartItems = await pool.query(
    `SELECT ci.id_cart_item, ci.id_product, ci.ukuran, ci.jumlah,
            p.nama_produk, p.harga, COALESCE(ps.stok, 0) AS stok, p.gambar, s.id_store, s.nama_toko
     FROM carts c
     JOIN cart_items ci ON ci.id_cart = c.id_cart
     JOIN products p ON p.id_product = ci.id_product
     JOIN stores s ON s.id_store = p.id_store
     LEFT JOIN product_sizes ps ON ps.id_product = ci.id_product AND ps.ukuran = ci.ukuran
     WHERE c.id_user = $1
     ORDER BY s.nama_toko ASC, ci.created_at DESC`,
    [user.id_user]
  );
  const items = resCartItems.rows;

  // ambil daftar alamat tersimpan user, alamat utama ditaruh paling atas
  const resAddresses = await pool.query(
    `SELECT id_address, label, nama_penerima, no_hp, alamat_lengkap, kota, kode_pos, is_default
     FROM addresses WHERE id_user = $1
     ORDER BY is_default DESC, created_at DESC`,
    [user.id_user]
  );
  const addresses = resAddresses.rows;

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Shopping Cart" />
        <EmptyState
          message="Your cart is empty."
          actionHref="/products"
          actionLabel="Start Shopping"
        />
      </div>
    );
  }

  // hitung total pcs barang n jumlah toko unik yg ada di keranjang
  let totalItems = 0;
  const storeIds = new Set();
  for (const cartItem of items) {
    totalItems += cartItem.jumlah;
    storeIds.add(cartItem.id_store);
  }

  // cek id toko milik user sendiri biar barang dari toko sendiri tidak bisa dicentang buat checkout
  const resOwnStore = await pool.query(
    'SELECT id_store FROM stores WHERE id_user = $1',
    [user.id_user]
  );
  let ownStoreId = null;
  if (resOwnStore.rows.length > 0) {
    ownStoreId = resOwnStore.rows[0].id_store;
  }

  const cartSummaryDescription = `${totalItems} item(s) from ${storeIds.size} store(s)`;

  return (
    <div>
      <PageHeader title="Shopping Cart" description={cartSummaryDescription} />

      <CartView
        items={items}
        addresses={addresses}
        user={user}
        ownStoreId={ownStoreId}
      />
    </div>
  );
}