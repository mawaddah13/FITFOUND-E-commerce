'use server';

import pool, { withTransaction } from '@/lib/db';
import { createSession, deleteSession, getSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/password';
import { liftExpiredSuspensions } from '@/lib/auth';
import { getString, isValidEmail, isValidPhone } from '@/lib/validation';
import {
  hasUploadedFile,
  validateImageFile,
  saveImageFile,
  deleteUploadedImage,
} from '@/lib/upload';
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

// cek data pendaftaran seller per tahap, kembalikan error + nomor tahapnya
function checkSellerRegistration(fields, ktpFile, faceFile) {
  // tahap 1: informasi pribadi
  if (!isValidPhone(fields.noHp)) {
    return { error: 'Please enter a valid phone number (8–20 characters, numbers only).', step: 1 };
  }

  // tahap 2: informasi toko
  if (fields.namaToko.length < 3 || fields.namaToko.length > 120) {
    return { error: 'Store name must be 3–120 characters.', step: 2 };
  }
  if (fields.alamat.length < 10) {
    return { error: 'Please enter the full store address (street, city, postal code).', step: 2 };
  }
  if (fields.deskripsiToko.length > 500) {
    return { error: 'Store description must be 500 characters or less.', step: 2 };
  }

  // tahap 3: verifikasi n keamanan
  if (!hasUploadedFile(ktpFile)) {
    return { error: 'Please upload a photo of your ID card (KTP).', step: 3 };
  }
  if (!hasUploadedFile(faceFile)) {
    return { error: 'Please upload a selfie holding your ID card.', step: 3 };
  }
  const ktpError = validateImageFile(ktpFile);
  if (ktpError) {
    return { error: `ID card photo: ${ktpError}`, step: 3 };
  }
  const faceError = validateImageFile(faceFile);
  if (faceError) {
    return { error: `Selfie photo: ${faceError}`, step: 3 };
  }
  if (fields.password !== fields.konfirmasiPassword) {
    return { error: 'Password confirmation does not match.', step: 3 };
  }
  return null;
}

export async function registerAction(prevState, formData) {
  const role = getString(formData, 'role') || 'buyer';
  const nama = getString(formData, 'nama');
  const namaToko = getString(formData, 'nama_toko');
  const email = getString(formData, 'email').toLowerCase();
  const password = formData.get('password')?.toString() || '';

  // buyer: no hp n alamat diisi nanti di profil. seller: diisi lengkap waktu daftar (3 tahap)
  const noHp = getString(formData, 'no_hp');
  const alamat = getString(formData, 'alamat');
  const deskripsiToko = getString(formData, 'deskripsi_toko');
  const konfirmasiPassword = formData.get('konfirmasi_password')?.toString() || '';
  const ktpFile = formData.get('foto_ktp');
  const faceFile = formData.get('foto_wajah');

  const values = { role, nama, nama_toko: namaToko, email, no_hp: noHp, alamat, deskripsi_toko: deskripsiToko };

  if (nama === '' || email === '' || password === '') {
    return { error: 'Full name, email, and password are required.', values, step: 1 };
  }

  if (role !== 'buyer' && role !== 'seller') {
    return { error: 'Invalid role selected.', values, step: 1 };
  }

  if (nama.length < 3 || nama.length > 100) {
    return { error: 'Full name must be 3–100 characters.', values, step: 1 };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address.', values, step: 1 };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.', values, step: 3 };
  }

  if (role === 'seller') {
    const sellerError = checkSellerRegistration(
      { noHp, namaToko, alamat, deskripsiToko, password, konfirmasiPassword },
      ktpFile,
      faceFile
    );
    if (sellerError) {
      return { ...sellerError, values };
    }
  }

  const savedPhotos = [];
  try {
    const checkEmail = await pool.query(
      'SELECT id_user FROM users WHERE email = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return { error: 'Email is already registered.', values, step: 1 };
    }

    let initialStatus = 'active';
    let ktpFileName = null;
    let faceFileName = null;
    if (role === 'seller') {
      initialStatus = 'pending';
      ktpFileName = await saveImageFile(ktpFile, 'verifications');
      savedPhotos.push(ktpFileName);
      faceFileName = await saveImageFile(faceFile, 'verifications');
      savedPhotos.push(faceFileName);
    }

    const passwordHash = await hashPassword(password);

    let phoneValue = null;
    let addressValue = null;
    if (role === 'seller') {
      phoneValue = noHp;
      addressValue = alamat;
    }

    const newUser = await withTransaction(async (client) => {
      const insertUser = await client.query(
        `INSERT INTO users (nama, email, password_hash, role, status, no_hp, alamat)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_user, role, status`,
        [nama, email, passwordHash, role, initialStatus, phoneValue, addressValue]
      );
      const created = insertUser.rows[0];

      await client.query('INSERT INTO carts (id_user) VALUES ($1)', [created.id_user]);

      if (role === 'seller') {
        let descriptionValue = null;
        if (deskripsiToko) {
          descriptionValue = deskripsiToko;
        }
        const storeRes = await client.query(
          `INSERT INTO stores (id_user, nama_toko, deskripsi_toko, foto_ktp, foto_wajah, persetujuan_dilihat)
           VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id_store`,
          [created.id_user, namaToko, descriptionValue, ktpFileName, faceFileName]
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
    // daftar gagal: hapus lagi foto verifikasi yg sempat tersimpan
    for (const photoName of savedPhotos) {
      await deleteUploadedImage(photoName);
    }
    return { error: formatAuthError(error), values, step: 1 };
  }

  if (role === 'seller') {
    redirect('/seller/pending');
  } else {
    redirect('/');
  }
}

// habis logout langsung ke halaman login
export async function logoutAction() {
  await deleteSession();
  redirect('/login');
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

  // foto ktp n wajah ikut dihapus dari folder uploads
  const photoResult = await pool.query(
    'SELECT foto_ktp, foto_wajah FROM stores WHERE id_user = $1',
    [user.id_user]
  );

  await pool.query('DELETE FROM users WHERE id_user = $1', [user.id_user]);

  if (photoResult.rows.length > 0) {
    await deleteUploadedImage(photoResult.rows[0].foto_ktp);
    await deleteUploadedImage(photoResult.rows[0].foto_wajah);
  }

  await deleteSession();
  redirect('/register');
}
// seller pencet "Continue as Seller" di pop up toko disetujui, trs masuk ke seller center
export async function continueAsSellerAction() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const res = await pool.query(
    `SELECT u.id_user, u.role, u.status, s.id_store
     FROM users u
     LEFT JOIN stores s ON s.id_user = u.id_user
     WHERE u.id_user = $1`,
    [session.id]
  );
  const user = res.rows[0];
  if (!user || user.role !== 'seller' || user.status !== 'active' || !user.id_store) {
    redirect('/seller/pending');
  }

  await pool.query('UPDATE stores SET persetujuan_dilihat = TRUE WHERE id_user = $1', [user.id_user]);

  // perbarui sesi biar statusnya ikut jadi active (link Seller Center di navbar muncul)
  await createSession({
    id: user.id_user,
    role: user.role,
    status: user.status,
    storeId: user.id_store,
  });

  redirect('/seller/dashboard');
}