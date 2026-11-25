import { redirect } from 'next/navigation';

// alamat sekarang ada di halaman My Profile, link lama /buyer/addresses diarahkan ke sana
export default async function AddressesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  if (resolvedSearchParams && typeof resolvedSearchParams.edit === 'string') {
    redirect(`/buyer/dashboard?edit=${encodeURIComponent(resolvedSearchParams.edit)}#addresses`);
  }
  redirect('/buyer/dashboard#addresses');
}