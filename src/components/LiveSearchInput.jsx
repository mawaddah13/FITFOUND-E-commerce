'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// tampil input pencarian langsung dengan daftar saran produk saat diketik
export default function LiveSearchInput({ defaultValue = '', inputRef, className, placeholder, onNavigate }) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // ambil saran produk dari api, abis jeda ketikan 300 ms
  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(keyword)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // lihat klik di luar kotak pencarian untuk menutup dropdown saran
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // tutup dropdown saran n nginfo ke navbar saat item dipilih
  function handleSelect() {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate();
    }
  }

  const showDropdown = isOpen && query.trim().length >= 2;
  let visibleResults = [];
  if (query.trim().length >= 2) {
    visibleResults = results;
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        name="q"
        value={query}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`${className || ''} focus:shadow-none`}
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50 animate-dropdown">
          {isLoading && visibleResults.length === 0 && (
            <p className="px-4 py-3 text-xs text-neutral-500">Searching...</p>
          )}
          {!isLoading && visibleResults.length === 0 && (
            <p className="px-4 py-3 text-xs text-neutral-500">No products found.</p>
          )}
          {visibleResults.map((item) => {
            let imageNode = null;
            if (item.gambar) {
              imageNode = <img src={item.gambar} alt="" className="w-full h-full object-cover" />;
            }

            return (
              <Link
                key={item.id_product}
                href={`/products/${item.id_product}`}
                onClick={handleSelect}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-(--abumuda) transition"
              >
                <span className="w-9 h-11 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                  {imageNode}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-neutral-900 truncate">{item.nama_produk}</span>
                  <span className="block text-[11px] text-neutral-500">
                    {item.nama_kategori} · Rp {Number(item.harga).toLocaleString('id-ID')}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}