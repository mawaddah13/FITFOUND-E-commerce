export const NO_SIZE = '-';
export const MAX_SIZES_PER_PRODUCT = 20;
export const MAX_STOCK_PER_SIZE = 100000;

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const KIDS_AGE_SIZES = ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y'];
const WOMEN_SHOE_SIZES = ['35', '36', '37', '38', '39', '40'];
const MEN_SHOE_SIZES = ['39', '40', '41', '42', '43', '44'];
const UNISEX_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
const KIDS_SHOE_SIZES = ['26', '27', '28', '29', '30', '31', '32', '33', '34'];
const BLOCKED_SIZE_LABELS = ['all size', 'allsize', 'one size', 'onesize', 'free size', 'freesize'];

// cek ukuran selain tanda tanpa ukuran
export function hasSize(ukuranValue) {
  return Boolean(ukuranValue) && ukuranValue !== NO_SIZE;
}

// tambah teks ukuran untuk pesan klo ukurannya ada
export function sizeSuffix(ukuranValue) {
  if (hasSize(ukuranValue)) {
    return ` size ${ukuranValue}`;
  }

  return '';
}

// cek daftar cuma berisi satu entri tanpa ukuran
export function isSizelessList(sizeList) {
  return sizeList.length === 1 && sizeList[0].ukuran === NO_SIZE;
}

// ambil preset ukuran sesuai kategori dan segmen
export function getSizePreset(category, segment) {
  if (!category) {
    return null;
  }

  const categoryName = (category.nama_kategori || '').toLowerCase();
  const isKidsSegment = segment === 'Kids';

  if (category.grup_kategori === 'Accessories') {
    return { key: 'no-size', label: 'No size', sizes: [], noSize: true };
  }

  if (categoryName === 'shoes') {
    if (isKidsSegment) {
      return { key: 'shoes-kids', label: 'Kids shoe sizes (EU 26–34)', sizes: KIDS_SHOE_SIZES };
    }

    if (segment === 'Women') {
      return { key: 'shoes-women', label: 'Women shoe sizes (EU 35–40)', sizes: WOMEN_SHOE_SIZES };
    }

    if (segment === 'Men') {
      return { key: 'shoes-men', label: 'Men shoe sizes (EU 39–44)', sizes: MEN_SHOE_SIZES };
    }

    return { key: 'shoes', label: 'Shoe sizes (EU 36–44)', sizes: UNISEX_SHOE_SIZES };
  }

  if (isKidsSegment) {
    return { key: 'clothing-kids', label: 'Kids sizes by age (2Y–12Y)', sizes: KIDS_AGE_SIZES };
  }

  return { key: 'clothing', label: 'Clothing sizes', sizes: LETTER_SIZES };
}

// rapikan spasi n huruf besar pada label ukuran
export function normalizeSizeLabel(rawValue) {
  const cleanedLabel = String(rawValue || '').trim().replace(/\s+/g, ' ');
  if (cleanedLabel.length <= 4) {
    return cleanedLabel.toUpperCase();
  }

  return cleanedLabel;
}

// cek format label ukuran n tolak label terlarang
export function isValidSizeLabel(rawValue) {
  const normalizedCheck = String(rawValue || '').trim().toLowerCase();
  if (BLOCKED_SIZE_LABELS.includes(normalizedCheck)) {
    return false;
  }

  return /^[A-Za-z0-9 ./-]{1,10}$/.test(rawValue) && /[A-Za-z0-9]/.test(rawValue);
}