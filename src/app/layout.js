import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoginPrompt from '@/components/LoginPrompt';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

export const metadata = {
  title: 'FITFOUND',
  description: 'Find Your Fit, Find Your Own Style. Multi-role fashion e-commerce platform',
  icons: {
    icon: '/images/logo.png',
  },
};

// muat sesi, jumlah keranjang, kategori, bagian utama seluruh halaman
export default async function RootLayout({ children }) {
  const session = await getSession();

  let cartCount = 0;
  if (session && (session.role === 'buyer' || session.role === 'seller')) {
    try {
      const cartResult = await pool.query(
        `SELECT COALESCE(SUM(ci.jumlah), 0)::int AS total
         FROM cart_items ci
         JOIN carts c ON c.id_cart = ci.id_cart
         WHERE c.id_user = $1`,
        [session.id]
      );
      cartCount = cartResult.rows[0].total;
    } catch (cartError) {
      console.error('Failed to load cart count:', cartError.message);
    }
  }

  let categories = [];
  try {
    const categoryResult = await pool.query(
      'SELECT nama_kategori, grup_kategori FROM categories ORDER BY nama_kategori ASC'
    );
    categories = categoryResult.rows;
  } catch (categoryError) {
    console.error('Failed to load categories:', categoryError.message);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-(--abumuda) text-neutral-900 antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <Navbar session={session} cartCount={cartCount} categories={categories} />
        </Suspense>
        {children}
        <Footer />
        <LoginPrompt />
      </body>
    </html>
  );
}