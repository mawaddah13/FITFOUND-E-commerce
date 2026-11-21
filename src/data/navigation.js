export const MAIN_SEGMENTS = [
  { label: 'Home', value: '' },
  { label: 'Women', value: 'Women' },
  { label: 'Men', value: 'Men' },
  { label: 'Kids', value: 'Kids' },
];

const BASE_SEGMENTS = ['Women', 'Men', 'Kids'];

const MAIN_CATEGORY_ORDER = ['tops', 'bottoms', 'outerwear', 'shoes'];

const SEGMENT_ONLY_RULES = {
  jewelry: ['Women'],
  ties: ['Men'],
  headband: ['Kids'],
};

// ambil daftar segmen pemilik kategori atau array kosong jika berlaku untuk semua
export function segmentsForCategory(categoryName) {
  let key = '';
  if (categoryName) {
    key = categoryName.toLowerCase();
  }
  const rules = SEGMENT_ONLY_RULES[key];
  if (rules) {
    return rules;
  }
  return [];
}

// urutkan kategori utama sesuai urutan tetap lalu abjad untuk kategori baru
export function sortMainCategories(categories) {
  const copiedCategories = [];
  for (const category of categories) {
    copiedCategories.push(category);
  }

  return copiedCategories.sort((firstCategory, secondCategory) => {
    let firstOrder = MAIN_CATEGORY_ORDER.indexOf(firstCategory.nama_kategori.toLowerCase());
    let secondOrder = MAIN_CATEGORY_ORDER.indexOf(secondCategory.nama_kategori.toLowerCase());
    if (firstOrder === -1) {
      firstOrder = 999;
    }
    if (secondOrder === -1) {
      secondOrder = 999;
    }
    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }
    return firstCategory.nama_kategori.localeCompare(secondCategory.nama_kategori);
  });
}

// susun daftar menu baris kedua navbar dari data kategori
export function buildSubMenu(categories) {
  const mainCategories = sortMainCategories(
    categories.filter((category) => category.grup_kategori === 'Main')
  );
  const hasAccessories = categories.some((category) => category.grup_kategori === 'Accessories');

  const menu = [
    { label: 'Best Sellers', value: 'best-sellers', isSpecialLink: true, href: '/best-sellers' },
    { label: 'All Products', value: 'all-products', isSpecialLink: true, href: '/products' },
  ];
  for (const category of mainCategories) {
    menu.push({ label: category.nama_kategori, value: category.nama_kategori, hasDropdown: false });
  }
  if (hasAccessories) {
    menu.push({ label: 'Accessories', value: 'Accessories', hasDropdown: true });
  }
  return menu;
}

// saring dan urutkan isi dropdown accessories sesuai segmen aktif
export function getAccessoriesItems(activeSegment, accessoryNames) {
  let segment = '';
  if (activeSegment) {
    segment = activeSegment.toLowerCase();
  }
  const segmentName = BASE_SEGMENTS.find((segmentItem) => segmentItem.toLowerCase() === segment);

  const items = accessoryNames.filter((accessoryName) => {
    const owners = segmentsForCategory(accessoryName);
    if (!segmentName || owners.length === 0) {
      return true;
    }
    return owners.includes(segmentName);
  });

  return items.sort((firstName, secondName) => firstName.localeCompare(secondName));
}

// buat url tujuan filter katalog berdasarkan segmen dan kategori
export function buildCategoryHref(segmentValue, categoryValue) {
  const params = new URLSearchParams();

  if (segmentValue && segmentValue !== '') {
    params.set('segment', segmentValue);
  }

  if (categoryValue && categoryValue !== '') {
    params.set('kategori', categoryValue);
  }

  const queryString = params.toString();
  if (queryString !== '') {
    return `/?${queryString}`;
  }
  return '/';
}