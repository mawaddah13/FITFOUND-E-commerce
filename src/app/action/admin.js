'use server';

import { revalidatePath } from 'next/cache';
import pool, { withTransaction } from '@/lib/db';
import { getUserWithRole } from '@/lib/auth';
import { getString, isValidEmail, isValidPhone, toPositiveInt } from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { deleteUploadedImage } from '@/lib/upload';

const NOT_ALLOWED = { error: 'Only Admin can do this. Please sign in again.' };
const CATEGORY_GROUPS = ['Main', 'Accessories'];
const SELLER_STATUSES = ['active', 'pending', 'rejected'];
const ACCOUNT_STATUSES = ['active', 'inactive', 'suspended'];
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 72;

// lama suspend: hari minimal 1 tanpa batas maksimal, jam 0–24, menit 0–60
const MIN_SUSPEND_DAYS = 1;
const MAX_SUSPEND_HOURS = 24;
const MAX_SUSPEND_MINUTES = 60;

// ubah isian angka jadi bilangan bulat, null kalau bukan bilangan bulat
function readWholeNumber(formData, fieldName) {
  const rawValue = getString(formData, fieldName);
  if (rawValue === '') {
    return null;
  }
  const number = Number(rawValue);
  if (!Number.isSafeInteger(number)) {
    return null;
  }
  return number;
}

