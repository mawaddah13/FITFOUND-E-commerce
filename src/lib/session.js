import { cache } from 'react';
import { cookies } from 'next/headers';
import pool from './db';
import { createToken, verifyToken } from './token';

const COOKIE_NAME = 'fitfound_session';


export async function createSession(user) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let storeId = null;
  if (user.storeId) {
    storeId = user.storeId;
  }

  const token = await createToken({
    id: user.id,
    role: user.role,
    status: user.status,
    storeId: storeId,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    path: '/',
  });
}

export function isAccountUsable(user) {
  if (user.status_akun === 'active') {
    return true;
  }
  if (user.status_akun === 'suspended' && user.suspend_sampai) {
    if (new Date(user.suspend_sampai).getTime() <= Date.now()) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}

export async function hasSessionCookie() {
  const cookieStore = await cookies();
  const cookieItem = cookieStore.get(COOKIE_NAME);
  if (!cookieItem || !cookieItem.value) {
    return false;
  } else {
    return true;
  }
}


export const getSession = cache(async function getSession() {
  const cookieStore = await cookies();
  const cookieItem = cookieStore.get(COOKIE_NAME);
  let token = null;
  if (cookieItem) {
    token = cookieItem.value;
  }

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.id) {
    return null;
  }

  try {
    const res = await pool.query(
      'SELECT role, status, status_akun, suspend_sampai FROM users WHERE id_user = $1',
      [payload.id]
    );
    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    if (!isAccountUsable(row) || row.role !== payload.role) {
      return null;
    }

    return Object.assign({}, payload, { status: row.status });
  } catch (error) {
    console.error('Failed to check session:', error.message);
    return null;
  }
});

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}