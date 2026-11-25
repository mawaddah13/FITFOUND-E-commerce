'use server';

import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { getShopperUser } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { getString, isValidEmail, isValidPhone, toPositiveInt } from '@/lib/validation';

const NOT_ALLOWED = { error: 'Your session has expired. Please sign in again.' };
const MAX_SAVED_ADDRESSES = 2;

// cek input trs perbarui data profil pembeli
export async function updateProfileAction(prevState, formData) {
  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const fullName = getString(formData, 'nama');
  const emailAddress = getString(formData, 'email').toLowerCase();
  const phoneNumber = getString(formData, 'no_hp');
  const addressText = getString(formData, 'alamat');

  if (fullName === '' || emailAddress === '' || phoneNumber === '' || addressText === '') {
    return { error: 'Name, email, phone number, and address are required.' };
  }

  if (fullName.length < 3 || fullName.length > 100) {
    return { error: 'Name must be 3–100 characters.' };
  }

  if (!isValidEmail(emailAddress)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!isValidPhone(phoneNumber)) {
    return { error: 'Phone number must be 8–20 digits.' };
  }

  if (addressText.length < 10 || addressText.length > 500) {
    return { error: 'Address must be 10–500 characters.' };
  }

  const emailCheck = await pool.query(
    'SELECT id_user FROM users WHERE email = $1 AND id_user <> $2',
    [emailAddress, user.id_user]
  );
  if (emailCheck.rows.length > 0) {
    return { error: 'This email is already used by another account.' };
  }

  await pool.query(
    'UPDATE users SET updated_at = CURRENT_TIMESTAMP, nama = $1, email = $2, no_hp = $3, alamat = $4 WHERE id_user = $5',
    [fullName, emailAddress, phoneNumber, addressText, user.id_user]
  );

  revalidatePath('/buyer', 'layout');
  revalidatePath('/seller', 'layout');
  return { success: 'Profile updated successfully.' };
}

// cek sandi skrg trs simpan sandi baru pengguna
export async function changePasswordAction(prevState, formData) {
  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const rawCurrentPassword = formData.get('current_password');
  let currentPassword = '';
  if (rawCurrentPassword !== null && rawCurrentPassword !== undefined) {
    currentPassword = rawCurrentPassword.toString();
  }

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

  if (currentPassword === '' || newPassword === '' || confirmPassword === '') {
    return { error: 'All password fields are required.' };
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New password confirmation does not match.' };
  }

  const userPasswordResult = await pool.query(
    'SELECT password_hash FROM users WHERE id_user = $1',
    [user.id_user]
  );
  const isPasswordValid = await verifyPassword(
    currentPassword,
    userPasswordResult.rows[0].password_hash
  );
  if (!isPasswordValid) {
    return { error: 'Current password is incorrect.' };
  }

  const hashedNewPassword = await hashPassword(newPassword);
  await pool.query(
    'UPDATE users SET updated_at = CURRENT_TIMESTAMP, password_hash = $1 WHERE id_user = $2',
    [hashedNewPassword, user.id_user]
  );

  return { success: 'Password changed successfully.' };
}

// baca n cek isian form alamat pengiriman (dipakai tambah n edit alamat)
function readAddressForm(formData) {
  const addressLabel = getString(formData, 'label');
  const recipientName = getString(formData, 'nama_penerima');
  const phoneNumber = getString(formData, 'no_hp');
  const fullAddress = getString(formData, 'alamat_lengkap');
  const cityName = getString(formData, 'kota');
  const postalCode = getString(formData, 'kode_pos');

  if (
    !addressLabel ||
    !recipientName ||
    !phoneNumber ||
    !fullAddress ||
    !cityName ||
    !postalCode
  ) {
    return { error: 'All address fields are required.' };
  }

  if (addressLabel.length > 50) {
    return { error: 'Label must be at most 50 characters.' };
  }

  if (!isValidPhone(phoneNumber)) {
    return { error: 'Phone number must be 8–20 digits.' };
  }

  if (fullAddress.length < 10) {
    return { error: 'Full address must be at least 10 characters.' };
  }

  if (!/^[0-9]{5}$/.test(postalCode)) {
    return { error: 'Postal code must be 5 digits.' };
  }

  return {
    address: { addressLabel, recipientName, phoneNumber, fullAddress, cityName, postalCode },
  };
}