// cek n perbarui status verif penjual oleh admin
async function setSellerStatus(rawUserId, nextStatus) {
  const userId = toPositiveInt(rawUserId);
  const admin = await getUserWithRole('admin');
  if (!admin || !userId) {
    return NOT_ALLOWED;
  }

  const updateResult = await pool.query(
    `UPDATE users SET updated_at = CURRENT_TIMESTAMP, status = $1
     WHERE id_user = $2 AND role = 'seller'
     RETURNING nama`,
    [nextStatus, userId]
  );
  if (updateResult.rowCount === 0) {
    return { error: 'Seller not found.' };
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/products');

  let statusLabel = 'rejected';
  if (nextStatus === 'active') {
    statusLabel = 'approved';
  }

  return { success: `${updateResult.rows[0].nama} has been ${statusLabel}.` };
}

// setujui pengajuan verif akun penjual
export async function approveSellerAction(userId, prevState, formData) {
  return setSellerStatus(userId, 'active');
}

// tolak pengajuan verif akun penjual
export async function rejectSellerAction(userId, prevState, formData) {
  return setSellerStatus(userId, 'rejected');
}

// cek data profil, email, status akun, n sandi trs perbarui akun pengguna oleh admin
export async function updateUserAction(rawUserId, prevState, formData) {
  const userId = toPositiveInt(rawUserId);
  const admin = await getUserWithRole('admin');
  if (!admin || !userId) {
    return NOT_ALLOWED;
  }

  const fullName = getString(formData, 'nama');
  const emailAddress = getString(formData, 'email').toLowerCase();
  const phoneNumber = getString(formData, 'no_hp');
  const addressText = getString(formData, 'alamat');
  const accountStatus = getString(formData, 'status_akun');
  const statusReason = getString(formData, 'alasan_status');
  const sellerVerification = getString(formData, 'status');
  const storeName = getString(formData, 'nama_toko');
  const storeDescription = getString(formData, 'deskripsi_toko');
  const suspendDays = readWholeNumber(formData, 'suspend_hari');
  const suspendHours = readWholeNumber(formData, 'suspend_jam');
  const suspendMinutes = readWholeNumber(formData, 'suspend_menit');

  const rawNewPassword = formData.get('new_password');
  let newPassword = '';
  if (rawNewPassword !== null && rawNewPassword !== undefined) {
    newPassword = rawNewPassword.toString();
  }

  const rawConfirmPassword = formData.get('confirm_password');
  let confirmPassword = '';
  if (rawConfirmPassword !== null && rawConfirmPassword !== undefined) {
    confirmPassword = rawConfirmPassword.toString();
  }

  const targetResult = await pool.query(
    `SELECT u.id_user, u.email, u.role, u.status, u.status_akun, s.id_store,
            (u.status_akun = 'suspended' AND u.suspend_sampai IS NOT NULL
              AND u.suspend_sampai > CURRENT_TIMESTAMP) AS suspend_locked
     FROM users u
     LEFT JOIN stores s ON s.id_user = u.id_user
     WHERE u.id_user = $1`,
    [userId]
  );
  if (targetResult.rows.length === 0) {
    return { error: 'User not found.' };
  }

  const targetUser = targetResult.rows[0];
  const isTargetSeller = targetUser.role === 'seller';
  const isSelfAccount = targetUser.id_user === admin.id_user;

  if (fullName.length < 3 || fullName.length > 100) {
    return { error: 'Full name must be 3–100 characters.' };
  }

  if (emailAddress === '' || !isValidEmail(emailAddress)) {
    return { error: 'Please enter a valid email address.' };
  }

  const emailDuplicateCheck = await pool.query(
    'SELECT id_user FROM users WHERE email = $1 AND id_user <> $2',
    [emailAddress, userId]
  );
  if (emailDuplicateCheck.rows.length > 0) {
    return { error: 'This email is already used by another account.' };
  }

  if (phoneNumber !== '' && !isValidPhone(phoneNumber)) {
    return { error: 'Phone number must be 8–20 digits.' };
  }

  if (addressText.length > 500) {
    return { error: 'Address is too long (max 500 characters).' };
  }

  if (!ACCOUNT_STATUSES.includes(accountStatus)) {
    return { error: 'Please choose a valid account status.' };
  }

  // suspend yg masih berjalan tidak bisa dicabut atau diubah sebelum waktunya habis
  const isSuspendLocked = targetUser.suspend_locked;
  if (isSuspendLocked && accountStatus !== 'suspended') {
    return {
      error: 'This suspension has a fixed end time and cannot be lifted early. It ends automatically.',
    };
  }

  if (accountStatus === 'suspended' && !isSuspendLocked) {
    if (suspendDays === null || suspendHours === null || suspendMinutes === null) {
      return { error: 'Please enter the suspension length (days, hours, and minutes) as integers.' };
    }
    if (suspendDays < MIN_SUSPEND_DAYS) {
      return { error: `Suspension must be at least ${MIN_SUSPEND_DAYS} day.` };
    }
    if (suspendHours < 0 || suspendHours > MAX_SUSPEND_HOURS) {
      return { error: `Hours must be between 0 and ${MAX_SUSPEND_HOURS}.` };
    }
    if (suspendMinutes < 0 || suspendMinutes > MAX_SUSPEND_MINUTES) {
      return { error: `Minutes must be between 0 and ${MAX_SUSPEND_MINUTES}.` };
    }
  }

  if (accountStatus !== 'active' && !isSuspendLocked) {
    if (statusReason.length < 5 || statusReason.length > 500) {
      return {
        error:
          'Please write the reason (5–500 characters). The user will see it when they try to sign in.',
      };
    }
  }

  if (isTargetSeller) {
    if (!SELLER_STATUSES.includes(sellerVerification)) {
      return { error: 'Please choose a seller verification status.' };
    }
    if (storeName.length < 3 || storeName.length > 120) {
      return { error: 'Store name must be 3–120 characters.' };
    }
    if (storeDescription.length > 1000) {
      return { error: 'Store description must be at most 1000 characters.' };
    }
  }

  if (newPassword !== '' || confirmPassword !== '') {
    if (newPassword.length < MIN_PASSWORD || newPassword.length > MAX_PASSWORD) {
      return {
        error: `New password must be ${MIN_PASSWORD}–${MAX_PASSWORD} characters.`,
      };
    }
    if (newPassword !== confirmPassword) {
      return { error: 'New password and confirmation do not match.' };
    }
  }

  if (isSelfAccount && accountStatus !== 'active') {
    return {
      error: 'You cannot deactivate your own account. Ask another admin to do it.',
    };
  }

  const wasActiveAdmin = targetUser.role === 'admin' && targetUser.status_akun === 'active';
  const staysActiveAdmin = targetUser.role === 'admin' && accountStatus === 'active';
  if (wasActiveAdmin && !staysActiveAdmin) {
    const activeAdminCountResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users
       WHERE role = 'admin' AND status_akun = 'active' AND id_user <> $1`,
      [userId]
    );
    if (activeAdminCountResult.rows[0].total === 0) {
      return {
        error: 'This is the only active admin, so its status cannot be changed.',
      };
    }
  }

  let nextVerificationStatus = 'active';
  if (isTargetSeller) {
    nextVerificationStatus = sellerVerification;
  }
  // seller yg sudah di-approve / reject verifnya tidak bisa diubah lagi dari sini, cukup status akunnya
  if (targetUser.role === 'seller' && targetUser.status !== 'pending') {
    nextVerificationStatus = targetUser.status;
  }

  let passwordHashValue = null;
  if (newPassword !== '') {
    passwordHashValue = await hashPassword(newPassword);
  }

  const accountStatusChanged = accountStatus !== targetUser.status_akun;

  let phoneValue = null;
  if (phoneNumber) {
    phoneValue = phoneNumber;
  }

  let addressValue = null;
  if (addressText) {
    addressValue = addressText;
  }

  let reasonValue = null;
  if (accountStatus !== 'active') {
    reasonValue = statusReason;
  }

  let storeDescriptionValue = null;
  if (storeDescription) {
    storeDescriptionValue = storeDescription;
  }

  // lama suspend hanya diisi kalau statusnya suspended
  let durationDays = null;
  let durationHours = null;
  let durationMinutes = null;
  if (accountStatus === 'suspended') {
    durationDays = suspendDays;
    durationHours = suspendHours;
    durationMinutes = suspendMinutes;
  }

  try {
    await withTransaction(async function persistUserUpdates(dbClient) {
      await dbClient.query(
        `UPDATE users
         SET updated_at = CURRENT_TIMESTAMP,
             nama = $1,
             email = $2,
             no_hp = $3,
             alamat = $4,
             status = $5
         WHERE id_user = $6`,
        [
          fullName,
          emailAddress,
          phoneValue,
          addressValue,
          nextVerificationStatus,
          userId,
        ]
      );

      // status akun tidak diubah selama suspend masih berjalan
      if (!isSuspendLocked) {
        await dbClient.query(
          `UPDATE users
           SET status_akun = $1,
               alasan_status = $2,
               suspend_sampai = CASE
                 WHEN $3::int IS NULL THEN NULL
                 ELSE CURRENT_TIMESTAMP + make_interval(days => $3::int, hours => $4::int, mins => $5::int)
               END
           WHERE id_user = $6`,
          [accountStatus, reasonValue, durationDays, durationHours, durationMinutes, userId]
        );
      }

      if (passwordHashValue) {
        await dbClient.query('UPDATE users SET password_hash = $1 WHERE id_user = $2', [
          passwordHashValue,
          userId,
        ]);
      }

      if (isTargetSeller) {
        if (targetUser.id_store) {
          await dbClient.query(
            'UPDATE stores SET updated_at = CURRENT_TIMESTAMP, nama_toko = $1, deskripsi_toko = $2 WHERE id_store = $3',
            [storeName, storeDescriptionValue, targetUser.id_store]
          );
        } else {
          await dbClient.query(
            'INSERT INTO stores (id_user, nama_toko, deskripsi_toko) VALUES ($1, $2, $3)',
            [userId, storeName, storeDescriptionValue]
          );
        }
      }

      if (targetUser.role === 'buyer' || targetUser.role === 'seller') {
        await dbClient.query(
          'INSERT INTO carts (id_user) VALUES ($1) ON CONFLICT (id_user) DO NOTHING',
          [userId]
        );
      }
    });
  } catch (error) {
    // angka hari terlalu besar sampai melewati batas tanggal database
    if (error && (error.code === '22008' || error.code === '22003')) {
      return { error: 'The suspension length is too long. Please enter a smaller number of days.' };
    }
    throw error;
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');

  let successMessage = `User ${fullName} has been updated.`;
  if (passwordHashValue) {
    successMessage +=
      ' The new password is active — share it with the user and ask them to change it after signing in.';
  }
  if (accountStatusChanged && accountStatus !== 'active') {
    successMessage +=
      ' The account status is updated and the user will be signed out right away.';
  }

  return { success: successMessage };
}

// cek keamanan akun lalu hapus data pengguna dari sistem
export async function deleteUserAction(rawUserId, prevState, formData) {
  const userId = toPositiveInt(rawUserId);
  const admin = await getUserWithRole('admin');
  if (!admin || !userId) {
    return NOT_ALLOWED;
  }

  if (userId === admin.id_user) {
    return { error: 'You cannot delete your own account.' };
  }

  const deleteResult = await pool.query(
    'DELETE FROM users WHERE id_user = $1 RETURNING nama',
    [userId]
  );
  if (deleteResult.rowCount === 0) {
    return { error: 'User not found.' };
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/products');
  return { success: `User ${deleteResult.rows[0].nama} has been deleted.` };
}

// cek n ambil nama serta grup kategori dari formulir admin
function readCategoryForm(formData) {
  const categoryName = getString(formData, 'nama_kategori');
  const rawGroup = getString(formData, 'grup_kategori');

  let categoryGroup = 'Main';
  if (rawGroup) {
    categoryGroup = rawGroup;
  }

  if (categoryName === '') {
    return { error: 'Category name is required.' };
  }

  if (categoryName.length < 2 || categoryName.length > 100) {
    return { error: 'Category name must be 2–100 characters.' };
  }

  if (!CATEGORY_GROUPS.includes(categoryGroup)) {
    return { error: 'Invalid category group.' };
  }

  return {
    nama: categoryName,
    grup: categoryGroup,
  };
}

// cek input trs tambahkan kategori baru oleh admin
export async function createCategoryAction(prevState, formData) {
  const admin = await getUserWithRole('admin');
  if (!admin) {
    return NOT_ALLOWED;
  }

  const formResult = readCategoryForm(formData);
  if (formResult.error) {
    return { error: formResult.error };
  }

  try {
    await pool.query(
      'INSERT INTO categories (nama_kategori, grup_kategori) VALUES ($1, $2)',
      [formResult.nama, formResult.grup]
    );
  } catch (error) {
    if (error && error.code === '23505') {
      return { error: `Category "${formResult.nama}" already exists.` };
    }
    throw error;
  }

  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { success: `Category "${formResult.nama}" created.` };
}

// cek input trs perbarui data kategori oleh admin
export async function updateCategoryAction(rawCategoryId, prevState, formData) {
  const categoryId = toPositiveInt(rawCategoryId);
  const admin = await getUserWithRole('admin');
  if (!admin || !categoryId) {
    return NOT_ALLOWED;
  }

  const formResult = readCategoryForm(formData);
  if (formResult.error) {
    return { error: formResult.error };
  }

  try {
    const updateResult = await pool.query(
      'UPDATE categories SET updated_at = CURRENT_TIMESTAMP, nama_kategori = $1, grup_kategori = $2 WHERE id_category = $3',
      [formResult.nama, formResult.grup, categoryId]
    );
    if (updateResult.rowCount === 0) {
      return { error: 'Category not found.' };
    }
  } catch (error) {
    if (error && error.code === '23505') {
      return { error: `Category "${formResult.nama}" already exists.` };
    }
    throw error;
  }

  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { success: 'Category updated.' };
}

// pastikan ndada produk yg masih pake kategori ini, baru hapus kategorinya
export async function deleteCategoryAction(rawCategoryId, prevState, formData) {
  const categoryId = toPositiveInt(rawCategoryId);
  const admin = await getUserWithRole('admin');
  if (!admin || !categoryId) {
    return NOT_ALLOWED;
  }

  const usageResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM products WHERE id_category = $1',
    [categoryId]
  );
  const usedProductCount = usageResult.rows[0].total;

  if (usedProductCount > 0) {
    return {
      error: `This category is still used by ${usedProductCount} product(s). Move or delete those products first.`,
    };
  }

  const deleteResult = await pool.query('DELETE FROM categories WHERE id_category = $1', [
    categoryId,
  ]);
  if (deleteResult.rowCount === 0) {
    return { error: 'Category not found.' };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { success: 'Category deleted.' };
}

// hapus produk jg file foto galeri pas diatur sama admin
export async function adminDeleteProductAction(rawProductId, prevState, formData) {
  const productId = toPositiveInt(rawProductId);
  const admin = await getUserWithRole('admin');
  if (!admin || !productId) {
    return NOT_ALLOWED;
  }

  const galleryResult = await pool.query(
    'SELECT gambar FROM product_images WHERE id_product = $1',
    [productId]
  );

  const deleteResult = await pool.query(
    'DELETE FROM products WHERE id_product = $1 RETURNING nama_produk, gambar',
    [productId]
  );
  if (deleteResult.rowCount === 0) {
    return { error: 'Product not found.' };
  }

  const imagePaths = new Set();
  for (const rowItem of galleryResult.rows) {
    if (rowItem.gambar) {
      imagePaths.add(rowItem.gambar);
    }
  }
  if (deleteResult.rows[0].gambar) {
    imagePaths.add(deleteResult.rows[0].gambar);
  }

  for (const imagePath of imagePaths) {
    await deleteUploadedImage(imagePath);
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  return { success: `Product "${deleteResult.rows[0].nama_produk}" has been removed.` };
}