import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import pool from './db';

// maks 5mb
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;

const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
export const ALLOWED_IMAGE_TYPES = Object.keys(IMAGE_EXTENSIONS);

const UPLOAD_URL_PREFIX = '/uploads/';
const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const UPLOAD_FOLDERS = ['products', 'stores'];

// cek ? input memiliki file yg upload
export function hasUploadedFile(file) {
  return Boolean(file && typeof file === 'object' && 'size' in file && file.size > 0);
}

// cek tipe n ukuran file gambar
export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Image must be a JPG, PNG, WEBP, or GIF file.';
  }

  if (file.size > MAX_IMAGE_SIZE) {
    let fileLabel = 'Image';
    if (file.name) {
      fileLabel = file.name;
    }
    return `"${fileLabel}" is larger than 5 MB.`;
  }

  return null;
}

// cek URL gambar memakai situs sendiri atau skema http/https
export function isValidImageUrl(url) {
  if (url.startsWith('/')) {
    return !url.startsWith('//');
  }

  return /^https?:\/\/\S+$/i.test(url);
}

// simpan satu file gambar ke folder tujuan dan kembalikan path urlnya
export async function saveImageFile(file, uploadFolder = 'products') {
  if (!UPLOAD_FOLDERS.includes(uploadFolder)) {
    throw new Error(`Unknown upload folder: ${uploadFolder}`);
  }

  const extension = IMAGE_EXTENSIONS[file.type];
  const fileName = `${Date.now()}-${randomBytes(6).toString('hex')}.${extension}`;

  const folderPath = path.join(UPLOAD_ROOT, uploadFolder);
  await mkdir(folderPath, { recursive: true });

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(folderPath, fileName), fileBuffer);

  return `${UPLOAD_URL_PREFIX}${uploadFolder}/${fileName}`;
}

// ambil semua file valid dari input formData berdasarkan key
export function getUploadedFiles(formData, fieldKey) {
  const rawFiles = formData.getAll(fieldKey);
  const validFiles = [];

  for (const fileItem of rawFiles) {
    if (hasUploadedFile(fileItem)) {
      validFiles.push(fileItem);
    }
  }

  return validFiles;
}

// cek daftar file gambar satu persatu n kembalikan error pertama kalau ada
export function validateImageFiles(fileList) {
  for (const fileItem of fileList) {
    const validationError = validateImageFile(fileItem);
    if (validationError) {
      return validationError;
    }
  }

  return null;
}

// simpan banyak file gambar berurutan dan kembalikan daftar path urlnya
export async function saveImageFiles(fileList, uploadFolder = 'products') {
  const savedPaths = [];

  for (const fileItem of fileList) {
    const savedPath = await saveImageFile(fileItem, uploadFolder);
    savedPaths.push(savedPath);
  }

  return savedPaths;
}

// ubah path upload menjadi path file lokal dalam folder uploads
function getUploadFilePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.startsWith(UPLOAD_URL_PREFIX)) {
    return null;
  }

  const relativePath = imagePath.slice(UPLOAD_URL_PREFIX.length);
  const resolvedFilePath = path.join(UPLOAD_ROOT, relativePath);

  if (!resolvedFilePath.startsWith(UPLOAD_ROOT + path.sep)) {
    return null;
  }

  return resolvedFilePath;
}

// hapus file gambar di disk kalau sudah tidak dipakai di tabel manapun
export async function deleteUploadedImage(imagePath) {
  const resolvedFilePath = getUploadFilePath(imagePath);
  if (!resolvedFilePath) {
    return;
  }

  const usageResult = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE gambar = $1) +
       (SELECT COUNT(*) FROM product_images WHERE gambar = $1) +
       (SELECT COUNT(*) FROM stores WHERE gambar_toko = $1) +
       (SELECT COUNT(*) FROM order_items WHERE gambar = $1) AS total`,
    [imagePath]
  );

  if (Number(usageResult.rows[0].total) > 0) {
    return;
  }

  try {
    await unlink(resolvedFilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to delete image file:', error.message);
    }
  }
}

// tentukan nilai gambar akhir dari file upload atau yg sudah tersimpan
export async function resolveImageInput(formData, options) {
  const fileKey = options.fileKey;
  const urlKey = options.urlKey;
  const isRequired = options.required;

  let currentValue = null;
  if (options.currentValue) {
    currentValue = options.currentValue;
  }

  let uploadFolder = 'products';
  if (options.folder) {
    uploadFolder = options.folder;
  }

  const uploadedFile = formData.get(fileKey);
  let rawUrl = formData.get(urlKey);
  if (typeof rawUrl !== 'string') {
    rawUrl = '';
  }
  const trimmedUrl = rawUrl.trim();

  if (hasUploadedFile(uploadedFile)) {
    const fileError = validateImageFile(uploadedFile);
    if (fileError) {
      return { error: fileError };
    }

    const savedPath = await saveImageFile(uploadedFile, uploadFolder);
    return { value: savedPath, isNewUpload: true };
  }

  if (trimmedUrl !== '') {
    if (!isValidImageUrl(trimmedUrl)) {
      return { error: 'Image URL must start with http://, https://, or /.' };
    }

    return { value: trimmedUrl, isNewUpload: false };
  }

  if (currentValue) {
    return { value: currentValue, isNewUpload: false };
  }

  if (isRequired) {
    return { error: 'Image is required. Please upload an image file.' };
  }

  return { value: null, isNewUpload: false };
}