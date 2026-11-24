import { cache } from 'react';
import pool from './db';
import { getSession, hasSessionCookie } from './session';
import { redirect } from 'next/navigation';

// ambil data profil lengkap user yang sedang login dari database
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getSession();
  if (!session || !session.id) {
    return null;
  }

  const res = await pool.query(
    `SELECT id_user, nama, email, no_hp, alamat, role, status, status_akun, created_at
     FROM users
     WHERE id_user = $1`,
    [session.id]
  );

  if (res.rows.length === 0) {
    return null;
  }
  return res.rows[0];
});

// aktifkan kembali akun yang masa suspendny sudah selesai
export async function liftExpiredSuspensions() {
  await pool.query(
    `UPDATE users
     SET status_akun = 'active', alasan_status = NULL, suspend_sampai = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE status_akun = 'suspended'
       AND suspend_sampai IS NOT NULL
       AND suspend_sampai <= CURRENT_TIMESTAMP`
  );
}

// ambil data toko punya user brdsrkn id user
export const getStoreByUserId = cache(async function getStoreByUserId(idUser) {
  const res = await pool.query(
    `SELECT id_store, id_user, nama_toko, deskripsi_toko, gambar_toko, created_at
     FROM stores
     WHERE id_user = $1`,
    [idUser]
  );
  if (res.rows.length === 0) {
    return null;
  }
  return res.rows[0];
});

// periksa apakah role termasuk shopper yaitu buyer atau seller
export function isShopperRole(role) {
  if (role === 'buyer' || role === 'seller') {
    return true;
  } else {
    return false;
  }
}

// ambil data user kalau sedang login sebagai buyer (dipakai keranjang n checkout)
export async function getBuyerUser() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'buyer') {
    return null;
  }
  return user;
}

// ambil data user kalau sedang login n memiliki role buyer atau seller
export async function getShopperUser() {
  const user = await getCurrentUser();
  if (!user || !isShopperRole(user.role)) {
    return null;
  }
  return user;
}

// ambil data user kalau sesuai role tertentu dan status akunnya aktif
export async function getUserWithRole(role) {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    return null;
  }
  if (user.status !== 'active') {
    return null;
  }
  return user;
}

// ambil data seller aktif beserta tokonya jika sudah tersedia
export async function getActiveSeller() {
  const user = await getUserWithRole('seller');
  if (!user) {
    return null;
  }
  const store = await getStoreByUserId(user.id_user);
  if (!store) {
    return null;
  }
  return { user, store };
}

// arahkan ke halaman login dengan tanda expired jika cookie sesi masih ada
async function redirectToLogin() {
  if (await hasSessionCookie()) {
    redirect('/login?expired=1');
  }
  redirect('/login');
}

// harus akses halaman khusus shopper dan kembalikan data user
export async function requireBuyerPage() {
  const user = await getCurrentUser();
  if (!user) {
    await redirectToLogin();
  }
  // seller tidak bisa belanja, jadi diarahkan ke dashboard seller
  if (user.role === 'seller') {
    redirect('/seller/dashboard');
  }
  if (!isShopperRole(user.role)) {
    redirect('/admin/dashboard');
  }
  return user;
}

// harus akses halaman khusus admin dan kembalikan data user
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    await redirectToLogin();
  }
  if (user.role !== 'admin') {
    redirect('/');
  }
  return user;
}

// harus akses halaman khusus seller aktif yang sudah punya toko
export async function requireSellerPage() {
  const user = await getCurrentUser();
  if (!user) {
    await redirectToLogin();
  }
  if (user.role !== 'seller') {
    redirect('/');
  }
  if (user.status !== 'active') {
    redirect('/seller/pending');
  }
  const store = await getStoreByUserId(user.id_user);
  if (!store) {
    redirect('/seller/pending');
  }
  return { user, store };
}