'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import pool, { withTransaction } from '@/lib/db';
import { getActiveSeller } from '@/lib/auth';
import { isSegmentAllowed, restrictionMessage } from '@/lib/segments';
import {
  normalizeSizeLabel,
  isValidSizeLabel,
  NO_SIZE,
  MAX_SIZES_PER_PRODUCT,
  MAX_STOCK_PER_SIZE,
} from '@/lib/sizes';
import { getString, toPositiveInt, isValidPrice } from '@/lib/validation';
import {
  resolveImageInput,
  deleteUploadedImage,
  getUploadedFiles,
  validateImageFiles,
  saveImageFiles,
  MAX_PRODUCT_IMAGES,
} from '@/lib/upload';

const NOT_ALLOWED = { error: 'Only approved Seller accounts can do this. Please sign in again.' };
const SEGMENTS = ['Women', 'Men', 'Kids', 'Unisex'];

// cek n perbarui informasi toko milik penjual aktif
export async function updateStoreAction(prevState, formData) {
  const seller = await getActiveSeller();
  if (!seller) {
    return NOT_ALLOWED;
  }

  const storeName = getString(formData, 'nama_toko');
  const storeDescription = getString(formData, 'deskripsi_toko');

  if (storeName === '') {
    return { error: 'Store name is required.' };
  }

  if (storeName.length < 3 || storeName.length > 120) {
    return { error: 'Store name must be 3–120 characters.' };
  }

  if (storeDescription.length > 1000) {
    return { error: 'Store description must be at most 1000 characters.' };
  }

  const storeImage = await resolveImageInput(formData, {
    fileKey: 'gambar_file',
    urlKey: 'gambar_url',
    required: false,
    currentValue: seller.store.gambar_toko,
    folder: 'stores',
  });
  if (storeImage.error) {
    return { error: storeImage.error };
  }

  let descriptionValue = null;
  if (storeDescription) {
    descriptionValue = storeDescription;
  }

  await pool.query(
    'UPDATE stores SET updated_at = CURRENT_TIMESTAMP, nama_toko = $1, deskripsi_toko = $2, gambar_toko = $3 WHERE id_store = $4',
    [storeName, descriptionValue, storeImage.value, seller.store.id_store]
  );

  if (storeImage.value !== seller.store.gambar_toko) {
    await deleteUploadedImage(seller.store.gambar_toko);
  }

  revalidatePath('/seller', 'layout');
  revalidatePath('/', 'layout');
  return { success: 'Store information updated.' };
}

