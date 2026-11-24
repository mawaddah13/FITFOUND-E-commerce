import { redirect } from 'next/navigation';
import { requireSellerPage } from '@/lib/auth';

// seller wajib isi no hp n alamat dulu di Store Profile sebelum beraktivitas (tambah / edit produk)
export function isSellerProfileComplete(user) {
  return Boolean(user.no_hp && user.alamat);
}

// sama seperti requireSellerPage, tp kalau no hp / alamat masih kosong diarahkan ke Store Profile
export async function requireCompleteSellerPage() {
  const sellerData = await requireSellerPage();
  if (!isSellerProfileComplete(sellerData.user)) {
    redirect('/seller/store?complete=1');
  }
  return sellerData;
}