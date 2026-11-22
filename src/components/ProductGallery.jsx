'use client';

import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// galeri foto produk pake tombol kiri kanan n thumbnail kecil di bawahny
export default function ProductGallery({ images, alt }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] w-full max-w-[420px] mx-auto rounded-2xl bg-neutral-100 border border-neutral-200/70 flex items-center justify-center text-sm text-neutral-400">
        No Image Available
      </div>
    );
  }

  const hasMany = images.length > 1;

  // mundur ke foto sebelumnya, kalau di foto pertama balik ke foto terakhir
  function showPrev() {
    const prevIndex = (activeIndex - 1 + images.length) % images.length;
    setActiveIndex(prevIndex);
  }

  // maju ke foto berikutnya, kalau di foto terakhir balik ke foto pertama
  function showNext() {
    const nextIndex = (activeIndex + 1) % images.length;
    setActiveIndex(nextIndex);
  }

  let navigationControls = null;
  if (hasMany) {
    navigationControls = (
      <>
        <button
          type="button"
          onClick={showPrev}
          aria-label="Previous photo"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity duration-200 cursor-pointer"
        >
          <FiChevronLeft className="w-4 h-4 text-neutral-800" />
        </button>
        <button
          type="button"
          onClick={showNext}
          aria-label="Next photo"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity duration-200 cursor-pointer"
        >
          <FiChevronRight className="w-4 h-4 text-neutral-800" />
        </button>
        <span className="absolute right-2.5 bottom-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px]">
          {activeIndex + 1}/{images.length}
        </span>
      </>
    );
  }

  let thumbnailGrid = null;
  if (hasMany) {
    thumbnailGrid = (
      <div className="grid grid-cols-5 gap-2">
        {images.map(function buildThumbnailButton(imageSrc, imageIndex) {
          let thumbBorderClass = 'border-transparent opacity-60 hover:opacity-100';
          if (imageIndex === activeIndex) {
            thumbBorderClass = 'border-neutral-900';
          }

          // pilih foto utama berdasarkan thumbnail yg diklik
          function handleSelectThumbnail() {
            setActiveIndex(imageIndex);
          }

          return (
            <button
              key={imageSrc}
              type="button"
              onClick={handleSelectThumbnail}
              aria-label={`Show photo ${imageIndex + 1}`}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${thumbBorderClass}`}
            >
              <img src={imageSrc} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto md:mx-0 space-y-3">
      <div className="group relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/70">
        <img
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${alt} — photo ${activeIndex + 1}`}
          className="w-full h-full object-cover animate-fade-in transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {navigationControls}
      </div>
      {thumbnailGrid}
    </div>
  );
}