import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="w-full bg-(--abumuda) border-t border-neutral-200 text-neutral-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-neutral-200">
          <div className="md:col-span-5 space-y-4">
            <Logo href="/" />

            <p className="text-xs text-neutral-500 max-w-sm">
              We have clothes that suit your style and which you are proud to
              wear. From women to men and kids, all from trusted fashion
              stores.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-950">
              Shop
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-500">
              <li>
                <Link href="/?segment=Women" className="hover:text-neutral-950 transition">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/?segment=Men" className="hover:text-neutral-950 transition">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/?segment=Kids" className="hover:text-neutral-950 transition">
                  Kids
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-neutral-950 transition">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-950">
              Categories
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-500">
              <li>
                <Link href="/?kategori=Tops" className="hover:text-neutral-950 transition">
                  Tops
                </Link>
              </li>
              <li>
                <Link href="/?kategori=Bottoms" className="hover:text-neutral-950 transition">
                  Bottoms
                </Link>
              </li>
              <li>
                <Link href="/?kategori=Outerwear" className="hover:text-neutral-950 transition">
                  Outerwear
                </Link>
              </li>
              <li>
                <Link href="/?kategori=Shoes" className="hover:text-neutral-950 transition">
                  Shoes
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-950">
              Account & Seller
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-500">
              <li>
                <Link href="/login" className="hover:text-neutral-950 transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-neutral-950 transition">
                  Create Buyer Account
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-neutral-950 transition">
                  Open a Store (Seller)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>FITFOUND © 2026. All Rights Reserved.</p>
          <p>Find Your Fit, Find Your Own Style</p>
        </div>
      </div>
    </footer>
  );
}