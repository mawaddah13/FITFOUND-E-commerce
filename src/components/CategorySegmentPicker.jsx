'use client';

import { useEffect, useState } from 'react';
import { PRODUCT_SEGMENTS, allowedSegmentsForCategory, restrictionMessage } from '@/lib/segments';

// ikon tanda "i" dengan penjelasan saat dihover atau difokuskan
function InfoTip({ text }) {
  return (
    <span className="relative group/info inline-flex">
      <span
        tabIndex={0}
        role="img"
        aria-label={text}
        className="w-4 h-4 rounded-full border border-neutral-400 text-neutral-500 text-[10px] font-semibold leading-none flex items-center justify-center cursor-help focus:outline-none focus:ring-2 focus:ring-neutral-300"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 px-3 py-2 rounded-lg bg-neutral-900 text-white text-[11px] leading-snug shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible group-focus-within/info:opacity-100 group-focus-within/info:visible transition z-50"
      >
        {text}
      </span>
    </span>
  );
}

// tombol pilihan kategori/segmen (bisa terpilih, mati/terkunci, atau punya info tambahan)
function Chip({ label, sublabel, selected, disabled, info, onClick }) {
  let buttonClassName =
    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm transition-all duration-200 ';

  if (disabled) {
    buttonClassName += 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed';
  } else if (selected) {
    buttonClassName += 'border-neutral-900 bg-neutral-900 text-white shadow-sm cursor-pointer';
  } else {
    buttonClassName +=
      'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900 hover:-translate-y-0.5 cursor-pointer';
  }

  let sublabelElement = null;
  if (sublabel) {
    let sublabelClassName = 'text-neutral-400';
    if (selected) {
      sublabelClassName = 'text-white/70';
    }
    sublabelElement = <span className={`text-[11px] ${sublabelClassName}`}>({sublabel})</span>;
  }

  let infoTipElement = null;
  if (disabled && info) {
    infoTipElement = <InfoTip text={info} />;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        className={buttonClassName}
      >
        {label}
        {sublabelElement}
      </button>
      {infoTipElement}
    </span>
  );
}

