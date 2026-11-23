import pool from './db';
import { PRODUCT_CARD_SELECT } from './products';

export const SORT_OPTIONS = {
  newest: { label: 'Newest', sql: 'p.created_at DESC' },
  price_asc: { label: 'Price: Low to High', sql: 'p.harga ASC' },
  price_desc: { label: 'Price: High to Low', sql: 'p.harga DESC' },
  name_asc: { label: 'Name: A–Z', sql: 'p.nama_produk ASC' },
  name_desc: { label: 'Name: Z–A', sql: 'p.nama_produk DESC' },
  rating: { label: 'Top Rated', sql: 'avg_rating DESC, review_count DESC' },
};

export const SEGMENTS = ['Women', 'Men', 'Kids'];
export const CATEGORY_GROUPS = ['Main', 'Accessories'];

export const FEATURED_MIN_SOLD = 200;
export const FEATURED_MIN_RATING = 4.5;

// baca nilai parameter query url n rapikan spasi
function readParam(params, paramKey) {
  let rawValue = undefined;
  if (params) {
    rawValue = params[paramKey];
  }

  if (typeof rawValue === 'string') {
    return rawValue.trim();
  }

  return '';
}

// ambil n cek parameter filter katalog dari query url
export function parseCatalogParams(params) {
  const keyword = readParam(params, 'q').slice(0, 100);
  let segment = readParam(params, 'segment');
  const kategori = readParam(params, 'kategori');
  const minRaw = readParam(params, 'min');
  const maxRaw = readParam(params, 'max');
  let sort = readParam(params, 'sort');

  const matchedSegment = SEGMENTS.find(function findSegment(segmentItem) {
    return segmentItem.toLowerCase() === segment.toLowerCase();
  });

  if (matchedSegment) {
    segment = matchedSegment;
  } else {
    segment = '';
  }

  if (!SORT_OPTIONS[sort]) {
    sort = 'newest';
  }

  let minPrice = null;
  if (minRaw !== '' && Number.isFinite(Number(minRaw)) && Number(minRaw) >= 1) {
    minPrice = Number(minRaw);
  }

  let maxPrice = null;
  if (maxRaw !== '' && Number.isFinite(Number(maxRaw)) && Number(maxRaw) >= 1) {
    maxPrice = Number(maxRaw);
  }

  let priceError = '';
  if (minPrice !== null && maxPrice !== null && maxPrice < minPrice) {
    priceError = 'Maximum price cannot be lower than minimum price.';
    maxPrice = null;
  }

  let minText = '';
  if (minPrice !== null) {
    minText = String(minPrice);
  }

  let maxText = '';
  if (maxPrice !== null) {
    maxText = String(maxPrice);
  }

  const hasFilter =
    keyword !== '' || segment !== '' || kategori !== '' || minPrice !== null || maxPrice !== null;

  return {
    q: keyword,
    segment,
    kategori,
    min: minText,
    max: maxText,
    sort,
    priceError,
    hasFilter,
  };
}

// ambil daftar semua kategori produk terurut berdasarkan grup n nama
export async function getCategories() {
  const categoryResult = await pool.query(
    `SELECT id_category, nama_kategori, grup_kategori
     FROM categories
     ORDER BY grup_kategori DESC, nama_kategori ASC`
  );
  return categoryResult.rows;
}

// ambil data katalog produk sesuai filter n opsi urutan atau batas
export async function queryCatalog(filters, catalogOptions = {}) {
  let queryText = `${PRODUCT_CARD_SELECT} WHERE 1 = 1`;
  const queryValues = [];

  if (catalogOptions.inStockOnly) {
    queryText += ' AND p.stok > 0';
  }

  if (filters.q !== '') {
    queryValues.push(`%${filters.q}%`);
    queryText += ` AND p.nama_produk ILIKE $${queryValues.length}`;
  }

  if (filters.segment !== '') {
    queryValues.push(filters.segment);
    if (filters.segment === 'Kids') {
      queryText += ` AND p.segmen = $${queryValues.length}`;
    } else {
      queryText += ` AND (p.segmen = $${queryValues.length} OR p.segmen = 'Unisex')`;
    }
  }

  if (filters.kategori !== '') {
    const matchedGroup = CATEGORY_GROUPS.find(function findGroup(groupItem) {
      return groupItem.toLowerCase() === filters.kategori.toLowerCase();
    });

    if (matchedGroup) {
      queryValues.push(matchedGroup);
      queryText += ` AND c.grup_kategori = $${queryValues.length}`;
    } else {
      queryValues.push(filters.kategori);
      queryText += ` AND c.nama_kategori ILIKE $${queryValues.length}`;
    }
  }

  if (filters.min !== '') {
    queryValues.push(Number(filters.min));
    queryText += ` AND p.harga >= $${queryValues.length}`;
  }

  if (filters.max !== '') {
    queryValues.push(Number(filters.max));
    queryText += ` AND p.harga <= $${queryValues.length}`;
  }

  if (catalogOptions.random) {
    queryText += ' ORDER BY RANDOM()';
  } else {
    queryText += ` ORDER BY (p.stok > 0) DESC, ${SORT_OPTIONS[filters.sort].sql}`;
  }

  if (catalogOptions.limit) {
    queryValues.push(catalogOptions.limit);
    queryText += ` LIMIT $${queryValues.length}`;
  }

  const catalogResult = await pool.query(queryText, queryValues);
  return catalogResult.rows;
}

// ambil produk unggulan dengan minimal terjual dan rating tertentu
export async function getFeaturedProducts() {
  const featuredResult = await pool.query(
    `${PRODUCT_CARD_SELECT}
     WHERE p.jumlah_terjual > $1
       AND r.avg_rating >= $2
     ORDER BY RANDOM()`,
    [FEATURED_MIN_SOLD, FEATURED_MIN_RATING]
  );
  return featuredResult.rows;
}

// sdiakan daftar opsi sorting untuk komponen client
export function sortOptionsForClient() {
  const optionKeys = Object.keys(SORT_OPTIONS);
  const clientOptions = [];

  for (const optionKey of optionKeys) {
    clientOptions.push({
      value: optionKey,
      label: SORT_OPTIONS[optionKey].label,
    });
  }

  return clientOptions;
}