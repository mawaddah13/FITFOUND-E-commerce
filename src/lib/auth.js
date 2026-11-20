import { cache } from 'react';
import pool from './db';
import { getSession, hasSessionCookie } from './session';
import { redirect } from 'next/navigation';


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

export async function liftExpiredSuspensions() {
  await pool.query(
    `UPDATE users
     SET status_akun = 'active', alasan_status = NULL, suspend_sampai = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE status_akun = 'suspended'
       AND suspend_sampai IS NOT NULL
       AND suspend_sampai <= CURRENT_TIMESTAMP`
  );
}

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


export function isShopperRole(role) {
  if (role === 'buyer' || role === 'seller') {
    return true;
  } else {
    return false;
  }
}

export async function getShopperUser() {
  const user = await getCurrentUser();
  if (!user || !isShopperRole(user.role)) {
    return null;
  }
  return user;
}

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


async function redirectToLogin() {
  if (await hasSessionCookie()) {
    redirect('/login?expired=1');
  }
  redirect('/login');
}

export async function requireBuyerPage() {
  const user = await getCurrentUser();
  if (!user) {
    await redirectToLogin();
  }
  if (!isShopperRole(user.role)) {
    redirect('/admin/dashboard');
  }
  return user;
}

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