// cek batas alamat tersimpan trs tambahkan alamat pengiriman baru
export async function createAddressAction(prevState, formData) {
  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const setAsDefault = formData.get('is_default') === 'on';
  const addressResult = readAddressForm(formData);
  if (addressResult.error) {
    return { error: addressResult.error };
  }

  const { addressLabel, recipientName, phoneNumber, fullAddress, cityName, postalCode } =
    addressResult.address;

  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM addresses WHERE id_user = $1',
    [user.id_user]
  );
  const totalSavedAddresses = countResult.rows[0].total;

  if (totalSavedAddresses >= MAX_SAVED_ADDRESSES) {
    return {
      error: `You can only save up to ${MAX_SAVED_ADDRESSES} addresses. Delete one first to add a new address.`,
    };
  }

  const isFirstAddress = totalSavedAddresses === 0;
  const shouldBeDefault = setAsDefault || isFirstAddress;

  if (shouldBeDefault) {
    await pool.query(
      'UPDATE addresses SET updated_at = CURRENT_TIMESTAMP, is_default = FALSE WHERE id_user = $1',
      [user.id_user]
    );
  }

  await pool.query(
    `INSERT INTO addresses (id_user, label, nama_penerima, no_hp, alamat_lengkap, kota, kode_pos, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      user.id_user,
      addressLabel,
      recipientName,
      phoneNumber,
      fullAddress,
      cityName,
      postalCode,
      shouldBeDefault,
    ]
  );

  revalidatePath('/buyer/addresses');
  revalidatePath('/buyer/dashboard');
  revalidatePath('/buyer/cart');
  return { success: 'Address added.' };
}

// cek kepemilikan alamat trs simpan perubahan alamat pengiriman yg sudah tersimpan
export async function updateAddressAction(rawAddressId, prevState, formData) {
  const addressId = toPositiveInt(rawAddressId);
  if (!addressId) {
    return { error: 'Address is not valid.' };
  }

  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const addressResult = readAddressForm(formData);
  if (addressResult.error) {
    return { error: addressResult.error };
  }

  const { addressLabel, recipientName, phoneNumber, fullAddress, cityName, postalCode } =
    addressResult.address;

  const updateResult = await pool.query(
    `UPDATE addresses
     SET updated_at = CURRENT_TIMESTAMP, label = $1, nama_penerima = $2, no_hp = $3,
         alamat_lengkap = $4, kota = $5, kode_pos = $6
     WHERE id_address = $7 AND id_user = $8`,
    [addressLabel, recipientName, phoneNumber, fullAddress, cityName, postalCode, addressId, user.id_user]
  );
  if (updateResult.rowCount === 0) {
    return { error: 'Address not found.' };
  }

  revalidatePath('/buyer/addresses');
  revalidatePath('/buyer/dashboard');
  revalidatePath('/buyer/cart');
  return { success: 'Address updated.' };
}

// pastikan salah satu alamat tersimpan jadi alamat default
export async function setDefaultAddressAction(rawAddressId, prevState, formData) {
  const addressId = toPositiveInt(rawAddressId);
  if (!addressId) {
    return { error: 'Address is not valid.' };
  }

  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const addressCheck = await pool.query(
    'SELECT id_address FROM addresses WHERE id_address = $1 AND id_user = $2',
    [addressId, user.id_user]
  );
  if (addressCheck.rows.length === 0) {
    return { error: 'Address not found.' };
  }

  await pool.query(
    'UPDATE addresses SET updated_at = CURRENT_TIMESTAMP, is_default = (id_address = $1) WHERE id_user = $2',
    [addressId, user.id_user]
  );

  revalidatePath('/buyer/addresses');
  revalidatePath('/buyer/dashboard');
  revalidatePath('/buyer/cart');
  return { success: 'Default address updated.' };
}

// hapus alamat tersimpan trs alihkan default kalau alamat default terhapus
export async function deleteAddressAction(rawAddressId, prevState, formData) {
  const addressId = toPositiveInt(rawAddressId);
  if (!addressId) {
    return { error: 'Address is not valid.' };
  }

  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const deleteResult = await pool.query(
    'DELETE FROM addresses WHERE id_address = $1 AND id_user = $2 RETURNING is_default',
    [addressId, user.id_user]
  );
  if (deleteResult.rowCount === 0) {
    return { error: 'Address not found.' };
  }

  if (deleteResult.rows[0].is_default) {
    await pool.query(
      `UPDATE addresses SET updated_at = CURRENT_TIMESTAMP, is_default = TRUE
       WHERE id_address = (
         SELECT id_address FROM addresses WHERE id_user = $1 ORDER BY created_at DESC LIMIT 1
       )`,
      [user.id_user]
    );
  }

  revalidatePath('/buyer/addresses');
  revalidatePath('/buyer/dashboard');
  revalidatePath('/buyer/cart');
  return { success: 'Address deleted.' };
}

// pastikan pesanannya sudah selesai, trs simpan rating n ulasan dari pembeli
export async function submitReviewAction(rawOrderId, rawProductId, prevState, formData) {
  const orderId = toPositiveInt(rawOrderId);
  const productId = toPositiveInt(rawProductId);
  if (!orderId || !productId) {
    return { error: 'Order or product is not valid.' };
  }

  const user = await getShopperUser();
  if (!user) {
    return NOT_ALLOWED;
  }

  const starRating = toPositiveInt(formData.get('rating'));
  const reviewComment = getString(formData, 'komentar');

  if (!starRating || starRating > 5) {
    return { error: 'Please choose a rating between 1 and 5 stars.' };
  }

  if (reviewComment.length < 5) {
    return { error: 'Review must be at least 5 characters.' };
  }

  if (reviewComment.length > 500) {
    return { error: 'Review must be at most 500 characters.' };
  }

  const orderCheck = await pool.query(
    `SELECT o.id_order, o.status_order
     FROM orders o
     JOIN order_items oi ON oi.id_order = o.id_order
     WHERE o.id_order = $1 AND o.id_user = $2 AND oi.id_product = $3`,
    [orderId, user.id_user, productId]
  );
  if (orderCheck.rows.length === 0) {
    return { error: 'Order or product not found.' };
  }

  if (orderCheck.rows[0].status_order !== 'completed') {
    return { error: 'You can only review products from completed orders.' };
  }

  try {
    await pool.query(
      `INSERT INTO reviews (id_user, id_product, id_order, rating, komentar)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id_user, productId, orderId, starRating, reviewComment]
    );
  } catch (error) {
    if (error && error.code === '23505') {
      return { error: 'You have already reviewed this product for this order.' };
    }
    throw error;
  }

  revalidatePath(`/buyer/orders/${orderId}`);
  revalidatePath(`/products/${productId}`);
  return { success: 'Thank you! Your review has been posted.' };
}