// cek n susun pasangan ukuran beserta stok dari data formulir produk
function readSizeStocks(formData) {
  const rawNames = formData.getAll('size_name');
  const sizeNames = [];
  for (const rawName of rawNames) {
    sizeNames.push(normalizeSizeLabel(rawName));
  }

  const rawStocks = formData.getAll('size_stock');
  const sizeStocks = [];
  for (const rawStock of rawStocks) {
    sizeStocks.push(String(rawStock).trim());
  }

  if (sizeNames.length === 0) {
    return { error: 'Please tick at least 1 size and fill in its stock.' };
  }

  if (sizeNames.length !== sizeStocks.length) {
    return { error: 'Size data is not valid. Please reload the page and try again.' };
  }

  if (sizeNames.includes(NO_SIZE)) {
    const singleStock = Number(sizeStocks[0]);
    if (sizeNames.length !== 1) {
      return { error: 'Size data is not valid. Please reload the page and try again.' };
    }

    if (
      sizeStocks[0] === '' ||
      !Number.isInteger(singleStock) ||
      singleStock < 0 ||
      singleStock > MAX_STOCK_PER_SIZE
    ) {
      return { error: 'Stock must be a whole number (0 or more).' };
    }

    return {
      sizes: [{ ukuran: NO_SIZE, stok: singleStock }],
      ukuranList: NO_SIZE,
      totalStock: singleStock,
      isSizeless: true,
    };
  }

  if (sizeNames.length > MAX_SIZES_PER_PRODUCT) {
    return { error: `A product can have up to ${MAX_SIZES_PER_PRODUCT} sizes.` };
  }

  const parsedSizes = [];
  for (let idx = 0; idx < sizeNames.length; idx += 1) {
    const sizeLabel = sizeNames[idx];
    const stockRaw = sizeStocks[idx];

    if (!isValidSizeLabel(sizeLabel)) {
      return {
        error: `Size "${sizeLabel}" is not valid. Use a real size such as S, M, L or 28 (max 10 characters).`,
      };
    }

    const isDuplicateSize = parsedSizes.some(function findDuplicateSize(existingSize) {
      return existingSize.ukuran === sizeLabel;
    });
    if (isDuplicateSize) {
      return { error: `Size "${sizeLabel}" is listed twice.` };
    }

    const parsedStock = Number(stockRaw);
    if (
      stockRaw === '' ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0 ||
      parsedStock > MAX_STOCK_PER_SIZE
    ) {
      return {
        error: `Stock for size ${sizeLabel} must be a whole number (0 or more).`,
      };
    }

    parsedSizes.push({ ukuran: sizeLabel, stok: parsedStock });
  }

  const sizeLabelsOnly = [];
  for (const sizeEntry of parsedSizes) {
    sizeLabelsOnly.push(sizeEntry.ukuran);
  }
  const ukuranList = sizeLabelsOnly.join(',');

  if (ukuranList.length > 100) {
    return { error: 'Size list is too long. Please select fewer sizes.' };
  }

  let totalStock = 0;
  for (const sizeEntry of parsedSizes) {
    totalStock += sizeEntry.stok;
  }

  return {
    sizes: parsedSizes,
    ukuranList,
    totalStock,
    isSizeless: false,
  };
}

// cek kelengkapan n kesesuaian data formulir produk sebelum disimpan
async function readProductForm(formData) {
  const productName = getString(formData, 'nama_produk');
  const productDescription = getString(formData, 'deskripsi');
  const priceRaw = getString(formData, 'harga');
  const categoryId = toPositiveInt(formData.get('id_category'));
  const segmentValue = getString(formData, 'segmen');

  if (productName === '' || productDescription === '' || priceRaw === '') {
    return { error: 'Please fill in the product name, description, and price.' };
  }

  if (!categoryId) {
    return { error: 'Please choose a category.' };
  }

  if (productName.length < 3 || productName.length > 150) {
    return { error: 'Product name must be 3–150 characters.' };
  }

  if (productDescription.length < 10) {
    return { error: 'Description must be at least 10 characters.' };
  }

  if (!isValidPrice(priceRaw)) {
    return { error: 'Price must be a number greater than 0.' };
  }

  if (!SEGMENTS.includes(segmentValue)) {
    return { error: 'Please choose a segment: Unisex, Women, Men, or Kids.' };
  }

  const sizeData = readSizeStocks(formData);
  if (sizeData.error) {
    return { error: sizeData.error };
  }

  const categoryResult = await pool.query(
    'SELECT id_category, nama_kategori, grup_kategori FROM categories WHERE id_category = $1',
    [categoryId]
  );
  if (categoryResult.rows.length === 0) {
    return { error: 'Selected category does not exist.' };
  }

  const categoryRow = categoryResult.rows[0];
  const isAccessory = categoryRow.grup_kategori === 'Accessories';

  if (isAccessory && !sizeData.isSizeless) {
    return { error: 'Accessories do not use sizes. Please fill in the stock only.' };
  }

  if (!isAccessory && sizeData.isSizeless) {
    return { error: 'Clothing and shoes must have sizes. Please tick at least 1 size.' };
  }

  const categoryName = categoryRow.nama_kategori;
  if (!isSegmentAllowed(categoryName, segmentValue)) {
    return { error: `${restrictionMessage(categoryName)} Please choose a matching segment.` };
  }

  return {
    data: {
      nama: productName,
      deskripsi: productDescription,
      harga: Number(priceRaw),
      idCategory: categoryId,
      segmen: segmentValue,
      sizes: sizeData.sizes,
      ukuran: sizeData.ukuranList,
      stok: sizeData.totalStock,
    },
  };
}

