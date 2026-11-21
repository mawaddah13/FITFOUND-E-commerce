import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';
import WishlistToggle from '@/components/WishlistToggle';
import { FiShoppingBag } from 'react-icons/fi';
import { formatRupiah } from '@/lib/format';


// tampilkan kartu produk dgn info harga, rating, toko, wishlist, n tombol aksi
export default function ProductCard({
  product,
  session,
  isWishlisted = false,
  refreshOnWishlist = false,
  index = 0,
}) {
  const isGuest = !session;
  const isShopper = Boolean(session && (session.role === 'buyer' || session.role === 'seller'));
  const isOwnProduct = Boolean(session && session.storeId && session.storeId === product.id_store);
  const isOutOfStock = Number(product.stok) <= 0;

  let imageContent = (
    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No Image</div>
  );
  if (product.gambar) {
    let imageEffectClass = 'group-hover:scale-[1.06]';
    if (isOutOfStock) {
      imageEffectClass = 'grayscale';
    }

    imageContent = (
      <img
        src={product.gambar}
        alt={product.nama_produk}
        loading="lazy"
        className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${imageEffectClass}`}
      />
    );
  }

  let soldCount = 0;
  if (product.jumlah_terjual) {
    soldCount = Number(product.jumlah_terjual);
  }

  let reviewCount = 0;
  if (product.review_count) {
    reviewCount = Number(product.review_count);
  }

  const hasRating = Boolean(product.avg_rating && reviewCount > 0);
  let ratingInfo = null;
  if (hasRating || soldCount > 0) {
    let ratingPart = null;
    if (hasRating) {
      ratingPart = (
        <>
          <span className="text-amber-500">★</span> {Number(product.avg_rating).toFixed(1)} ({reviewCount})
        </>
      );
    }

    let separatorText = '';
    if (hasRating && soldCount > 0) {
      separatorText = ' · ';
    }

    let soldText = '';
    if (soldCount > 0) {
      soldText = `${soldCount} sold`;
    }

    ratingInfo = (
      <p className="text-[11px] text-neutral-950 mt-0.5">
        {ratingPart}
        {separatorText}
        {soldText}
      </p>
    );
  }

  let soldOutBadge = null;
  if (isOutOfStock) {
    soldOutBadge = (
      <span className="absolute left-2.5 top-2.5 px-2 py-1 text-[10px] font-semibold bg-neutral-500 text-white rounded-full">
        SOLD OUT
      </span>
    );
  }

  let actionButton = null;
  if (isOwnProduct) {
    actionButton = (
      <p className="py-2 text-center text-xs font-medium text-neutral-950 border border-dashed border-neutral-300 rounded-lg">
        Your product
      </p>
    );
  } else if (isGuest || isShopper) {
    actionButton = (
        // kirim props
      <AddToCartButton
        productId={product.id_product}
        isLoggedIn={!isGuest}
        disabled={isOutOfStock}
        className="rounded-lg bg-neutral-900 text-white hover:bg-neutral-700"
      />
    );
  }

  let wishlistButton = null;
  if ((isGuest || isShopper) && !isOwnProduct) {
    wishlistButton = (
      <WishlistToggle
        productId={product.id_product}
        initialWishlisted={isWishlisted}
        isLoggedIn={!isGuest}
        refreshOnChange={refreshOnWishlist}
        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-sm opacity-90 group-hover:opacity-100"
      />
    );
  }

  let cardStockClass = '';
  if (isOutOfStock) {
    cardStockClass = 'opacity-70';
  }

  return (
    <div className="group flex flex-col justify-between animate-stagger" style={{ '--i': index }}>
      <div className={`relative ${cardStockClass}`}>
        <Link href={`/products/${product.id_product}`} className="block">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 mb-3 relative transition-shadow duration-300 group-hover:shadow-[0_18px_35px_-20px_rgba(0,0,0,0.45)]">
            {imageContent}
            {soldOutBadge}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1">
            {product.nama_kategori}
          </p>
          <h3 className="text-sm font-medium text-neutral-900 line-clamp-1 transition-colors duration-200 group-hover:text-(--biru)">
            {product.nama_produk}
          </h3>
          <p className="text-sm font-semibold text-neutral-800 mt-1">{formatRupiah(product.harga)}</p>
          {ratingInfo}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-700">
            <FiShoppingBag className="w-3.5 h-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
            <span className="truncate">{product.nama_toko}</span>
          </p>
        </Link>
        {wishlistButton}
      </div>

      <div className="mt-3">{actionButton}</div>
    </div>
  );
}