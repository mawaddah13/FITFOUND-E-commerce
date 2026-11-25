'use server';

import pool, { withTransaction } from '@/lib/db';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/password';
import { liftExpiredSuspensions } from '@/lib/auth';
import { getString, isValidEmail } from '@/lib/validation';
import { redirect } from 'next/navigation';

function formatAuthError(error) {
  if (!error) {
    return 'Unknown error occurred.';
  }

  if (error.code === '23505') {
    return 'Email is already registered.';
  }

  if (error.code === '42703') {
    return `Database column mismatch: ${error.message}`;
  }

  if (error.code === '42P01') {
    return `Database table missing: ${error.message}`;
  }

  if (error.code === '23502') {
    return `Required column cannot be empty: ${error.column || error.message}`;
  }

  if (error.code === '3D000') {
    return 'Database "fitfound" does not exist in PostgreSQL.';
  }

  if (error.code === '28P01') {
    return 'PostgreSQL password authentication failed. Check your .env file.';
  }

  if (error.code === 'ECONNREFUSED') {
    return 'Cannot connect to PostgreSQL. Make sure PostgreSQL service is running.';
  }

  if (error.message && error.message.includes('client password must be a string')) {
    return 'Database password not found in .env. Check DATABASE_URL or DB_PASSWORD.';
  }

  if (error.message) {
    return `Error: ${error.message}`;
  }

  return 'Failed to process request. Please check terminal logs.';
}

function safeNextPath(value) {
  if (value && value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }
  return '';
}

export async function loginAction(prevState, formData) {
  const email = getString(formData, 'email').toLowerCase();
  const password = formData.get('password')?.toString() || '';
  const nextPath = safeNextPath(getString(formData, 'next'));

  if (email === '' || password === '') {
    return { error: 'Email and password are required.', email };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address.', email };
  }

  let destination = '/';

  try {
    await liftExpiredSuspensions();

    const res = await pool.query(
      `SELECT u.id_user, u.nama, u.email, u.password_hash, u.role, u.status,
              u.status_akun, u.alasan_status, u.suspend_sampai, s.id_store
       FROM users u
       LEFT JOIN stores s ON s.id_user = u.id_user
       WHERE u.email = $1`,
      [email]
    );

    if (res.rows.length === 0) {
      return { error: 'Invalid email or password.', email };
    }

    const user = res.rows[0];
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return { error: 'Invalid email or password.', email };
    }

    if (user.status_akun === 'suspended' || user.status_akun === 'inactive') {
      let suspendUntil = null;
      if (user.suspend_sampai) {
        suspendUntil = new Date(user.suspend_sampai).toISOString();
      }

      return {
        email,
        blocked: {
          type: user.status_akun,
          reason: user.alasan_status || '',
          until: suspendUntil,
        },
      };
    }

    await createSession({
      id: user.id_user,
      role: user.role,
      status: user.status,
      storeId: user.id_store || null,
    });

    if (user.role === 'admin') {
      destination = '/admin/dashboard';
    } else if (user.role === 'seller') {
      if (user.status === 'active') {
        destination = '/seller/dashboard';
      } else {
        destination = '/seller/pending';
      }
    } else if (nextPath.startsWith('/buyer') || nextPath.startsWith('/products') || nextPath === '/') {
      destination = nextPath;
    } else {
      destination = '/';
    }
  } catch (error) {
    console.error('Login error:', error);
    return { error: formatAuthError(error), email };
  }

  redirect(destination);
}

export async function registerAction(prevState, formData) {
  const role = getString(formData, 'role') || 'buyer';
  const nama = getString(formData, 'nama');
  const namaToko = getString(formData, 'nama_toko');
  const email = getString(formData, 'email').toLowerCase();
  const password = formData.get('password')?.toString() || '';

  // no hp n alamat tidak diminta saat daftar, diisi nanti di profil (buyer saat order, seller sebelum jualan)
  const values = { role, nama, nama_toko: namaToko, email };

  if (nama === '' || email === '' || password === '') {
    return { error: 'Full name, email, and password are required.', values };
  }

  if (role !== 'buyer' && role !== 'seller') {
    return { error: 'Invalid role selected.', values };
  }

  if (nama.length < 3 || nama.length > 100) {
    return { error: 'Full name must be 3–100 characters.', values };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address.', values };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.', values };
  }

  if (role === 'seller' && namaToko === '') {
    return { error: 'Store name is required for Seller registration.', values };
  }

  try {
    const checkEmail = await pool.query(
      'SELECT id_user FROM users WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return { error: 'Email is already registered.', values };
    }

    let initialStatus = 'active';
    if (role === 'seller') {
      initialStatus = 'pending';
    }

    const passwordHash = await hashPassword(password);

    const newUser = await withTransaction(async (client) => {
      const insertUser = await client.query(
        `INSERT INTO users (nama, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_user, role, status`,
        [nama, email, passwordHash, role, initialStatus]
      );
      const created = insertUser.rows[0];

      await client.query('INSERT INTO carts (id_user) VALUES ($1)', [created.id_user]);

      if (role === 'seller') {
        const storeRes = await client.query(
          'INSERT INTO stores (id_user, nama_toko) VALUES ($1, $2) RETURNING id_store',
          [created.id_user, namaToko]
        );
        created.id_store = storeRes.rows[0].id_store;
      }
      return created;
    });

    await createSession({
      id: newUser.id_user,
      role: newUser.role,
      status: newUser.status,
      storeId: newUser.id_store || null,
    });
  } catch (error) {
    console.error('Register error:', error);
    return { error: formatAuthError(error), values };
  }

  if (role === 'seller') {
    redirect('/seller/pending');
  } else {
    redirect('/');
  }
}

// habis logout kembali ke landing page (Home), bukan ke halaman login
export async function logoutAction() {
  await deleteSession();
  redirect('/');
}

export async function deleteRejectedAccountAction() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const res = await pool.query(
    'SELECT id_user, role, status FROM users WHERE id_user = $1',
    [session.id]
  );
  const user = res.rows[0];

  if (!user || user.role !== 'seller' || user.status !== 'rejected') {
    return { error: 'Only rejected seller accounts can be deleted from this page.' };
  }

  await pool.query('DELETE FROM users WHERE id_user = $1', [user.id_user]);
  await deleteSession();
  redirect('/register');
}