'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import pool, { withTransaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { getString } from '@/lib/validation';

// akun buyer minta jadi seller baru dgn status tunggu verif admin
export async function becomeSellerAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'buyer') {
    return { error: 'Only Buyer accounts can apply to become a Seller.' };
  }

  const storeName = getString(formData, 'nama_toko');
  const storeDescription = getString(formData, 'deskripsi_toko');
  const isTermsAgreed = formData.get('agree') === 'on';

  if (storeName === '') {
    return { error: 'Store name is required.' };
  }

  if (storeName.length < 3 || storeName.length > 120) {
    return { error: 'Store name must be 3–120 characters.' };
  }

  if (storeDescription.length > 1000) {
    return { error: 'Store description must be at most 1000 characters.' };
  }

  if (!isTermsAgreed) {
    return { error: 'Please confirm that you agree to the seller terms.' };
  }

  let storeDescriptionValue = null;
  if (storeDescription) {
    storeDescriptionValue = storeDescription;
  }

  let createdStoreId = null;

  try {
    createdStoreId = await withTransaction(async function insertSellerStore(dbClient) {
      const storeResult = await dbClient.query(
        'INSERT INTO stores (id_user, nama_toko, deskripsi_toko) VALUES ($1, $2, $3) RETURNING id_store',
        [user.id_user, storeName, storeDescriptionValue]
      );

      await dbClient.query(
        "UPDATE users SET updated_at = CURRENT_TIMESTAMP, role = 'seller', status = 'pending' WHERE id_user = $1",
        [user.id_user]
      );

      return storeResult.rows[0].id_store;
    });
  } catch (error) {
    if (error && error.code === '23505') {
      return { error: 'You already have a store application.' };
    }
    console.error('Become seller error:', error);
    return { error: 'Could not submit your seller application. Please try again.' };
  }

  await createSession({
    id: user.id_user,
    role: 'seller',
    status: 'pending',
    storeId: createdStoreId,
  });

  revalidatePath('/', 'layout');
  redirect('/seller/pending');
}

// batalkn pendaftaran seller yg masih pending/ditolak biar kmbali jadi buyer
export async function cancelSellerApplicationAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'seller' || user.status === 'active') {
    return { error: 'Only pending or rejected seller applications can be cancelled.' };
  }

  const usageResult = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM products p JOIN stores s ON s.id_store = p.id_store WHERE s.id_user = $1) +
       (SELECT COUNT(*) FROM orders o JOIN stores s ON s.id_store = o.id_store WHERE s.id_user = $1) AS total`,
    [user.id_user]
  );

  let totalUsage = 0;
  if (usageResult.rows[0] && usageResult.rows[0].total !== undefined) {
    totalUsage = Number(usageResult.rows[0].total);
  }

  if (totalUsage > 0) {
    return {
      error: 'This store already has products or orders, so it cannot be cancelled here.',
    };
  }

  await withTransaction(async function revertToBuyerAccount(dbClient) {
    await dbClient.query('DELETE FROM stores WHERE id_user = $1', [user.id_user]);
    await dbClient.query(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP, role = 'buyer', status = 'active' WHERE id_user = $1",
      [user.id_user]
    );
    await dbClient.query(
      'INSERT INTO carts (id_user) VALUES ($1) ON CONFLICT (id_user) DO NOTHING',
      [user.id_user]
    );
  });

  await createSession({
    id: user.id_user,
    role: 'buyer',
    status: 'active',
    storeId: null,
  });

  revalidatePath('/', 'layout');
  redirect('/buyer/dashboard');
}