import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="w-full bg-white text-black mt-16 border-t border-neutral-500">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-6 md:pb-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-7 md:gap-10 pb-8 md:pb-10 border-b border-black">
          <div className="col-span-2 md:col-span-5 space-y-3 md:space-y-4">
            <Logo href="/" />

            <p className="text-xs text-black max-w-sm">
              We have clothes that suit your style and which you are proud to
              wear. From women to men and kids, all from trusted fashion
              stores.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2.5 md:space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-black">
              Shop
            </h3>
            <ul className="space-y-2 text-xs text-black">
              <li>
                <Link
                  href="/products?segment=Women"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Women
                </Link>
              </li>
              <li>
                <Link
                  href="/products?segment=Men"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  href="/products?segment=Kids"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Kids
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2.5 md:space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-black">
              Categories
            </h3>
            <ul className="space-y-2 text-xs text-black">
              <li>
                <Link
                  href="/products?kategori=Tops"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Tops
                </Link>
              </li>
              <li>
                <Link
                  href="/products?kategori=Bottoms"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Bottoms
                </Link>
              </li>
              <li>
                <Link
                  href="/products?kategori=Outerwear"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Outerwear
                </Link>
              </li>
              <li>
                <Link
                  href="/products?kategori=Shoes"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Shoes
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3 space-y-2.5 md:space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-black">
              Account & Seller
            </h3>
            <ul className="space-y-2 text-xs text-black">
              <li>
                <Link
                  href="/login"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Create Buyer Account
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:underline underline-offset-4 hover:text-black transition"
                >
                  Open a Store (Seller)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-black">
          <p>FITFOUND © 2026. All Rights Reserved.</p>
          <p>Find Your Fit, Find Your Own Style</p>
        </div>
      </div>
    </footer>
  );
}