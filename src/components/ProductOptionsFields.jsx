'use client';

import { useState } from 'react';
import CategorySegmentPicker from '@/components/CategorySegmentPicker';
import SizeStockFields from '@/components/SizeStockFields';
import FieldError from '@/components/FieldError';

// gabungan pilihan kategori, segmen, ukuran, n stok produk
export default function ProductOptionsFields({
  categories,
  defaultCategoryId = '',
  defaultSegment = '',
  initialSizes = [],
}) {
  const [selection, setSelection] = useState(function initSelection() {
    const matchedCategory =
      categories.find(function findInitialCategory(categoryItem) {
        return String(categoryItem.id_category) === String(defaultCategoryId);
      }) || null;

    let initialSegment = '';
    if (defaultSegment) {
      initialSegment = defaultSegment;
    }

    return {
      category: matchedCategory,
      segment: initialSegment,
    };
  });

  // perbarui pilihan kategori n segmen saat berubah
  function handleSelectionChange(nextSelection) {
    setSelection(nextSelection);
  }

  return (
    <div className="space-y-4">
      {/* data-field-slot: tempat pesan error kategori / ukuran n stok muncul */}
      <div data-field-slot="kategori" className="p-4 rounded-xl border border-neutral-200">
        <CategorySegmentPicker
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          defaultSegment={defaultSegment}
          onChange={handleSelectionChange}
        />
        <FieldError name="kategori" />
      </div>

      <div data-field-slot="sizes" className="p-4 rounded-xl border border-neutral-200">
        <SizeStockFields
          category={selection.category}
          segment={selection.segment}
          initialSizes={initialSizes}
        />
        <FieldError name="sizes" />
      </div>
    </div>
  );
}