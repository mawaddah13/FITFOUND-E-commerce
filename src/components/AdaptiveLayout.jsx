'use client';

import { usePathname } from 'next/navigation';

// login & register juga tanpa navbar n footer
const HIDDEN_PREFIXES = ['/admin', '/seller', '/login', '/register'];

// sembunyikan header dan footer pada halaman autentikasi atau dasbor peran
export default function AdaptiveLayout({ header, footer, children }) {
  const pathname = usePathname();

  let hideChrome = false;
  for (const prefix of HIDDEN_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      hideChrome = true;
      break;
    }
  }

  if (hideChrome) {
    return <main>{children}</main>;
  }

  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}