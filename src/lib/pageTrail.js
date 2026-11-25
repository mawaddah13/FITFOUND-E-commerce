// catat halaman" yg dibuka buyer (di sessionStorage) buat breadcrumb di halaman akun
const TRAIL_KEY = 'fitfound:page-trail';
const MAX_TRAIL = 3;

// halaman yg tidak dicatat (akun, login, checkout, dll)
const SKIPPED_PREFIXES = ['/buyer', '/seller', '/admin', '/login', '/register'];
const KEPT_BUYER_PAGES = {
  '/buyer/cart': 'Cart',
  '/buyer/wishlist': 'Wishlist',
};

// kasih nama halaman sesuai alamatnya, kosong kalau halamannya tidak perlu dicatat
export function getPageLabel(pathname, searchParams) {
  if (KEPT_BUYER_PAGES[pathname]) {
    return KEPT_BUYER_PAGES[pathname];
  }

  const isSkipped = SKIPPED_PREFIXES.some(function matchPrefix(prefix) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
  if (isSkipped) {
    return '';
  }

  if (pathname === '/products') {
    const searchText = searchParams.get('q');
    const segment = searchParams.get('segment');
    const category = searchParams.get('kategori');
    if (searchText) {
      return `Results for "${searchText}"`;
    }
    if (segment && category) {
      return `${segment} — ${category}`;
    }
    if (segment) {
      return segment;
    }
    if (category) {
      return category;
    }
    return 'All Products';
  }
  if (pathname.startsWith('/products/')) {
    return 'Product Details';
  }
  if (pathname.startsWith('/stores/')) {
    return 'Store';
  }
  return '';
}

// ambil isi riwayat dalam bentuk teks (dipakai useSyncExternalStore di DashboardShell)
export function readPageTrailText() {
  try {
    return window.sessionStorage.getItem(TRAIL_KEY) || '[]';
  } catch (trailError) {
    return '[]';
  }
}

// ubah teks riwayat jadi array, kosong kalau isinya rusak
export function parsePageTrail(trailText) {
  try {
    const savedTrail = JSON.parse(trailText);
    if (Array.isArray(savedTrail)) {
      return savedTrail;
    }
  } catch (trailError) {
    // abaikan, anggap belum ada riwayat
  }
  return [];
}

// baca isi riwayat, kosong kalau belum ada / sessionStorage error
export function readPageTrail() {
  return parsePageTrail(readPageTrailText());
}

// riwayat cuma berubah pas pindah halaman, jadi tidak perlu didengarkan
export function subscribePageTrail() {
  return function unsubscribePageTrail() {};
}

// simpan halaman yg baru dibuka, home = mulai dari awal lagi
export function recordPage(pathname, searchParams) {
  try {
    if (pathname === '/') {
      window.sessionStorage.setItem(TRAIL_KEY, '[]');
      return;
    }

    const label = getPageLabel(pathname, searchParams);
    if (!label) {
      return;
    }

    const queryString = searchParams.toString();
    let href = pathname;
    if (queryString) {
      href = `${pathname}?${queryString}`;
    }

    let trail = readPageTrail();
    // kalau halamannya sudah ada di riwayat (balik lagi), potong sampai situ saja
    const existingIndex = trail.findIndex(function findSamePage(trailItem) {
      return trailItem.href === href;
    });
    if (existingIndex !== -1) {
      trail = trail.slice(0, existingIndex);
    }

    trail.push({ href, label });
    window.sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail.slice(-MAX_TRAIL)));
  } catch (trailError) {
    // sessionStorage tidak bisa dipakai, breadcrumb cukup Home saja
  }
}