// simpan ulang daftar ukuran beserta stok produk ke database
async function saveProductSizes(dbClient, productId, sizes) {
  await dbClient.query('DELETE FROM product_sizes WHERE id_product = $1', [productId]);
  for (let idx = 0; idx < sizes.length; idx += 1) {
    await dbClient.query(
      'INSERT INTO product_sizes (id_product, ukuran, stok, urutan) VALUES ($1, $2, $3, $4)',
      [productId, sizes[idx].ukuran, sizes[idx].stok, idx + 1]
    );
  }
}

// simpan ulang galeri foto produk n perbarui foto utama produk
async function saveProductGallery(dbClient, productId, imagePaths) {
  await dbClient.query('DELETE FROM product_images WHERE id_product = $1', [productId]);
  for (let idx = 0; idx < imagePaths.length; idx += 1) {
    await dbClient.query(
      'INSERT INTO product_images (id_product, gambar, urutan) VALUES ($1, $2, $3)',
      [productId, imagePaths[idx], idx + 1]
    );
  }
  await dbClient.query(
    'UPDATE products SET updated_at = CURRENT_TIMESTAMP, gambar = $1 WHERE id_product = $2',
    [imagePaths[0], productId]
  );
}

// ambil daftar foto galeri produk dgn cadangan foto utama produk
async function getProductImages(productId, mainImage) {
  const galleryResult = await pool.query(
    'SELECT gambar FROM product_images WHERE id_product = $1 ORDER BY urutan ASC',
    [productId]
  );
  if (galleryResult.rows.length > 0) {
    const galleryPaths = [];
    for (const rowItem of galleryResult.rows) {
      galleryPaths.push(rowItem.gambar);
    }
    return galleryPaths;
  }

  if (mainImage) {
    return [mainImage];
  }
  return [];
}

// cek data n foto lalu buat produk baru milik toko penjual
export async function createProductAction(prevState, formData) {
  const seller = await getActiveSeller();
  if (!seller) {
    return NOT_ALLOWED;
  }

  const formResult = await readProductForm(formData);
  if (formResult.error) {
    return { error: formResult.error };
  }

  const uploadedFiles = getUploadedFiles(formData, 'gambar_files');
  if (uploadedFiles.length === 0) {
    return { error: 'Please upload at least 1 product photo.' };
  }

  if (uploadedFiles.length > MAX_PRODUCT_IMAGES) {
    return { error: `You can upload up to ${MAX_PRODUCT_IMAGES} photos per product.` };
  }

  const fileValidationError = validateImageFiles(uploadedFiles);
  if (fileValidationError) {
    return { error: fileValidationError };
  }

  const savedImagePaths = await saveImageFiles(uploadedFiles, 'products');
  const productPayload = formResult.data;

  await withTransaction(async function insertNewProduct(dbClient) {
    const insertResult = await dbClient.query(
      `INSERT INTO products (id_store, id_category, nama_produk, segmen, deskripsi, harga, stok, ukuran, gambar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_product`,
      [
        seller.store.id_store,
        productPayload.idCategory,
        productPayload.nama,
        productPayload.segmen,
        productPayload.deskripsi,
        productPayload.harga,
        productPayload.stok,
        productPayload.ukuran,
        savedImagePaths[0],
      ]
    );
    const createdProductId = insertResult.rows[0].id_product;
    await saveProductSizes(dbClient, createdProductId, productPayload.sizes);
    await saveProductGallery(dbClient, createdProductId, savedImagePaths);
  });

  revalidatePath('/seller/products');
  revalidatePath('/products');
  redirect('/seller/products?saved=created');
}

