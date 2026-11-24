import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/token';


// halaman tujuan awal berdasarkan role akun user
function homeForRole(role) {
  if (role === 'admin') {
    return '/admin/dashboard';
  }
  if (role === 'seller') {
    return '/seller/dashboard';
  }
  return '/';
}

// cek sesi login n mengatur hak akses rute halaman sesuai role user
export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const cookieItem = request.cookies.get('fitfound_session');
  let token = null;
  if (cookieItem) {
    token = cookieItem.value;
  }

  let user = null;
  if (token) {
    user = await verifyToken(token);
  }

  const isAdminArea = pathname.startsWith('/admin');
  const isSellerArea = pathname.startsWith('/seller');
  const isBuyerArea = pathname.startsWith('/buyer');

  if (user && user.role === 'admin' && !isAdminArea) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // seller tidak punya halaman belanja (home, produk, keranjang, dll), langsung ke dashboard seller
  if (user && user.role === 'seller' && !isSellerArea) {
    return NextResponse.redirect(new URL('/seller/dashboard', request.url));
  }


  // sesi kadaluarsa / akunnya sudah tidak ada di database (misal habis jalankan ulang seed):
  // hapus cookie lama supaya tidak bolak-balik redirect (ERR_TOO_MANY_REDIRECTS)
  if (pathname === '/login' && request.nextUrl.searchParams.has('expired')) {
    const loginResponse = NextResponse.next();
    loginResponse.cookies.delete('fitfound_session');
    return loginResponse;
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL(homeForRole(user.role), request.url));
  }


  if (!isAdminArea && !isSellerArea && !isBuyerArea) {
    return NextResponse.next();
  }


  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }


  if (isAdminArea && user.role !== 'admin') {
    return NextResponse.redirect(new URL(homeForRole(user.role), request.url));
  }


  if (isSellerArea && user.role !== 'seller') {
    return NextResponse.redirect(new URL('/buyer/dashboard', request.url));
  }

  if (isBuyerArea && user.role !== 'buyer' && user.role !== 'seller') {
    return NextResponse.redirect(new URL(homeForRole(user.role), request.url));
  }


  return NextResponse.next();
}


export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|.*\\..*).*)',
      missing: [{ type: 'header', key: 'next-action' }],
    },
  ],
};