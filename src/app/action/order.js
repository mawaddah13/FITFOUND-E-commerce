'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { withTransaction } from '@/lib/db';
import { getShopperUser, getActiveSeller } from '@/lib/auth';
import { getString, toPositiveInt, isValidPhone } from '@/lib/validation';
import { SELLER_STATUS_FLOW, ORDER_STATUS } from '@/lib/format';
import { sizeSuffix } from '@/lib/sizes';
import { activeAccountSql } from '@/lib/products';

class CheckoutError extends Error {}

const MAX_SAVED_ADDRESSES = 2;

// cek klngkpn n format isian alamat pengiriman baru
function readTypedAddress(formData) {
  const addressData = {
    nama_penerima: getString(formData, 'nama_penerima'),
    no_hp: getString(formData, 'no_hp'),
    alamat_lengkap: getString(formData, 'alamat_lengkap'),
    kota: getString(formData, 'kota'),
    kode_pos: getString(formData, 'kode_pos'),
  };

  if (
    !addressData.nama_penerima ||
    !addressData.no_hp ||
    !addressData.alamat_lengkap ||
    !addressData.kota ||
    !addressData.kode_pos
  ) {
    return { error: 'Please fill in all shipping address fields.' };
  }

  if (addressData.nama_penerima.length < 3) {
    return { error: 'Recipient name must be at least 3 characters.' };
  }
  
  if (!isValidPhone(addressData.no_hp)) {
    return { error: 'Phone number must be 8–20 digits.' };
  }

  if (addressData.alamat_lengkap.length < 10) {
    return { error: 'Full address must be at least 10 characters.' };
  }

  if (!/^[0-9]{5}$/.test(addressData.kode_pos)) {
    return { error: 'Postal code must be 5 digits.' };
  }

  return { address: addressData };
}

// gabungkan detail alamat jd satu baris
function formatAddress(addr) {
  return `${addr.nama_penerima} (${addr.no_hp}) — ${addr.alamat_lengkap}, ${addr.kota} ${addr.kode_pos}`;
}