// cek kepemilikan, data, n foto lalu perbarui produk milik toko penjual
export async function updateProductAction(rawProductId, prevState, formData) {
  const productId = toPositiveInt(rawProductId);
  const seller = await getActiveSeller();
  if (!seller || !productId) {
    return NOT_ALLOWED;
  }

  const ownerCheck = await pool.query(
    'SELECT gambar FROM products WHERE id_product = $1 AND id_store = $2',
    [productId, seller.store.id_store]
  );
  if (ownerCheck.rows.length === 0) {
    return { error: 'Product not found in your store.' };
  }

  const formResult = await readProductForm(formData);
  if (formResult.error) {
    return { error: formResult.error };
  }

  const currentImages = await getProductImages(productId, ownerCheck.rows[0].gambar);
  const rawKeptImages = formData.getAll('keep_images');
  const keptImages = [];
  for (const keptPath of rawKeptImages) {
    if (typeof keptPath === 'string' && currentImages.includes(keptPath)) {
      keptImages.push(keptPath);
    }
  }

  const newFiles = getUploadedFiles(formData, 'gambar_files');
  const totalImages = keptImages.length + newFiles.length;

  if (totalImages === 0) {
    return { error: 'A product must have at least 1 photo.' };
  }

  if (totalImages > MAX_PRODUCT_IMAGES) {
    return {
      error: `A product can have up to ${MAX_PRODUCT_IMAGES} photos (you selected ${totalImages}).`,
    };
  }

  const fileValidationError = validateImageFiles(newFiles);
  if (fileValidationError) {
    return { error: fileValidationError };
  }

  const newImagePaths = await saveImageFiles(newFiles, 'products');
  const finalImages = [...keptImages, ...newImagePaths];
  const removedImages = currentImages.filter(function filterRemovedImage(existingPath) {
    return !keptImages.includes(existingPath);
  });

  const productPayload = formResult.data;
  await withTransaction(async function updateExistingProduct(dbClient) {
    await dbClient.query(
      `UPDATE products
       SET updated_at = CURRENT_TIMESTAMP, id_category = $1, nama_produk = $2, segmen = $3, deskripsi = $4,
           harga = $5, stok = $6, ukuran = $7
       WHERE id_product = $8 AND id_store = $9`,
      [
        productPayload.idCategory,
        productPayload.nama,
        productPayload.segmen,
        productPayload.deskripsi,
        productPayload.harga,
        productPayload.stok,
        productPayload.ukuran,
        productId,
        seller.store.id_store,
      ]
    );
    await saveProductSizes(dbClient, productId, productPayload.sizes);
    await saveProductGallery(dbClient, productId, finalImages);
  });

  for (const removedPath of removedImages) {
    await deleteUploadedImage(removedPath);
  }

  revalidatePath('/seller/products');
  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  redirect('/seller/products?saved=updated');
}

// pastikan produkny milik si toko ini trs hapus produk beserta file foto milik toko penjual
export async function deleteProductAction(rawProductId, prevState, formData) {
  const productId = toPositiveInt(rawProductId);
  const seller = await getActiveSeller();
  if (!seller || !productId) {
    return NOT_ALLOWED;
  }

  const ownerCheck = await pool.query(
    'SELECT gambar FROM products WHERE id_product = $1 AND id_store = $2',
    [productId, seller.store.id_store]
  );
  if (ownerCheck.rows.length === 0) {
    return { error: 'Product not found in your store.' };
  }

  const productImages = await getProductImages(productId, ownerCheck.rows[0].gambar);

  await pool.query('DELETE FROM products WHERE id_product = $1 AND id_store = $2', [
    productId,
    seller.store.id_store,
  ]);

  for (const imagePath of productImages) {
    await deleteUploadedImage(imagePath);
  }

  revalidatePath('/seller/products');
  revalidatePath('/products');
  return { success: 'Product deleted.' };
}