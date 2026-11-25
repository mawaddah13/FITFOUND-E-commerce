import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import ProductCard from '@/components/ProductCard';
import { PRODUCT_CARD_SELECT, getWishlistIds, activeAccountSql } from '@/lib/products';
import { formatDate } from '@/lib/format';

// daftar pilihan urutan produk di halaman toko
const SORT_OPTIONS = {
  newest: { label: 'Newest', sql: 'p.created_at DESC' },
  price_asc: { label: 'Price: Low to High', sql: 'p.harga ASC' },
  price_desc: { label: 'Price: High to Low', sql: 'p.harga DESC' },
  rating: { label: 'Top Rated', sql: 'avg_rating DESC, review_count DESC' },
};

// ambil isi parameter di url trs buang spasi di awal/akhir
function readParam(paramsObj, paramKey) {
  let rawValue = undefined;
  if (paramsObj) {
    rawValue = paramsObj[paramKey];
  }

  if (typeof rawValue === 'string') {
    return rawValue.trim();
  }
  return '';
}

// tampilkan halaman detail toko, produk, ulasan
export default async function StorePage({ params, searchParams }) {
  const session = await getSession();
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;

  // pastikan id toko angka bulat positif kalau aneh, ke 404
  const storeId = Number(resolvedParams.id);
  if (!Number.isInteger(storeId) || storeId <= 0) {
    notFound();
  }

  // kalau di link ada tab=reviews, buka ulasan, selain itu buka produk
  let activeTab = 'products';
  if (readParam(resolvedQuery, 'tab') === 'reviews') {
    activeTab = 'reviews';
  }

  // baca filter kategori n urutan; kalau urutan tidak dikenal, balik ke 'newest'
  const selectedCategory = readParam(resolvedQuery, 'kategori');
  let selectedSort = readParam(resolvedQuery, 'sort');
  if (!SORT_OPTIONS[selectedSort]) {
    selectedSort = 'newest';
  }

  // cek tokonya ada n akun sellernya masih aktif (bukan pending/rejected/suspend/nonaktif)
  const resStoreCheck = await pool.query(
    `SELECT s.id_store, s.nama_toko, s.deskripsi_toko, s.gambar_toko, s.created_at
     FROM stores s
     JOIN users u ON u.id_user = s.id_user AND u.role = 'seller' AND u.status = 'active' AND ${activeAccountSql('u')}
     WHERE s.id_store = $1`,
    [storeId]
  );
  if (resStoreCheck.rows.length === 0) {
    notFound();
  }
  const store = resStoreCheck.rows[0];

  // hitung total produk, total ulasan, rata" rating, jumlah item terjual alias order selesai
  const resStats = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE id_store = $1)::int AS total_products,
       (SELECT COUNT(*) FROM reviews r JOIN products p ON p.id_product = r.id_product WHERE p.id_store = $1)::int AS total_reviews,
       (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r JOIN products p ON p.id_product = r.id_product WHERE p.id_store = $1) AS avg_rating,
       (SELECT COALESCE(SUM(oi.jumlah), 0) FROM order_items oi JOIN orders o ON o.id_order = oi.id_order
          WHERE o.id_store = $1 AND o.status_order = 'completed')::int AS items_sold`,
    [storeId]
  );
  const stats = resStats.rows[0];

  // ambil kategori yg ada di toko ini beserta jumlah produknya
  const resCategories = await pool.query(
    `SELECT c.nama_kategori, COUNT(p.id_product)::int AS total
     FROM products p
     JOIN categories c ON c.id_category = p.id_category
     WHERE p.id_store = $1
     GROUP BY c.nama_kategori
     ORDER BY c.nama_kategori ASC`,
    [storeId]
  );
  const storeCategories = resCategories.rows;

  let products = [];
  let reviews = [];
  let wishlistIds = [];

  if (activeTab === 'products') {
    // ambil produk toko sesuai kategori n urutan, stok yg ada didahulukan
    const queryValues = [storeId];
    let productSql = `${PRODUCT_CARD_SELECT} WHERE p.id_store = $1`;
    if (selectedCategory !== '') {
      queryValues.push(selectedCategory);
      productSql += ` AND c.nama_kategori = $${queryValues.length}`;
    }
    productSql += ` ORDER BY (p.stok > 0) DESC, ${SORT_OPTIONS[selectedSort].sql}`;

    const resProducts = await pool.query(productSql, queryValues);
    products = resProducts.rows;
    wishlistIds = await getWishlistIds(session);
  } else {
    // ambil daftar ulasan untuk produk" di toko ini dari yg terbaru
    const resReviews = await pool.query(
      `SELECT r.id_review, r.rating, r.komentar, r.created_at, u.nama,
              p.id_product, p.nama_produk, p.gambar
       FROM reviews r
       JOIN products p ON p.id_product = r.id_product
       JOIN users u ON u.id_user = r.id_user
       WHERE p.id_store = $1
       ORDER BY r.created_at DESC`,
      [storeId]
    );
    reviews = resReviews.rows;
  }

  // atur link url baru pas user pindah tab atau ubah filter/urutan
  function buildHref(changes) {
    const mergedState = {
      tab: activeTab,
      kategori: selectedCategory,
      sort: selectedSort,
    };

    if (changes && changes.tab !== undefined) {
      mergedState.tab = changes.tab;
    }
    if (changes && changes.kategori !== undefined) {
      mergedState.kategori = changes.kategori;
    }
    if (changes && changes.sort !== undefined) {
      mergedState.sort = changes.sort;
    }

    const urlParams = new URLSearchParams();
    if (mergedState.tab === 'reviews') {
      urlParams.set('tab', 'reviews');
    } else {
      if (mergedState.kategori) {
        urlParams.set('kategori', mergedState.kategori);
      }
      if (mergedState.sort && mergedState.sort !== 'newest') {
        urlParams.set('sort', mergedState.sort);
      }
    }

    const queryString = urlParams.toString();
    if (queryString) {
      return `/stores/${storeId}?${queryString}`;
    }
    return `/stores/${storeId}`;
  }

  // tampilkan '-' kalau belum ada ulasan sama sekali
  const avgRatingNumber = Number(stats.avg_rating);
  let ratingStatValue = '—';
  if (stats.total_reviews > 0) {
    ratingStatValue = `★ ${avgRatingNumber.toFixed(1)}`;
  }

  const statItems = [
    { label: 'Products', value: stats.total_products },
    { label: 'Rating', value: ratingStatValue },
    { label: 'Reviews', value: stats.total_reviews },
    { label: 'Sold', value: stats.items_sold },
  ];

  // bedakan style tab yg sedang aktif dengan tab lainnya
  function getTabClass(tabValue) {
    let className = 'relative pb-3 text-sm font-medium transition-colors duration-200 ';
    if (activeTab === tabValue) {
      className +=
        'text-neutral-950 after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-neutral-950';
    } else {
      className += 'text-neutral-500 hover:text-neutral-900';
    }
    return className;
  }

  // bedakan style chip kategori yg sedang dipilih dengan yg tidak
  function getChipClass(isActive) {
    let className = 'shrink-0 px-3.5 py-1.5 text-xs rounded-full border transition-colors duration-200 ';
    if (isActive) {
      className += 'bg-neutral-900 text-white border-neutral-900';
    } else {
      className += 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900';
    }
    return className;
  }

  // pakai foto toko kalau ada, kalau kosong, tampilkan inisial huruf pertama nama toko
  let storeAvatarElement = (
    <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-neutral-900 text-white text-xl md:text-2xl font-bold flex items-center justify-center shrink-0">
      {store.nama_toko.charAt(0).toUpperCase()}
    </span>
  );
  if (store.gambar_toko) {
    storeAvatarElement = (
      <img
        src={store.gambar_toko}
        alt={store.nama_toko}
        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-neutral-200 shrink-0"
      />
    );
  }

  let storeDescriptionElement = null;
  if (store.deskripsi_toko) {
    storeDescriptionElement = (
      <p className="mt-2 text-sm text-neutral-600 max-w-xl line-clamp-2">
        {store.deskripsi_toko}
      </p>
    );
  }

  // ambil bagian tanggalnya saja kalau format tanggalnya ada koma
  let joinedDateLabel = formatDate(store.created_at);
  if (joinedDateLabel.includes(',')) {
    joinedDateLabel = joinedDateLabel.split(',')[0];
  }

  let tabSectionContent = null;
  if (activeTab === 'products') {
    // isi daftar produk toko
    let productListElement = null;
    if (products.length === 0) {
      productListElement = (
        <div className="py-16 text-center bg-white/60 rounded-2xl border border-neutral-200/80 text-sm text-neutral-500">
          No products in this category yet.
        </div>
      );
    } else {
      productListElement = (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(function buildStoreProductCard(productItem, itemIndex) {
            const isProductWishlisted = wishlistIds.includes(productItem.id_product);
            return (
              <ProductCard
                key={productItem.id_product}
                product={productItem}
                session={session}
                index={itemIndex}
                isWishlisted={isProductWishlisted}
              />
            );
          })}
        </div>
      );
    }

    const sortKeys = Object.keys(SORT_OPTIONS);

    tabSectionContent = (
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={buildHref({ kategori: '' })}
              scroll={false}
              className={getChipClass(selectedCategory === '')}
            >
              All
            </Link>
            {storeCategories.map(function buildStoreCategoryChip(catItem) {
              const isSelectedCat = selectedCategory === catItem.nama_kategori;
              return (
                <Link
                  key={catItem.nama_kategori}
                  href={buildHref({ kategori: catItem.nama_kategori })}
                  scroll={false}
                  className={getChipClass(isSelectedCat)}
                >
                  {catItem.nama_kategori} ({catItem.total})
                </Link>
              );
            })}
          </div>

          <div className="flex gap-1.5 text-xs">
            {sortKeys.map(function buildSortLink(sortKey) {
              let sortLinkClass =
                'shrink-0 px-2.5 py-1.5 rounded-lg transition-colors duration-200 ';
              if (selectedSort === sortKey) {
                sortLinkClass += 'bg-white font-semibold text-neutral-950 shadow-sm';
              } else {
                sortLinkClass += 'text-neutral-500 hover:text-neutral-900';
              }

              return (
                <Link
                  key={sortKey}
                  href={buildHref({ sort: sortKey })}
                  scroll={false}
                  className={sortLinkClass}
                >
                  {SORT_OPTIONS[sortKey].label}
                </Link>
              );
            })}
          </div>
        </div>

        {productListElement}
      </section>
    );
  } else {
    // isi daftar ulasan pembeli untuk toko ini
    let reviewSectionBody = null;
    if (reviews.length === 0) {
      reviewSectionBody = (
        <div className="py-16 text-center bg-white/60 rounded-2xl border border-neutral-200/80 text-sm text-neutral-500">
          This store has no reviews yet.
        </div>
      );
    } else {
      reviewSectionBody = reviews.map(function buildStoreReviewItem(reviewItem) {
        const filledStars = '★'.repeat(reviewItem.rating);
        const emptyStars = '★'.repeat(5 - reviewItem.rating);

        let productThumbElement = null;
        if (reviewItem.gambar) {
          productThumbElement = (
            <img src={reviewItem.gambar} alt="" className="w-full h-full object-cover" />
          );
        }

        return (
          <div
            key={reviewItem.id_review}
            className="flex gap-4 bg-white rounded-2xl border border-neutral-200/80 p-4 md:p-5 animate-fade-up"
          >
            <Link
              href={`/products/${reviewItem.id_product}`}
              className="w-14 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-100"
            >
              {productThumbElement}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900">{reviewItem.nama}</p>
                <span className="text-xs text-amber-500">
                  {filledStars}
                  <span className="text-neutral-300">{emptyStars}</span>
                </span>
              </div>
              <Link
                href={`/products/${reviewItem.id_product}`}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 hover:underline underline-offset-4"
              >
                {reviewItem.nama_produk}
              </Link>
              <p className="text-sm text-neutral-700 mt-1.5">{reviewItem.komentar}</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                {formatDate(reviewItem.created_at)}
              </p>
            </div>
          </div>
        );
      });
    }

    tabSectionContent = <section className="space-y-3">{reviewSectionBody}</section>;
  }

  return (
    <div className="min-h-screen bg-(--abumuda) text-neutral-900">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-6">
        <section className="bg-white rounded-3xl border border-neutral-200/80 p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {storeAvatarElement}
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-neutral-950 truncate">
                  {store.nama_toko}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">Joined {joinedDateLabel}</p>
                {storeDescriptionElement}
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-neutral-200 rounded-2xl bg-neutral-50 py-3 text-center md:min-w-[360px]">
              {statItems.map(function buildStoreStatItem(statEntry) {
                return (
                  <div key={statEntry.label} className="px-3">
                    <p className="text-base md:text-lg font-bold text-neutral-950">
                      {statEntry.value}
                    </p>
                    <p className="text-[11px] text-neutral-500">{statEntry.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <nav className="flex gap-8 border-b border-neutral-200">
          <Link
            href={buildHref({ tab: 'products' })}
            scroll={false}
            className={getTabClass('products')}
          >
            Products ({stats.total_products})
          </Link>
          <Link
            href={buildHref({ tab: 'reviews' })}
            scroll={false}
            className={getTabClass('reviews')}
          >
            Reviews ({stats.total_reviews})
          </Link>
        </nav>

        {tabSectionContent}
      </main>
    </div>
  );
}