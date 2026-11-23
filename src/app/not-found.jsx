import Link from 'next/link';

// tampilkan halaman 404 saat rute atau data tidak ditemukan
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-6xl font-black text-neutral-900">404</p>
      <p className="mt-3 text-sm text-neutral-500">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 px-5 py-2.5 text-sm font-medium bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}