// proses checkout item terpilih, buat order pertoko, n kurangi stok
export async function checkoutAction(prevState, formData) {
  const user = await getShopperUser();
  if (!user) {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  let addressMode = 'saved';
  if (getString(formData, 'address_mode') === 'new') {
    addressMode = 'new';
  }

  const noteText = getString(formData, 'catatan');

  let selectedAddressId = null;
  let typedAddress = null;
  let saveTypedAddress = false;

  if (addressMode === 'saved') {
    selectedAddressId = toPositiveInt(formData.get('id_address'));
    if (!selectedAddressId) {
      return { error: 'Please choose one of your saved addresses.' };
    }
  } else {
    const typedResult = readTypedAddress(formData);
    if (typedResult.error) {
      return { error: typedResult.error };
    }
    typedAddress = typedResult.address;
    saveTypedAddress = formData.get('save_address') === 'on';
  }

  if (noteText.length > 300) {
    return { error: 'Order note must be at most 300 characters.' };
  }

  // buy now: produk dikirim langsung dari halaman produk, bukan dari keranjang
  const buyProductId = toPositiveInt(formData.get('buy_product'));
  const isBuyNow = Boolean(buyProductId);
  let buySize = '';
  let buyQty = null;
  if (isBuyNow) {
    buySize = getString(formData, 'buy_size');
    buyQty = toPositiveInt(formData.get('buy_qty'));
    if (buySize === '' || !buyQty) {
      return { error: 'Please choose a size and quantity first.' };
    }
  }

  const rawSelectedIds = formData.getAll('cart_item');
  const uniqueIdSet = new Set();
  for (const rawId of rawSelectedIds) {
    const parsedId = toPositiveInt(rawId);
    if (parsedId) {
      uniqueIdSet.add(parsedId);
    }
  }
  const selectedIds = Array.from(uniqueIdSet);

  if (!isBuyNow && selectedIds.length === 0) {
    return { error: 'Please select at least one item to checkout.' };
  }

  let createdOrders = 0;

  try {
    createdOrders = await withTransaction(async function runCheckoutTransaction(dbClient) {
      let shippingAddress = '';

      if (addressMode === 'saved') {
        const addressResult = await dbClient.query(
          `SELECT nama_penerima, no_hp, alamat_lengkap, kota, kode_pos
           FROM addresses WHERE id_address = $1 AND id_user = $2`,
          [selectedAddressId, user.id_user]
        );

        if (addressResult.rows.length === 0) {
          throw new CheckoutError('Shipping address not found.');
        }

        shippingAddress = formatAddress(addressResult.rows[0]);
      } else {
        shippingAddress = formatAddress(typedAddress);

        if (saveTypedAddress) {
          const countResult = await dbClient.query(
            'SELECT COUNT(*)::int AS total FROM addresses WHERE id_user = $1',
            [user.id_user]
          );
          const savedAddressCount = countResult.rows[0].total;

          if (savedAddressCount >= MAX_SAVED_ADDRESSES) {
            throw new CheckoutError(
              `You can only save up to ${MAX_SAVED_ADDRESSES} addresses. Uncheck "Save this address" or delete one first.`
            );
          }

          let addressLabel = 'Address 2';
          if (savedAddressCount === 0) {
            addressLabel = 'Home';
          }

          const isDefaultAddress = savedAddressCount === 0;

          await dbClient.query(
            `INSERT INTO addresses (id_user, label, nama_penerima, no_hp, alamat_lengkap, kota, kode_pos, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              user.id_user,
              addressLabel,
              typedAddress.nama_penerima,
              typedAddress.no_hp,
              typedAddress.alamat_lengkap,
              typedAddress.kota,
              typedAddress.kode_pos,
              isDefaultAddress,
            ]
          );
        }
      }

      let cartItems = [];

      if (isBuyNow) {
        // ambil 1 produk buy now langsung dari tabel produk, keranjang tidak disentuh
        const buyNowResult = await dbClient.query(
          `SELECT NULL::int AS id_cart_item, p.id_product, $2::varchar AS ukuran, $3::int AS jumlah,
                  p.nama_produk, p.harga, p.gambar,
                  s.id_store, s.nama_toko
           FROM products p
           JOIN stores s ON s.id_store = p.id_store
           JOIN users su ON su.id_user = s.id_user
             AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
           WHERE p.id_product = $1
           FOR UPDATE OF p`,
          [buyProductId, buySize, buyQty]
        );
        cartItems = buyNowResult.rows;

        if (cartItems.length === 0) {
          throw new CheckoutError('This product is no longer available.');
        }
      } else {
        const itemsResult = await dbClient.query(
          `SELECT ci.id_cart_item, ci.id_product, ci.ukuran, ci.jumlah,
                  p.nama_produk, p.harga, p.gambar,
                  s.id_store, s.nama_toko
           FROM carts c
           JOIN cart_items ci ON ci.id_cart = c.id_cart
           JOIN products p ON p.id_product = ci.id_product
           JOIN stores s ON s.id_store = p.id_store
           JOIN users su ON su.id_user = s.id_user
             AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
           WHERE c.id_user = $1
             AND ci.id_cart_item = ANY($2::int[])
           ORDER BY s.id_store
           FOR UPDATE OF p`,
          [user.id_user, selectedIds]
        );
        cartItems = itemsResult.rows;

        if (cartItems.length === 0) {
          throw new CheckoutError('The selected items are no longer in your cart.');
        }

        if (cartItems.length !== selectedIds.length) {
          throw new CheckoutError(
            'Some selected items are no longer available (removed, or the store is inactive). Please untick them and try again.'
          );
        }
      }

      const ownStoreResult = await dbClient.query(
        'SELECT id_store FROM stores WHERE id_user = $1',
        [user.id_user]
      );
      if (ownStoreResult.rows.length > 0) {
        const ownStoreId = ownStoreResult.rows[0].id_store;
        const ownStoreItem = cartItems.find(function findOwnItem(cartItem) {
          return cartItem.id_store === ownStoreId;
        });

        if (ownStoreItem && isBuyNow) {
          throw new CheckoutError('You cannot buy products from your own store.');
        }

        if (ownStoreItem) {
          throw new CheckoutError(
            `"${ownStoreItem.nama_produk}" is from your own store. Please remove it from your cart.`
          );
        }
      }

      const productIdSet = new Set();
      for (const cartItem of cartItems) {
        productIdSet.add(cartItem.id_product);
      }
      const productIds = Array.from(productIdSet);

      const sizeStockResult = await dbClient.query(
        'SELECT id_product, ukuran, stok FROM product_sizes WHERE id_product = ANY($1::int[]) FOR UPDATE',
        [productIds]
      );
      const sizeStockMap = {};
      for (const stockRow of sizeStockResult.rows) {
        sizeStockMap[`${stockRow.id_product}|${stockRow.ukuran}`] = stockRow.stok;
      }

      for (const cartItem of cartItems) {
        let availableStock = 0;
        const keyName = `${cartItem.id_product}|${cartItem.ukuran}`;
        if (sizeStockMap[keyName] !== undefined) {
          availableStock = sizeStockMap[keyName];
        }

        if (availableStock <= 0 && isBuyNow) {
          throw new CheckoutError(
            `"${cartItem.nama_produk}"${sizeSuffix(cartItem.ukuran)} is out of stock.`
          );
        }

        if (availableStock <= 0) {
          throw new CheckoutError(
            `"${cartItem.nama_produk}"${sizeSuffix(cartItem.ukuran)} is out of stock. Please remove it from your cart.`
          );
        }

        if (cartItem.jumlah > availableStock && isBuyNow) {
          throw new CheckoutError(
            `Only ${availableStock} left for "${cartItem.nama_produk}"${sizeSuffix(cartItem.ukuran)}. Please choose a smaller quantity.`
          );
        }

        if (cartItem.jumlah > availableStock) {
          throw new CheckoutError(
            `Only ${availableStock} left for "${cartItem.nama_produk}"${sizeSuffix(cartItem.ukuran)}. Please update your cart.`
          );
        }
      }

      const storeGroups = {};
      for (const cartItem of cartItems) {
        if (!storeGroups[cartItem.id_store]) {
          storeGroups[cartItem.id_store] = {
            nama_toko: cartItem.nama_toko,
            items: [],
            total: 0,
          };
        }
        storeGroups[cartItem.id_store].items.push(cartItem);
        storeGroups[cartItem.id_store].total += Number(cartItem.harga) * cartItem.jumlah;
      }

      let orderCount = 0;
      const storeIds = Object.keys(storeGroups);
      for (const storeId of storeIds) {
        const groupData = storeGroups[storeId];
        let orderNoteValue = null;
        if (noteText) {
          orderNoteValue = noteText;
        }

        const orderResult = await dbClient.query(
          `INSERT INTO orders (id_user, id_store, nama_toko, total_harga, status_order, alamat_pengiriman, catatan)
           VALUES ($1, $2, $3, $4, 'pending', $5, $6)
           RETURNING id_order`,
          [
            user.id_user,
            storeId,
            groupData.nama_toko,
            groupData.total,
            shippingAddress,
            orderNoteValue,
          ]
        );
        const orderId = orderResult.rows[0].id_order;

        for (const groupItem of groupData.items) {
          await dbClient.query(
            `INSERT INTO order_items (id_order, id_product, nama_produk, gambar, ukuran, jumlah, harga_satuan)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              orderId,
              groupItem.id_product,
              groupItem.nama_produk,
              groupItem.gambar,
              groupItem.ukuran,
              groupItem.jumlah,
              groupItem.harga,
            ]
          );
          await dbClient.query(
            'UPDATE product_sizes SET stok = stok - $1 WHERE id_product = $2 AND ukuran = $3',
            [groupItem.jumlah, groupItem.id_product, groupItem.ukuran]
          );
          await dbClient.query(
            'UPDATE products SET updated_at = CURRENT_TIMESTAMP, stok = stok - $1 WHERE id_product = $2',
            [groupItem.jumlah, groupItem.id_product]
          );
        }

        orderCount += 1;
      }

      // hanya item keranjang yg dicentang yg dihapus, buy now tidak menghapus isi keranjang
      if (!isBuyNow) {
        await dbClient.query(
          `DELETE FROM cart_items
           WHERE id_cart = (SELECT id_cart FROM carts WHERE id_user = $1)
             AND id_cart_item = ANY($2::int[])`,
          [user.id_user, selectedIds]
        );
      }

      return orderCount;
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { error: error.message };
    }
    console.error('Checkout error:', error);
    return { error: 'Could not complete your checkout. Please try again.' };
  }

  revalidatePath('/', 'layout');
  redirect(`/buyer/orders?created=${createdOrders}`);
}

// batalkan pesanan yang masih menunggu pembayaran lalu kembalikan stok
export async function cancelOrderByBuyerAction(rawOrderId, prevState, formData) {
  const orderId = toPositiveInt(rawOrderId);
  const user = await getShopperUser();
  if (!user || !orderId) {
    return { error: 'You are not allowed to perform this action.' };
  }

  try {
    await withTransaction(async function runCancelOrder(dbClient) {
      const orderResult = await dbClient.query(
        'SELECT status_order FROM orders WHERE id_order = $1 AND id_user = $2 FOR UPDATE',
        [orderId, user.id_user]
      );

      if (orderResult.rows.length === 0) {
        throw new CheckoutError('Order not found.');
      }

      if (orderResult.rows[0].status_order !== 'pending') {
        throw new CheckoutError('Only orders awaiting payment can be cancelled.');
      }

      await restoreStock(dbClient, orderId);
      await dbClient.query(
        "UPDATE orders SET updated_at = CURRENT_TIMESTAMP, status_order = 'cancelled' WHERE id_order = $1",
        [orderId]
      );
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath('/buyer/orders');
  revalidatePath(`/buyer/orders/${orderId}`);
  return { success: 'Order has been cancelled.' };
}

// konfirmasi pesanan terkirim menjadi selesai n perbarui jumlah terjual
export async function confirmReceivedAction(rawOrderId, prevState, formData) {
  const orderId = toPositiveInt(rawOrderId);
  const user = await getShopperUser();
  if (!user || !orderId) {
    return { error: 'You are not allowed to perform this action.' };
  }

  const updateResult = await withTransaction(async function runConfirmReceived(dbClient) {
    const queryResult = await dbClient.query(
      `UPDATE orders SET updated_at = CURRENT_TIMESTAMP, status_order = 'completed'
       WHERE id_order = $1 AND id_user = $2 AND status_order = 'shipped'
       RETURNING id_order`,
      [orderId, user.id_user]
    );

    if (queryResult.rowCount > 0) {
      await addSoldCount(dbClient, orderId);
    }

    return queryResult;
  });

  if (updateResult.rowCount === 0) {
    return { error: 'Only shipped orders can be confirmed as received.' };
  }

  revalidatePath('/buyer/orders');
  revalidatePath(`/buyer/orders/${orderId}`);
  return { success: 'Order completed. You can now review the products.' };
}

// cek transisi status trs perbarui status pesanan milik toko penjual
export async function updateOrderStatusAction(rawOrderId, prevState, formData) {
  const orderId = toPositiveInt(rawOrderId);
  const seller = await getActiveSeller();
  if (!seller || !orderId) {
    return { error: 'You are not allowed to perform this action.' };
  }

  const nextStatus = getString(formData, 'status_order');
  if (!ORDER_STATUS[nextStatus]) {
    return { error: 'Please choose a valid status.' };
  }

  try {
    await withTransaction(async function runUpdateOrderStatus(dbClient) {
      const orderResult = await dbClient.query(
        'SELECT status_order FROM orders WHERE id_order = $1 AND id_store = $2 FOR UPDATE',
        [orderId, seller.store.id_store]
      );

      if (orderResult.rows.length === 0) {
        throw new CheckoutError('Order not found in your store.');
      }

      const currentStatus = orderResult.rows[0].status_order;
      let allowedNextStatuses = [];
      if (SELLER_STATUS_FLOW[currentStatus]) {
        allowedNextStatuses = SELLER_STATUS_FLOW[currentStatus];
      }

      if (!allowedNextStatuses.includes(nextStatus)) {
        throw new CheckoutError(
          `Cannot change status from "${ORDER_STATUS[currentStatus].label}" to "${ORDER_STATUS[nextStatus].label}".`
        );
      }

      if (nextStatus === 'cancelled') {
        await restoreStock(dbClient, orderId);
      }

      if (nextStatus === 'completed') {
        await addSoldCount(dbClient, orderId);
      }

      await dbClient.query(
        'UPDATE orders SET updated_at = CURRENT_TIMESTAMP, status_order = $1 WHERE id_order = $2',
        [nextStatus, orderId]
      );
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath('/seller/orders');
  revalidatePath('/seller/dashboard');
  return { success: `Order #${orderId} updated to "${ORDER_STATUS[nextStatus].label}".` };
}

// kembalikan stok ukuran n hitung ulang total stok produk saat order dibatalkan
async function restoreStock(dbClient, orderId) {
  await dbClient.query(
    `UPDATE product_sizes ps
     SET stok = ps.stok + oi.total
     FROM (
       SELECT id_product, ukuran, SUM(jumlah) AS total
       FROM order_items
       WHERE id_order = $1 AND id_product IS NOT NULL
       GROUP BY id_product, ukuran
     ) oi
     WHERE ps.id_product = oi.id_product AND ps.ukuran = oi.ukuran`,
    [orderId]
  );

  await dbClient.query(
    `UPDATE products p
     SET updated_at = CURRENT_TIMESTAMP,
         stok = COALESCE((SELECT SUM(ps.stok) FROM product_sizes ps WHERE ps.id_product = p.id_product), 0)
     WHERE p.id_product IN (
       SELECT id_product FROM order_items WHERE id_order = $1 AND id_product IS NOT NULL
     )`,
    [orderId]
  );
}

// tambah jumlah terjual produk saat pesanan selesai
async function addSoldCount(dbClient, orderId) {
  await dbClient.query(
    `UPDATE products p
     SET jumlah_terjual = p.jumlah_terjual + oi.total
     FROM (
       SELECT id_product, SUM(jumlah) AS total
       FROM order_items
       WHERE id_order = $1 AND id_product IS NOT NULL
       GROUP BY id_product
     ) oi
     WHERE p.id_product = oi.id_product`,
    [orderId]
  );
}