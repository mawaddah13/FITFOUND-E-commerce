import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartForm from '@/components/AddToCartForm';
import AddToCartButton from '@/components/AddToCartButton';
import WishlistToggle from '@/components/WishlistToggle';
import ProductGallery from '@/components/ProductGallery';
import { getWishlistIds, activeAccountSql } from '@/lib/products';
import { formatDate } from '@/lib/format';

// cek id produk lalu tampilkan detail produk, galeri, toko, dan ulasan pembeli
export default async function ProductDetailPage({ params }) {
  const session = await getSession();
  const resolvedParams = await params;
  const productId = Number(resolvedParams.id);

  if (!productId) {
    notFound();
  }

  let product = null;
  let reviews = [];
  let avgRating = 0;
  let wishlistIds = [];
  let images = [];
  let sizes = [];

  try {
    const resProductCheck = await pool.query(
      `SELECT
         p.id_product,
         p.id_store,
         p.nama_produk,
         p.deskripsi,
         p.segmen,
         p.ukuran,
         p.harga,
         p.stok,
         p.gambar,
         c.nama_kategori,
         s.nama_toko,
         s.deskripsi_toko,
         s.gambar_toko
       FROM products p
       JOIN categories c ON p.id_category = c.id_category
       JOIN stores s ON p.id_store = s.id_store
       JOIN users su ON su.id_user = s.id_user AND su.role = 'seller' AND su.status = 'active' AND ${activeAccountSql('su')}
       WHERE p.id_product = $1`,
      [productId]
    );

    if (resProductCheck.rows.length > 0) {
      product = resProductCheck.rows[0];
    }

    const resReviews = await pool.query(
      `SELECT r.id_review, r.rating, r.komentar, r.created_at, u.nama
       FROM reviews r
       JOIN users u ON r.id_user = u.id_user
       WHERE r.id_product = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );
    reviews = resReviews.rows;

    if (reviews.length > 0) {
      let totalScore = 0;
      for (let idx = 0; idx < reviews.length; idx += 1) {
        totalScore += Number(reviews[idx].rating);
      }
      avgRating = (totalScore / reviews.length).toFixed(1);
    }

    const resImages = await pool.query(
      'SELECT gambar FROM product_images WHERE id_product = $1 ORDER BY urutan ASC',
      [productId]
    );
    const loadedImages = [];
    for (const imgRow of resImages.rows) {
      loadedImages.push(imgRow.gambar);
    }
    images = loadedImages;

    const resSizes = await pool.query(
      'SELECT ukuran, stok FROM product_sizes WHERE id_product = $1 ORDER BY urutan ASC',
      [productId]
    );
    sizes = resSizes.rows;

    wishlistIds = await getWishlistIds(session);
  } catch (error) {
    console.error('Failed to load product detail:', error.message);
  }

  if (!product) {
    notFound();
  }

  const isWishlisted = wishlistIds.includes(product.id_product);

  if (images.length === 0 && product.gambar) {
    images = [product.gambar];
  }

  let isShopper = false;
  if (session && (session.role === 'buyer' || session.role === 'seller')) {
    isShopper = true;
  }

  let isOwnProduct = false;
  if (session && session.storeId && session.storeId === product.id_store) {
    isOwnProduct = true;
  }

  let purchaseSection = null;
  if (!session) {
    let isOutOfStock = false;
    if (product.stok <= 0) {
      isOutOfStock = true;
    }

    purchaseSection = (
      <div className="pt-4 flex items-center gap-3">
        <div className="flex-1">
          <AddToCartButton
            productId={product.id_product}
            isLoggedIn={false}
            disabled={isOutOfStock}
            className="py-3.5! text-sm! rounded-xl bg-neutral-950 text-white hover:bg-neutral-800"
          />
        </div>
        <WishlistToggle
          productId={product.id_product}
          isLoggedIn={false}
          className="p-3.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-400"
        />
      </div>
    );
  } else if (isOwnProduct) {
    purchaseSection = (
      <div className="pt-4 p-4 rounded-xl bg-white border border-dashed border-neutral-300 text-sm text-neutral-600">
        This product belongs to your store, so you can&apos;t buy it.{' '}
        <Link
          href={`/seller/products/${product.id_product}/edit`}
          className="font-semibold text-neutral-900 underline underline-offset-4"
        >
          Edit in Seller Center
        </Link>
      </div>
    );
  } else if (isShopper) {
    purchaseSection = (
      <div className="space-y-3">
        <AddToCartForm productId={product.id_product} sizes={sizes} />
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <WishlistToggle
            productId={product.id_product}
            initialWishlisted={isWishlisted}
            isLoggedIn={true}
            className="p-2.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-400"
          />
          <span>Save to wishlist</span>
        </div>
      </div>
    );
  }

  let reviewListContent = null;
  if (reviews.length === 0) {
    reviewListContent = (
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center">
        <p className="text-sm text-neutral-500">
          No reviews yet for this product.
        </p>
      </div>
    );
  } else {
    reviewListContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(function buildReviewCard(reviewItem) {
          const filledStars = '★'.repeat(reviewItem.rating);
          const emptyStars = '★'.repeat(5 - reviewItem.rating);
          return (
            <div
              key={reviewItem.id_review}
              className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">
                  {reviewItem.nama}
                </p>
                <span className="text-xs font-medium text-amber-500">
                  {filledStars}
                  <span className="text-neutral-300">{emptyStars}</span>
                </span>
              </div>
              <p className="text-xs text-neutral-600">{reviewItem.komentar}</p>
              <p className="text-[11px] text-neutral-400">
                {formatDate(reviewItem.created_at)}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  let stockBadgeClass = '';
  let stockBadgeText = `Stock: ${product.stok}`;
  if (product.stok <= 0) {
    stockBadgeClass = 'text-red-600 font-medium';
    stockBadgeText = 'Out of stock';
  }

  let ratingSummaryText = 'No rating yet';
  if (avgRating > 0) {
    ratingSummaryText = `${avgRating} / 5.0`;
  }

  let descriptionText = 'No product description provided.';
  if (product.deskripsi) {
    descriptionText = product.deskripsi;
  }

  let storeAvatarElement = (
    <span className="w-11 h-11 rounded-full bg-neutral-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
      {product.nama_toko.charAt(0).toUpperCase()}
    </span>
  );
  if (product.gambar_toko) {
    storeAvatarElement = (
      <img
        src={product.gambar_toko}
        alt={product.nama_toko}
        className="w-11 h-11 rounded-full object-cover border border-neutral-200 shrink-0"
      />
    );
  }

  let storeDescriptionElement = null;
  if (product.deskripsi_toko) {
    storeDescriptionElement = (
      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
        {product.deskripsi_toko}
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-(--abumuda) text-neutral-900">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-12">
        <nav className="flex items-center gap-2 text-xs text-neutral-500">
          <Link href="/" className="hover:text-neutral-900">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-neutral-900">
            Products
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium truncate">
            {product.nama_produk}
          </span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,420px)_1fr] gap-8 md:gap-12 items-start">
          <ProductGallery images={images} alt={product.nama_produk} />

          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="px-2.5 py-1 bg-white border border-neutral-200 rounded-full font-medium text-neutral-800">
                {product.nama_kategori}
              </span>
              <span>•</span>
              <span>{product.segmen}</span>
              <span>•</span>
              <span className={stockBadgeClass}>{stockBadgeText}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-neutral-950">
              {product.nama_produk}
            </h1>

            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="text-amber-500 text-sm">★</span>
              <span className="font-semibold text-neutral-900">
                {ratingSummaryText}
              </span>
              <span>({reviews.length} reviews)</span>
            </div>

            <p className="text-2xl font-bold text-neutral-950">
              Rp {Number(product.harga).toLocaleString('id-ID')}
            </p>

            <div className="pt-4 border-t border-neutral-200/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Description
              </h2>
              <p className="text-sm text-neutral-700 whitespace-pre-line">
                {descriptionText}
              </p>
            </div>

            <Link
              href={`/stores/${product.id_store}`}
              className="group p-4 bg-white border border-neutral-200/80 rounded-2xl flex items-center gap-3 hover:border-neutral-400 hover-lift"
            >
              {storeAvatarElement}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-neutral-400 uppercase tracking-wider">
                  Official Store
                </p>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                  {product.nama_toko}
                </p>
                {storeDescriptionElement}
              </div>
              <span className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border border-neutral-900 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-200">
                Visit Store
              </span>
            </Link>

            {purchaseSection}
          </div>
        </div>

        <section className="pt-10 border-t border-neutral-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-950">
              Rating & Reviews ({reviews.length})
            </h2>
          </div>

          {reviewListContent}
        </section>
      </main>
    </div>
  );
}