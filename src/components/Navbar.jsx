'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MAIN_SEGMENTS, buildSubMenu, getAccessoriesItems, buildCategoryHref } from '@/data/navigation';
import LiveSearchInput from '@/components/LiveSearchInput';
import Logo from '@/components/Logo';
import { openLoginPrompt } from '@/components/LoginPrompt';
import { FiMenu, FiX, FiUser, FiSearch, FiChevronDown, FiHeart, FiShoppingCart } from 'react-icons/fi';

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
export default function Navbar({ session, cartCount = 0, categories = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCatalogPage = pathname === '/' || pathname === '/products';
  const urlSearch = searchParams.get('q') || '';
  const activeSegment = searchParams.get('segment') || '';
  const activeKategori = searchParams.get('kategori') || '';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopAccessoriesOpen, setDesktopAccessoriesOpen] = useState(false);
  const [mobileAccessoriesOpen, setMobileAccessoriesOpen] = useState(false);
  const [drawerSegment, setDrawerSegment] = useState(activeSegment);

  const mobileInputRef = useRef(null);
  const desktopDropdownRef = useRef(null);
  const scrollTopAfterNavRef = useRef(false);

  const subMenu = buildSubMenu(categories);
  const accessoryNames = categories
    .filter((category) => category.grup_kategori === 'Accessories')
    .map((category) => category.nama_kategori);

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

  // cek ? nama kategori lagi aktif di katalog
  function isKategoriActive(value) {
    return isCatalogPage && activeKategori !== '' && activeKategori.toLowerCase() === value.toLowerCase();
  }

  const isAccessoriesActive =
    isKategoriActive('Accessories') || accessoryNames.some((name) => isKategoriActive(name));

  // tentukan alamat tujuan dan status aktif item menu baris kedua
  function menuTarget(cat, segment) {
    if (cat.isSpecialLink) {
      let isActive = pathname === cat.href;
      if (cat.href === '/products') {
        isActive = pathname === '/products' && activeKategori === '';
      }
      return { href: cat.href, isActive };
    }
    return { href: buildCategoryHref(segment, cat.value), isActive: isKategoriActive(cat.value) };
  }

  // tutup menu drawer, pencarian mobile, n dropdown accessories
  function closeAllMenus() {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setDesktopAccessoriesOpen(false);
  }

  // buka/tutup drawer menu tampilan mobile
  function toggleMobileMenu() {
    if (!mobileMenuOpen) {
      setDrawerSegment(activeSegment);
    }
    setMobileMenuOpen(!mobileMenuOpen);
    setMobileSearchOpen(false);
  }

  // buka/tutup panel pencarian pada tampilan mobile
  function toggleMobileSearch() {
    setMobileSearchOpen(!mobileSearchOpen);
    setMobileMenuOpen(false);
  }

  // fokus input pencarian mobile saat panel pencarian dibuka
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // lihat klik di luar dropdown accessories desktop spy tertutup otomatis
  useEffect(() => {
    function handleClickOutside(event) {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
        setDesktopAccessoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // daftar link dropdown accessories sesuai segmen aktif
  function renderAccessoryLinks(segment, classOn, classOff) {
    return ['Accessories', ...getAccessoriesItems(segment, accessoryNames)].map((name) => {
      let label = name;
      if (name === 'Accessories') {
        label = 'All Accessories';
      }
      return renderNavLink(buildCategoryHref(segment, name), label, pick(isKategoriActive(name), classOn, classOff));
    });
  }

  let mobileDrawer = null;
  if (mobileMenuOpen) {
    mobileDrawer = (
      <div className="md:hidden absolute left-0 right-0 top-full h-[calc(100vh-8.75rem)] bg-(--abumuda) border-t border-neutral-200 z-50 overflow-y-auto animate-dropdown">
        <div className="px-6 py-2 divide-y divide-neutral-200/70">
          {subMenu.map((cat) => {
            if (cat.hasDropdown) {
              return (
                <div key={cat.label}>
                  <button
                    type="button"
                    onClick={() => setMobileAccessoriesOpen(!mobileAccessoriesOpen)}
                    className="w-full flex items-center justify-between py-4 text-xs font-medium tracking-wider uppercase text-neutral-900 hover:text-neutral-600 cursor-pointer"
                  >
                    <span className={pick(isAccessoriesActive, 'font-bold underline underline-offset-4', '')}>
                      {cat.label}
                    </span>
                    <FiChevronDown
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${pick(mobileAccessoriesOpen, 'rotate-180', '')}`}
                      aria-hidden="true"
                    />
                  </button>
                  {mobileAccessoriesOpen && (
                    <div className="pl-5 pb-3 space-y-1">
                      {renderAccessoryLinks(
                        drawerSegment,
                        'block py-2.5 text-xs tracking-wider uppercase text-neutral-950 font-bold underline underline-offset-4',
                        'block py-2.5 text-xs font-medium tracking-wider uppercase text-neutral-600 hover:text-neutral-950'
                      )}
                    </div>
                  )}
                </div>
              );
            }

            const { href, isActive } = menuTarget(cat, drawerSegment);
            return renderNavLink(
              href,
              cat.label,
              `block py-4 text-xs tracking-wider uppercase ${pick(
                isActive,
                'font-bold text-neutral-950 underline underline-offset-4',
                'font-medium text-neutral-900 hover:text-neutral-600'
              )}`
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 space-y-1">
          {showShoppingIcons && (
            <ShopLink
              session={session}
              href="/buyer/wishlist"
              label="Wishlist"
              loginMessage="Sign in to view and save items to your wishlist."
              onClick={closeAllMenus}
              className={`w-full cursor-pointer ${DRAWER_ROW}`}
            >
              <FiHeart className="w-5 h-5 text-neutral-800" />
              <span>Wishlist</span>
            </ShopLink>
          )}

          {isSeller && (
            <a href={sellerLink.href} onClick={closeAllMenus} className={`${DRAWER_ROW} font-semibold text-neutral-900`}>
              <span className="w-5 h-5 inline-flex items-center justify-center rounded-md bg-neutral-900 text-white text-[10px]">
                S
              </span>
              <span>{sellerLink.label}</span>
            </a>
          )}

          <a
            href={profileHref}
            onClick={closeAllMenus}
            className={`${DRAWER_ROW} ${pick(session, 'font-medium text-neutral-900', '')}`}
          >
            <FiUser className="w-5 h-5 text-neutral-800" aria-hidden="true" />
            <span>{pick(session, 'My Account', 'Sign In | Register')}</span>
          </a>
        </div>
      </div>
    );
  }

  let mobileMenuIcon = <FiMenu className="w-6 h-6 text-neutral-900" />;
  if (mobileMenuOpen) {
    mobileMenuIcon = <FiX className="w-6 h-6 text-neutral-900" />;
  }

  let badgeLabel = String(cartCount);
  if (cartCount > 99) {
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

      <header className="w-full bg-(--abumuda) border-b border-neutral-200 sticky top-0 z-40">
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

            <nav className="hidden md:flex items-center gap-8 text-base font-medium text-neutral-600">
              {MAIN_SEGMENTS.map((item) => {
                const isActive = isCatalogPage && activeSegment.toLowerCase() === item.value.toLowerCase();
                return renderNavLink(
                  buildCategoryHref(item.value, ''),
                  item.label,
                  `link-underline transition-colors duration-200 ${pick(isActive, 'font-semibold text-neutral-950', 'hover:text-neutral-950')}`,
                  { 'data-active': pick(isActive, 'true', 'false') }
                );
              })}
            </nav>
          </div>

          <SearchForm
            urlSearch={urlSearch}
            onSubmit={handleSearchSubmit}
            onNavigate={closeAllMenus}
            placeholder="Search products..."
            formClass="hidden md:flex w-72 lg:w-96 ml-auto items-center justify-between bg-white px-4 py-2.5 rounded-lg focus-within:ring-1 focus-within:ring-neutral-400"
            inputClass="placeholder:text-neutral-400"
            iconClass="w-4 h-4"
          />

          <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
            <button
              type="button"
              onClick={toggleMobileSearch}
              aria-label="Search Products"
              className="md:hidden p-1 hover:opacity-70 transition cursor-pointer"
            >
              <FiSearch className="w-5 h-5 text-neutral-800" />
            </button>

            {showShoppingIcons && (
              <>
                <ShopLink
                  session={session}
                  href="/buyer/wishlist"
                  label="Wishlist"
                  loginMessage="Sign in to view and save items to your wishlist."
                  onClick={closeAllMenus}
                  className={`hidden md:inline-flex ${ICON_BUTTON}`}
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
                  {cartCount > 0 && (
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

        <nav className="md:hidden grid grid-cols-4 border-t border-neutral-200/70 bg-(--abumuda) text-center text-sm tracking-wider uppercase">
          {MAIN_SEGMENTS.map((item) => {
            const segment = pick(mobileMenuOpen, drawerSegment, activeSegment);
            const isActive = (mobileMenuOpen || isCatalogPage) && segment.toLowerCase() === item.value.toLowerCase();
            const tabClass = `w-full py-3 transition cursor-pointer ${pick(
              isActive,
              'font-bold text-neutral-950 border-b-2 border-neutral-950',
              'font-medium text-neutral-400 hover:text-neutral-800'
            )}`;

            if (mobileMenuOpen) {
              return (
                <button key={item.label} type="button" onClick={() => setDrawerSegment(item.value)} className={tabClass}>
                  {item.label}
                </button>
              );
            }
            return renderNavLink(buildCategoryHref(item.value, ''), item.label, tabClass);
          })}
        </nav>

        <div className="hidden md:block border-t border-neutral-200/70 bg-(--abumuda)">
          <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-center gap-8 text-sm text-neutral-600">
            {subMenu.map((cat) => {
              if (cat.hasDropdown) {
                return (
                  <div key={cat.label} ref={desktopDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setDesktopAccessoriesOpen(!desktopAccessoriesOpen)}
                      className={`inline-flex items-center gap-1.5 transition cursor-pointer ${pick(
                        isAccessoriesActive || desktopAccessoriesOpen,
                        'font-semibold text-neutral-950',
                        'hover:text-neutral-950'
                      )}`}
                    >
                      <span className="link-underline" data-active={pick(isAccessoriesActive, 'true', 'false')}>
                        {cat.label}
                      </span>
                      <FiChevronDown
                        className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${pick(desktopAccessoriesOpen, 'rotate-180', '')}`}
                        aria-hidden="true"
                      />
                    </button>
                    {desktopAccessoriesOpen && (
                      <div className="absolute left-0 top-full mt-2.5 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 z-50 animate-dropdown">
                        {renderAccessoryLinks(
                          activeSegment,
                          'block px-4 py-2 text-sm transition font-semibold text-neutral-950 bg-(--abumuda) underline underline-offset-4',
                          'block px-4 py-2 text-sm transition text-neutral-600 hover:text-neutral-950 hover:bg-(--abumuda)'
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              const { href, isActive } = menuTarget(cat, activeSegment);
              return renderNavLink(
                href,
                cat.label,
                `link-underline transition-colors duration-200 ${pick(isActive, 'font-semibold text-neutral-950', 'hover:text-neutral-950')}`,
                { 'data-active': pick(isActive, 'true', 'false') }
              );
            })}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-(--abumuda) px-4 py-3 border-b border-neutral-200 shadow-lg z-50 animate-dropdown">
            <SearchForm
              urlSearch={urlSearch}
              onSubmit={handleSearchSubmit}
              onNavigate={closeAllMenus}
              inputRef={mobileInputRef}
              placeholder="Search..."
              formClass="flex items-center justify-between bg-(--abutab) px-4 py-3 rounded-lg"
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