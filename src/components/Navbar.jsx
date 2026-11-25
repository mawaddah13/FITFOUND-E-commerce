'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MAIN_SEGMENTS, buildCategoryHref } from '@/data/navigation';
import LiveSearchInput from '@/components/LiveSearchInput';
import Logo from '@/components/Logo';
import LogoutButton from '@/components/LogoutButton';
import { openLoginPrompt } from '@/components/LoginPrompt';
import { recordPage } from '@/lib/pageTrail';
import { FiMenu, FiX, FiUser, FiSearch, FiHeart, FiShoppingCart } from 'react-icons/fi';

const ICON_BUTTON = 'p-1 hover:opacity-70 hover:-translate-y-0.5 transition cursor-pointer';
const DRAWER_ROW = 'flex items-center gap-3 py-3 text-sm text-neutral-800 hover:text-black';

// pilih class aktif atau nonaktif sesuai kondisi
function pick(isActive, classOn, classOff) {
  if (isActive) {
    return classOn;
  }
  return classOff;
}

// tampilkan tombol belanja atau buka pop up login guest
function ShopLink({ session, href, label, loginMessage, onClick, className, children }) {
  if (!session) {
    return (
      <button
        type="button"
        aria-label={label}
        className={className}
        onClick={() => {
          onClick();
          openLoginPrompt(loginMessage);
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <Link href={href} aria-label={label} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

// tampilkan form pencarian sama input saran n tombol cari
function SearchForm({ urlSearch, onSubmit, onNavigate, inputRef, placeholder, formClass, inputClass, iconClass }) {
  return (
    <form key={urlSearch} onSubmit={onSubmit} className={formClass}>
      <LiveSearchInput
        inputRef={inputRef}
        defaultValue={urlSearch}
        placeholder={placeholder}
        onNavigate={onNavigate}
        className={`w-full bg-transparent text-sm text-neutral-900 focus:outline-none ${inputClass}`}
      />
      <button
        type="submit"
        aria-label="Search"
        className="ml-2 cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <FiSearch className={iconClass} />
      </button>
    </form>
  );
}

// navbar utama, menu kategori, pencarian, ikon belanja, drawer mobile
export default function Navbar({ session, cartCount = 0 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCatalogPage = pathname === '/' || pathname === '/products';
  const urlSearch = searchParams.get('q') || '';
  const activeSegment = searchParams.get('segment') || '';
  const activeKategori = searchParams.get('kategori') || '';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // angka keranjang diperbarui langsung saat Add to Cart (tanpa render ulang halaman)
  const [liveCartCount, setLiveCartCount] = useState(cartCount);
  const [lastCartCountProp, setLastCartCountProp] = useState(cartCount);
  if (lastCartCountProp !== cartCount) {
    setLastCartCountProp(cartCount);
    setLiveCartCount(cartCount);
  }

  // catat halaman yg dibuka, dipakai breadcrumb di halaman akun (My Profile, Orders)
  const currentQuery = searchParams.toString();
  useEffect(() => {
    recordPage(pathname, new URLSearchParams(currentQuery));
  }, [pathname, currentQuery]);

  useEffect(() => {
    function handleCartUpdated(cartEvent) {
      if (cartEvent.detail && typeof cartEvent.detail.totalItems === 'number') {
        setLiveCartCount(cartEvent.detail.totalItems);
      }
    }
    window.addEventListener('fitfound:cart-updated', handleCartUpdated);
    return () => window.removeEventListener('fitfound:cart-updated', handleCartUpdated);
  }, []);

  const mobileInputRef = useRef(null);
  const scrollTopAfterNavRef = useRef(false);


  const isSeller = session && session.role === 'seller';
  const showShoppingIcons = !session || session.role === 'buyer' || isSeller;
  const isApprovedSeller = isSeller && session.status === 'active';

  let sellerLink = { href: '/seller/pending', label: 'Seller Application' };
  if (isApprovedSeller) {
    sellerLink = { href: '/seller/dashboard', label: 'Seller Center' };
  }

  let profileHref = '/login';
  if (session) {
    if (session.role === 'admin') {
      profileHref = '/admin/dashboard';
    } else {
      profileHref = '/buyer/dashboard';
    }
  }

  // tutup menu drawer n pencarian mobile
  function closeAllMenus() {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }

  // buka/tutup drawer menu tampilan mobile
  function toggleMobileMenu() {
    setMobileMenuOpen(!mobileMenuOpen);
    setMobileSearchOpen(false);
  }

  // fokus input pencarian mobile saat panel pencarian dibuka
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // proses pencarian n arahkan ke katalog
  function handleSearchSubmit(event) {
    event.preventDefault();
    closeAllMenus();

    const keyword = (new FormData(event.currentTarget).get('q') || '').toString().trim();
    let basePath = '/';
    if (pathname === '/products') {
      basePath = '/products';
    }

    const params = new URLSearchParams();
    if (isCatalogPage) {
      for (const key of ['segment', 'kategori', 'min', 'max', 'sort']) {
        const value = searchParams.get(key);
        if (value) {
          params.set(key, value);
        }
      }
    }
    if (keyword !== '') {
      params.set('q', keyword);
    }
    const query = params.toString();
    if (query) {
      router.push(`${basePath}?${query}`);
    } else {
      router.push(basePath);
    }
  }

  const currentUrlKey = `${pathname}?${searchParams.toString()}`;

  // scrolll halaman ke atas abis url berubah pas pindah halaman menu
  useEffect(() => {
    if (scrollTopAfterNavRef.current) {
      scrollTopAfterNavRef.current = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentUrlKey]);

  // cek ? href sama dengan url yang lgi dibuka
  function isCurrentUrl(href) {
    const [hrefPath, hrefQuery = ''] = href.split('?');
    const target = new URLSearchParams(hrefQuery);
    const current = new URLSearchParams(searchParams.toString());
    target.sort();
    current.sort();
    return hrefPath === pathname && target.toString() === current.toString();
  }

  // handle klik item menu untuk menutup menu dan mengatur scroll ke atas
  function handleNavClick(href) {
    closeAllMenus();
    if (isCurrentUrl(href)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollTopAfterNavRef.current = true;
    }
  }

  // link nav
  function renderNavLink(href, label, className, extraProps = {}) {
    return (
      <Link
        key={label}
        href={href}
        scroll={false}
        onClick={() => handleNavClick(href)}
        className={className}
        {...extraProps}
      >
        {label}
      </Link>
    );
  }

  // menu utama: Home, All Products, Women, Men, Kids (desktop di navbar, HP di menu hamburger)
  const desktopNavItems = [];
  for (const item of MAIN_SEGMENTS) {
    let isActive = isCatalogPage && activeSegment.toLowerCase() === item.value.toLowerCase();
    if (item.value === '' && pathname === '/products') {
      isActive = false;
    }
    desktopNavItems.push({ href: buildCategoryHref(item.value, ''), label: item.label, isActive });
    if (item.value === '') {
      desktopNavItems.push({
        href: '/products',
        label: 'All Products',
        isActive: pathname === '/products' && activeKategori === '' && activeSegment === '',
      });
    }
  }

  let mobileDrawer = null;
  if (mobileMenuOpen) {
    // menu hamburger HP: cukup Home, All Products, Women, Men, Kids (+ Wishlist), tanpa kategori n My Account
    mobileDrawer = (
      <div className="md:hidden absolute left-0 right-0 top-full h-[calc(100vh-4rem)] bg-white border-t border-neutral-200 z-50 overflow-y-auto animate-dropdown">
        <div className="px-6 py-2 divide-y divide-neutral-200/70">
          {desktopNavItems.map((item) => {
            return renderNavLink(
              item.href,
              item.label,
              `block py-4 text-sm tracking-wide ${pick(
                item.isActive,
                'font-semibold text-neutral-950',
                'font-medium text-neutral-700 hover:text-neutral-950'
              )}`
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 space-y-1">
          {isSeller && (
            <a href={sellerLink.href} onClick={closeAllMenus} className={`${DRAWER_ROW} font-semibold text-neutral-900`}>
              <span className="w-5 h-5 inline-flex items-center justify-center rounded-md bg-neutral-900 text-white text-[10px]">
                S
              </span>
              <span>{sellerLink.label}</span>
            </a>
          )}

          {/* logout di menu hamburger (Wishlist sudah jadi ikon di samping keranjang) */}
          {session && (
            <LogoutButton className="w-full flex items-center py-3 text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer">
              Logout
            </LogoutButton>
          )}
        </div>
      </div>
    );
  }

  let mobileMenuIcon = <FiMenu className="w-6 h-6 text-neutral-900" />;
  if (mobileMenuOpen) {
    mobileMenuIcon = <FiX className="w-6 h-6 text-neutral-900" />;
  }

  let badgeLabel = String(liveCartCount);
  if (liveCartCount > 99) {
    badgeLabel = '99+';
  }

  return (
    <>
      {mobileSearchOpen && (
        <div
          onClick={() => setMobileSearchOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
        />
      )}

      <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label="Toggle Menu"
              className="p-1.5 hover:opacity-70 transition cursor-pointer"
            >
              {mobileMenuIcon}
            </button>
          </div>

          <div className="flex-1 flex justify-center md:flex-none md:justify-start items-center gap-8">
            <Logo href="/" scroll={false} onClick={() => handleNavClick('/')} />

            {/* baris kedua (Best Sellers, All Products, Tops, dst) dihapus, All Products pindah ke sini diapit Home n Women */}
            <nav className="hidden md:flex items-center gap-8 text-base font-medium text-neutral-950">
              {desktopNavItems.map((item) => {
                return renderNavLink(
                  item.href,
                  item.label,
                  `link-underline transition-colors duration-200 ${pick(item.isActive, 'font-semibold text-neutral-950', 'text-neutral-950 hover:text-black')}`,
                  { 'data-active': pick(item.isActive, 'true', 'false') }
                );
              })}
            </nav>
          </div>

          <SearchForm
            urlSearch={urlSearch}
            onSubmit={handleSearchSubmit}
            onNavigate={closeAllMenus}
            placeholder="Search products..."
            formClass="hidden md:flex w-72 lg:w-96 ml-auto items-center justify-between bg-(--abumuda) px-4 py-2.5 rounded-lg focus-within:ring-1 focus-within:ring-neutral-400"
            inputClass="placeholder:text-neutral-400"
            iconClass="w-4 h-4"
          />

          <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
            {/* ikon search di HP dihapus, cari produk lewat search bar di halaman All Products */}
            {showShoppingIcons && (
              <>
                <ShopLink
                  session={session}
                  href="/buyer/wishlist"
                  label="Wishlist"
                  loginMessage="Sign in to view and save items to your wishlist."
                  onClick={closeAllMenus}
                  className={`inline-flex ${ICON_BUTTON}`}
                >
                  <FiHeart className="w-5 h-5 text-neutral-800" />
                </ShopLink>

                <span className="relative inline-flex">
                  <ShopLink
                    session={session}
                    href="/buyer/cart"
                    label="Shopping Cart"
                    loginMessage="Sign in to view your shopping cart."
                    onClick={closeAllMenus}
                    className={`inline-flex ${ICON_BUTTON}`}
                  >
                    <FiShoppingCart className="w-5 h-5 text-neutral-800" />
                  </ShopLink>
                  {liveCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-(--biru) text-white text-[10px] font-semibold flex items-center justify-center pointer-events-none">
                      {badgeLabel}
                    </span>
                  )}
                </span>
              </>
            )}

            {isSeller && (
              <Link
                href={sellerLink.href}
                className="hidden lg:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors duration-200"
              >
                {sellerLink.label}
              </Link>
            )}

            <a href={profileHref} aria-label="User Profile" className="p-1 hover:opacity-70 hover:-translate-y-0.5 transition inline-flex">
              <FiUser className="w-5 h-5 text-neutral-800" />
            </a>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white px-4 py-3 border-b border-neutral-200 shadow-lg z-50 animate-dropdown">
            <SearchForm
              urlSearch={urlSearch}
              onSubmit={handleSearchSubmit}
              onNavigate={closeAllMenus}
              inputRef={mobileInputRef}
              placeholder="Search..."
              formClass="flex items-center justify-between bg-white border border-neutral-300 px-4 py-3 rounded-lg focus-within:border-neutral-900"
              inputClass="placeholder:text-neutral-500"
              iconClass="w-5 h-5 text-neutral-800"
            />
          </div>
        )}

        {mobileDrawer}
      </header>
    </>
  );
}