// pilih kategori n segmen, terus otomatis ssuaikan mana yg boleh dipilih
export default function CategorySegmentPicker({
  categories,
  defaultCategoryId = '',
  defaultSegment = '',
  onChange,
}) {
  let initialCategoryId = '';
  if (defaultCategoryId) {
    initialCategoryId = String(defaultCategoryId);
  }

  let initialSegment = '';
  if (defaultSegment) {
    initialSegment = defaultSegment;
  }

  let initialLockSource = null;
  if (defaultCategoryId) {
    initialLockSource = 'category';
  }

  const [idCategory, setIdCategory] = useState(initialCategoryId);
  const [segment, setSegment] = useState(initialSegment);
  const [lockedBy, setLockedBy] = useState(initialLockSource);
  const [notice, setNotice] = useState('');

  const selectedCategory = categories.find(function findSelectedCategory(categoryItem) {
    return String(categoryItem.id_category) === idCategory;
  });

  const mainCategories = categories.filter(function filterMainCategory(categoryItem) {
    return categoryItem.grup_kategori === 'Main';
  });

  const accessoryCategories = categories.filter(function filterAccessoryCategory(categoryItem) {
    return categoryItem.grup_kategori === 'Accessories';
  });

  // kasih tahu form/komponen luar kalau kategori atau segmen berubah
  useEffect(
    function notifySelectionChange() {
      if (onChange) {
        let currentCategory = null;
        if (selectedCategory) {
          currentCategory = selectedCategory;
        }
        onChange({ category: currentCategory, segment });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idCategory, segment]
  );

  // cek segmen yg boleh buat kategori ini, lalu simpan ID kategori yg dipilih
  function chooseCategory(categoryItem) {
    const allowedSegments = allowedSegmentsForCategory(categoryItem.nama_kategori);
    setIdCategory(String(categoryItem.id_category));
    setNotice('');

    if (lockedBy === null || lockedBy === 'category') {
      setLockedBy('category');

      if (segment && !allowedSegments.includes(segment)) {
        setSegment('');
      }

      if (allowedSegments.length === 1) {
        setSegment(allowedSegments[0]);
        setNotice(
          `Segment set to ${allowedSegments[0]} automatically. ${restrictionMessage(categoryItem.nama_kategori)}`
        );
      }
    }
  }

  // kalau segmen diklik, kunci pilihan ke segmen ini n kosongkan kategori kalau nd cocok
  function chooseSegment(segmentValue) {
    setSegment(segmentValue);
    setNotice('');

    if (lockedBy === null || lockedBy === 'segment') {
      setLockedBy('segment');

      if (
        selectedCategory &&
        !allowedSegmentsForCategory(selectedCategory.nama_kategori).includes(segmentValue)
      ) {
        setIdCategory('');
        setNotice(
          `${selectedCategory.nama_kategori} is not available for ${segmentValue}. Please choose another category.`
        );
      }
    }
  }

  // hapus pilihan kategori, segmen, kunci, dan pesan info
  function resetChoice() {
    setIdCategory('');
    setSegment('');
    setLockedBy(null);
    setNotice('');
  }

  // kunci kategori yang nd cocok kalau segmen sudah dipilih duluan
  function categoryState(categoryItem) {
    if (lockedBy !== 'segment' || !segment) {
      return { disabled: false, info: '' };
    }

    const allowedSegments = allowedSegmentsForCategory(categoryItem.nama_kategori);
    if (allowedSegments.includes(segment)) {
      return { disabled: false, info: '' };
    }

    return {
      disabled: true,
      info: `${restrictionMessage(categoryItem.nama_kategori)} Not available for ${segment}.`,
    };
  }

  // kunci segmen yang nd cocok kalau kategori sudah dipilih duluan
  function segmentState(segmentValue) {
    if (lockedBy !== 'category' || !selectedCategory) {
      return { disabled: false, info: '' };
    }

    const allowedSegments = allowedSegmentsForCategory(selectedCategory.nama_kategori);
    if (allowedSegments.includes(segmentValue)) {
      return { disabled: false, info: '' };
    }

    return {
      disabled: true,
      info: restrictionMessage(selectedCategory.nama_kategori),
    };
  }

  // buat tombol pilihan buat satu kategori
  function buildCategoryChip(categoryItem) {
    const currentState = categoryState(categoryItem);
    const isSelected = String(categoryItem.id_category) === idCategory;

    // pilih kategori pas chip/tombolnya diklik
    function handleCategoryClick() {
      chooseCategory(categoryItem);
    }

    return (
      <Chip
        key={categoryItem.id_category}
        label={categoryItem.nama_kategori}
        selected={isSelected}
        disabled={currentState.disabled}
        info={currentState.info}
        onClick={handleCategoryClick}
      />
    );
  }

  let resetButton = null;
  if (idCategory || segment) {
    resetButton = (
      <button
        type="button"
        onClick={resetChoice}
        className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-4 cursor-pointer"
      >
        Reset category & segment
      </button>
    );
  }

  let accessorySection = null;
  if (accessoryCategories.length > 0) {
    accessorySection = (
      <div>
        <p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">Accessories</p>
        <div className="flex flex-wrap gap-2">{accessoryCategories.map(buildCategoryChip)}</div>
      </div>
    );
  }

  let noticeBanner = null;
  if (notice) {
    noticeBanner = (
      <p className="text-xs text-(--biru) bg-(--birumuda) rounded-lg px-3 py-2 animate-fade-up">
        {notice}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-800">
            Category <span className="text-red-500">*</span>
          </p>
          {resetButton}
        </div>
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">{mainCategories.map(buildCategoryChip)}</div>
          {accessorySection}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-800 mb-2">
          Segment <span className="text-red-500">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_SEGMENTS.map(function buildSegmentChip(segmentOption) {
            const currentState = segmentState(segmentOption.value);
            const isSelected = segment === segmentOption.value;

            // jalankan pemilihan segmen saat chip diklik
            function handleSegmentClick() {
              chooseSegment(segmentOption.value);
            }

            return (
              <Chip
                key={segmentOption.value}
                label={segmentOption.label}
                sublabel={segmentOption.hint}
                selected={isSelected}
                disabled={currentState.disabled}
                info={currentState.info}
                onClick={handleSegmentClick}
              />
            );
          })}
        </div>
        <p className="text-[11px] text-neutral-400 mt-1.5">
          Unisex products appear in both Women and Men.
        </p>
      </div>

      {noticeBanner}

      <input type="hidden" name="id_category" value={idCategory} />
      <input type="hidden" name="segmen" value={segment} />
    </div>
  );
}