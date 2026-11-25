import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="w-full bg-white text-black mt-16 border-t border-neutral-500">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-6 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-black">
          <div className="md:col-span-5 space-y-4">
            <Logo href="/" />

            <p className="text-xs text-black max-w-sm">
              We have clothes that suit your style and which you are proud to
              wear. From women to men and kids, all from trusted fashion
              stores.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-black">
              Shop
            </h3>
            <ul className="space-y-2.5 text-xs text-black">
              <li>
                <Link
                  href="/?segment=Women"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Women
                </Link>
              </li>
              <li>
                <Link
                  href="/?segment=Men"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Men
                </Link>
              </li>
              <li>
                <Link
                  href="/?segment=Kids"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Kids
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-black">
              Categories
            </h3>
            <ul className="space-y-2.5 text-xs text-black">
              <li>
                <Link
                  href="/?kategori=Tops"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Tops
                </Link>
              </li>
              <li>
                <Link
                  href="/?kategori=Bottoms"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Bottoms
                </Link>
              </li>
              <li>
                <Link
                  href="/?kategori=Outerwear"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Outerwear
                </Link>
              </li>
              <li>
                <Link
                  href="/?kategori=Shoes"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Shoes
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-black">
              Account & Seller
            </h3>
            <ul className="space-y-2.5 text-xs text-black">
              <li>
                <Link
                  href="/login"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="link-underline transition-colors duration-200 hover:text-black"
                >
                  Create Buyer Account
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="link-underline transition-colors duration-200 hover:text-black"
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