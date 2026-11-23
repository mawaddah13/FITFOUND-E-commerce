'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiSliders, FiChevronDown, FiChevronLeft, FiX } from 'react-icons/fi';
import { segmentsForCategory, sortMainCategories } from '@/data/navigation';

const SEGMENTS = ['Women', 'Men', 'Kids'];
const FILTER_KEYS = ['q', 'segment', 'kategori', 'min', 'max', 'sort'];

let scrollAfterLoad = false;

// cek segmen yg cocok buat kategori aksesori ini
function segmentsForAccessory(categoryName) {
  return segmentsForCategory(categoryName);
}

// gabung daftar segmen jadi teks biar gampang dibaca (misal: "Women or Men")
function joinSegments(segmentList) {
  if (segmentList.length <= 1) {
    return segmentList.join('');
  }
  const leadingSegments = segmentList.slice(0, -1).join(', ');
  const lastSegmentLabel = segmentList[segmentList.length - 1];
  return `${leadingSegments} or ${lastSegmentLabel}`;
}

// buat ulang url katalog sesuai filter aktif n perubahan baru
function buildHref(basePath, currentFilters, changes) {
  const mergedFilters = { ...currentFilters, ...changes };
  const params = new URLSearchParams();

  for (const filterKey of FILTER_KEYS) {
    const filterValue = mergedFilters[filterKey];
    const isDefaultSort = filterKey === 'sort' && filterValue === 'newest';
    if (filterValue && !isDefaultSort) {
      params.set(filterKey, filterValue);
    }
  }

  const queryString = params.toString();
  if (queryString) {
    return `${basePath}?${queryString}`;
  }
  return basePath;
}

// satu baris opsi filter (kotak centang + info kalau lg dikunci)
function OptionItem({
  name,
  value,
  label,
  defaultChecked,
  disabled = false,
  info = '',
  onChange,
}) {
  const inputRef = useRef(null);

  // lepas centang kalau opsinya berubah jadi tidak tersedia/terkunci
  useEffect(
    function clearDisabledOption() {
      if (disabled && inputRef.current && inputRef.current.checked) {
        inputRef.current.checked = false;
      }
    },
    [disabled]
  );

  let labelCursorClass = 'cursor-pointer';
  if (disabled) {
    labelCursorClass = 'cursor-not-allowed';
  }

  let boxStateClass = 'border-neutral-400 bg-white group-hover:border-neutral-900';
  if (disabled) {
    boxStateClass = 'border-neutral-200 bg-neutral-100';
  }

  let optionTextClass = 'text-neutral-700 group-hover:text-neutral-950';
  if (disabled) {
    optionTextClass = 'text-neutral-400';
  }

  const isOptionChecked = Boolean(defaultChecked && !disabled);

  let infoTooltip = null;
  if (disabled && info) {
    infoTooltip = (
      <span className="relative group/info inline-flex">
        <span
          tabIndex={0}
          role="img"
          aria-label={info}
          className="w-4 h-4 rounded-full border border-neutral-400 text-neutral-500 text-[10px] font-semibold leading-none flex items-center justify-center cursor-help focus:outline-none focus:ring-2 focus:ring-neutral-300"
        >
          i
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 px-3 py-2 rounded-lg bg-neutral-900 text-white text-[11px] leading-snug shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible group-focus-within/info:opacity-100 group-focus-within/info:visible transition z-50"
        >
          {info}
        </span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className={`group flex items-center gap-3 py-1.5 ${labelCursorClass}`}>
        <input
          ref={inputRef}
          type="radio"
          name={name}
          value={value}
          defaultChecked={isOptionChecked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
        />
        <span
          className={`w-5 h-5 shrink-0 rounded-[5px] border flex items-center justify-center transition group-has-checked:bg-neutral-900 group-has-checked:border-neutral-900 group-has-focus-visible:ring-2 group-has-focus-visible:ring-neutral-400 ${boxStateClass}`}
        >
          <span className="text-[11px] font-bold leading-none text-white opacity-0 group-has-checked:opacity-100">
            ✓
          </span>
        </span>
        <span
          className={`text-sm group-has-checked:font-semibold group-has-checked:text-neutral-950 group-has-checked:underline group-has-checked:underline-offset-4 ${optionTextClass}`}
        >
          {label}
        </span>
      </label>
      {infoTooltip}
    </div>
  );
}

// kotak bagian filter yg bisa dibuka tutup
function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  // buka atau tutup bagian filter
  function handleToggleSection() {
    setOpen(!open);
  }

  let chevronRotateClass = '';
  if (open) {
    chevronRotateClass = 'rotate-180';
  }

  let sectionBody = null;
  if (open) {
    sectionBody = <div className="mt-3 animate-fade-up">{children}</div>;
  }

  return (
    <div className="py-4 border-b border-neutral-200 last:border-b-0">
      <button
        type="button"
        onClick={handleToggleSection}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-sm font-semibold text-neutral-950 cursor-pointer"
      >
        <span>{title}</span>
        <FiChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${chevronRotateClass}`}
        />
      </button>
      {sectionBody}
    </div>
  );
}

// dropdown buat ngatur urutan produk (sort by)
function SortDropdown({ basePath, filters, sortOptions }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // tutup dropdown kalau klik di luar area menunya
  useEffect(function registerOutsideClickListener() {
    function handleClickOutside(mouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(mouseEvent.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return function removeOutsideClickListener() {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentSortOption =
    sortOptions.find(function findActiveSort(sortOption) {
      return sortOption.value === filters.sort;
    }) || sortOptions[0];

  // pakai urutan yg dipilih lalu tarik url baru
  function choose(sortValue) {
    setOpen(false);
    router.push(buildHref(basePath, filters, { sort: sortValue }), { scroll: false });
  }

  // buka atau tutup menu dropdown urutan
  function handleToggleDropdown() {
    setOpen(!open);
  }

  let chevronClass = '';
  if (open) {
    chevronClass = 'rotate-180';
  }

  let dropdownMenu = null;
  if (open) {
    dropdownMenu = (
      <div className="absolute right-0 top-full mt-3 w-60 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 z-40 animate-dropdown">
        {sortOptions.map(function buildSortOptionButton(sortOption) {
          const isSelected = sortOption.value === currentSortOption.value;
          let optionClass = 'text-neutral-700 hover:bg-(--abumuda) hover:text-neutral-950';
          if (isSelected) {
            optionClass = 'font-semibold text-neutral-950 bg-(--abumuda)';
          }

          // pilih opsi urutan pas item-nya diklik
          function handleOptionClick() {
            choose(sortOption.value);
          }

          return (
            <button
              key={sortOption.value}
              type="button"
              onClick={handleOptionClick}
              className={`block w-full text-left px-5 py-2.5 text-sm transition cursor-pointer ${optionClass}`}
            >
              {sortOption.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggleDropdown}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 cursor-pointer"
      >
        <span className="hidden sm:inline text-neutral-500 font-normal">Sort by:</span>
        <span>{currentSortOption.label}</span>
        <FiChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 text-neutral-600 transition-transform duration-200 ${chevronClass}`}
        />
      </button>
      {dropdownMenu}
    </div>
  );
}

// bagian katalog produk: filter samping, urutan harga/terbaru, grid produk
export default function CatalogLayout({
  basePath,
  filters,
  categories,
  sortOptions,
  title,
  resultCount,
  showSort = true,
  headerAction = null,
  children,
}) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingSegment, setPendingSegment] = useState(filters.segment);
  const [lastSegment, setLastSegment] = useState(filters.segment);
  const [priceError, setPriceError] = useState('');

  if (lastSegment !== filters.segment) {
    setLastSegment(filters.segment);
    setPendingSegment(filters.segment);
  }

  // tahan scroll halaman belakang pas drawer filter di HP lagi kebuka
  useEffect(
    function lockBodyScrollOnMobileDrawer() {
      if (mobileOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return function restoreBodyScroll() {
        document.body.style.overflow = '';
      };
    },
    [mobileOpen]
  );

  // buka tutup sidebar di layar lebar atau drawer di layar HP
  function toggleFilter() {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setDesktopOpen(!desktopOpen);
    } else {
      setMobileOpen(!mobileOpen);
    }
  }

  // scroll halus ke atas bagian katalog
  function scrollToResults() {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const filtersKey = JSON.stringify(filters);

  // scroll ke atas katalog setelah data filter baru selesai dimuat
  useEffect(
    function scrollAfterFilterApplied() {
      if (scrollAfterLoad) {
        scrollAfterLoad = false;
        scrollToResults();
      }
    },
    [filtersKey]
  );

  // pindah ke url filter baru lalu tandai biar otomatis scroll pas hasil muncul
  function goToFilters(targetHref) {
    const currentHref = buildHref(basePath, filters, {});
    if (targetHref === currentHref) {
      scrollToResults();
      return;
    }

    scrollAfterLoad = true;
    router.push(targetHref, { scroll: false });
  }

  // validasi input harga min maks trs pasang filter pas form di-submit
  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    const formData = new FormData(submitEvent.currentTarget);
    const nextFilters = {};

    for (const filterKey of FILTER_KEYS) {
      const rawValue = formData.get(filterKey);
      if (typeof rawValue === 'string') {
        nextFilters[filterKey] = rawValue.trim();
      } else {
        nextFilters[filterKey] = '';
      }
    }

    let minPrice = null;
    if (nextFilters.min !== '') {
      minPrice = Number(nextFilters.min);
    }

    let maxPrice = null;
    if (nextFilters.max !== '') {
      maxPrice = Number(nextFilters.max);
    }

    if (minPrice !== null && (!Number.isInteger(minPrice) || minPrice < 1)) {
      setPriceError('Minimum price must be at least Rp 1.');
      return;
    }

    if (maxPrice !== null && (!Number.isInteger(maxPrice) || maxPrice < 1)) {
      setPriceError('Maximum price must be at least Rp 1.');
      return;
    }

    if (minPrice !== null && maxPrice !== null && maxPrice < minPrice) {
      setPriceError('Maximum price cannot be lower than minimum price.');
      return;
    }

    setPriceError('');
    setMobileOpen(false);
    goToFilters(buildHref(basePath, {}, nextFilters));
  }

  // hapus pesan error harga pas mulai ngetik ulang
  function handlePriceInput() {
    setPriceError('');
  }

  // set gender ke all saat milih opsi All
  function handleSelectAllSegments() {
    setPendingSegment('');
  }

  // tutup drawer filter di HP
  function handleCloseMobileDrawer() {
    setMobileOpen(false);
  }

  // reset filter tapi biarin kata kunci pencarian (q) n urutan (sort) tetap ada
  function handleResetFilters() {
    setMobileOpen(false);
    goToFilters(buildHref(basePath, {}, { q: filters.q, sort: filters.sort }));
  }

  const filteredMainCategories = categories.filter(function filterMainCat(categoryItem) {
    return categoryItem.grup_kategori === 'Main';
  });
  const mainCategories = sortMainCategories(filteredMainCategories);

  const accessoryCategories = categories.filter(function filterAccessoryCat(categoryItem) {
    return categoryItem.grup_kategori === 'Accessories';
  });

  const activeKategori = filters.kategori.toLowerCase();

  const chips = [];
  if (filters.q) {
    chips.push({
      label: `"${filters.q}"`,
      href: buildHref(basePath, filters, { q: '' }),
    });
  }
  if (filters.segment) {
    chips.push({
      label: filters.segment,
      href: buildHref(basePath, filters, { segment: '' }),
    });
  }
  if (filters.kategori) {
    chips.push({
      label: filters.kategori,
      href: buildHref(basePath, filters, { kategori: '' }),
    });
  }
  if (filters.min || filters.max) {
    const minText = `Rp ${Number(filters.min).toLocaleString('id-ID')}`;
    const maxText = `Rp ${Number(filters.max).toLocaleString('id-ID')}`;
    let priceLabel = `${minText} – ${maxText}`;
    if (!filters.max) {
      priceLabel = `From ${minText}`;
    } else if (!filters.min) {
      priceLabel = `Up to ${maxText}`;
    }
    chips.push({
      label: priceLabel,
      href: buildHref(basePath, filters, { min: '', max: '' }),
    });
  }

  const inputClass =
    'w-full px-3 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900';

  let priceBorderClass = '';
  if (priceError) {
    priceBorderClass = 'border-red-400!';
  }

  let activePriceErrorText = '';
  if (priceError) {
    activePriceErrorText = priceError;
  } else if (filters.priceError) {
    activePriceErrorText = filters.priceError;
  }

  let priceErrorElement = null;
  if (activePriceErrorText) {
    priceErrorElement = (
      <p className="mt-1.5 text-[11px] text-red-600">{activePriceErrorText}</p>
    );
  }

  let resetButtonElement = null;
  if (filters.hasFilter) {
    resetButtonElement = (
      <button
        type="button"
        onClick={handleResetFilters}
        className="px-4 py-2.5 text-sm font-medium border border-neutral-300 rounded-xl hover:border-neutral-900 transition cursor-pointer"
      >
        Reset
      </button>
    );
  }

  let accessoryOptionsBlock = null;
  if (accessoryCategories.length > 0) {
    accessoryOptionsBlock = (
      <>
        <p className="mt-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-950">
          Accessories
        </p>
        {accessoryCategories.map(function buildAccessoryOption(accessoryCategory) {
          const availableFor = segmentsForAccessory(accessoryCategory.nama_kategori);
          const isUnavailable =
            pendingSegment !== '' &&
            availableFor.length > 0 &&
            !availableFor.includes(pendingSegment);

          let infoMessage = '';
          if (isUnavailable) {
            const ownersText = joinSegments(availableFor);
            infoMessage = `${accessoryCategory.nama_kategori} is only available for ${ownersText}. Select ${ownersText} in Gender to see this category.`;
          }

          const isAccessoryChecked =
            activeKategori === accessoryCategory.nama_kategori.toLowerCase();

          return (
            <OptionItem
              key={accessoryCategory.id_category}
              name="kategori"
              value={accessoryCategory.nama_kategori}
              label={accessoryCategory.nama_kategori}
              defaultChecked={isAccessoryChecked}
              disabled={isUnavailable}
              info={infoMessage}
            />
          );
        })}
      </>
    );
  }

  const filterForm = (
    <form key={filtersKey} onSubmit={handleSubmit} className="text-neutral-900">
      <input type="hidden" name="q" value={filters.q} />
      <input type="hidden" name="sort" value={filters.sort} />

      <FilterSection title="Gender">
        <OptionItem
          name="segment"
          value=""
          label="All"
          defaultChecked={filters.segment === ''}
          onChange={handleSelectAllSegments}
        />
        {SEGMENTS.map(function buildSegmentOption(segmentName) {
          // catat pilihan gender sementara sebelum klik apply
          function handleSegmentRadioChange() {
            setPendingSegment(segmentName);
          }

          return (
            <OptionItem
              key={segmentName}
              name="segment"
              value={segmentName}
              label={segmentName}
              defaultChecked={filters.segment === segmentName}
              onChange={handleSegmentRadioChange}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Product Category">
        <OptionItem
          name="kategori"
          value=""
          label="All Categories"
          defaultChecked={activeKategori === ''}
        />
        {mainCategories.map(function buildMainCategoryOption(mainCategory) {
          const isMainChecked = activeKategori === mainCategory.nama_kategori.toLowerCase();
          return (
            <OptionItem
              key={mainCategory.id_category}
              name="kategori"
              value={mainCategory.nama_kategori}
              label={mainCategory.nama_kategori}
              defaultChecked={isMainChecked}
            />
          );
        })}
        {accessoryOptionsBlock}
      </FilterSection>

      <FilterSection title="Price">
        <div className="grid grid-cols-2 gap-2" onInput={handlePriceInput}>
          <input
            name="min"
            type="number"
            min="1"
            step="1"
            placeholder="Min (Rp)"
            defaultValue={filters.min}
            aria-label="Minimum price"
            className={`${inputClass} ${priceBorderClass}`}
          />
          <input
            name="max"
            type="number"
            min="1"
            step="1"
            placeholder="Max (Rp)"
            defaultValue={filters.max}
            aria-label="Maximum price"
            className={`${inputClass} ${priceBorderClass}`}
          />
        </div>
        {priceErrorElement}
      </FilterSection>

      <div className="sticky bottom-0 bg-(--abumuda) pt-4 pb-2 flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2.5 text-sm font-medium bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
        >
          Apply
        </button>
        {resetButtonElement}
      </div>
    </form>
  );

  let filterBadgeElement = null;
  if (chips.length > 0) {
    filterBadgeElement = (
      <span className="min-w-5 h-5 px-1.5 rounded-full bg-neutral-950 text-white text-[10px] flex items-center justify-center">
        {chips.length}
      </span>
    );
  }

  let desktopChevronClass = 'rotate-180';
  if (desktopOpen) {
    desktopChevronClass = '';
  }

  let headerActionElement = null;
  if (headerAction) {
    headerActionElement = <div className="mt-1">{headerAction}</div>;
  }

  let sortDropdownElement = null;
  if (showSort) {
    sortDropdownElement = (
      <SortDropdown basePath={basePath} filters={filters} sortOptions={sortOptions} />
    );
  }

  let activeChipsBar = null;
  if (chips.length > 0) {
    activeChipsBar = (
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {chips.map(function buildActiveChip(chipItem) {
          return (
            <Link
              key={chipItem.label}
              href={chipItem.href}
              scroll={false}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white border border-neutral-300 rounded-full hover:border-neutral-900 transition"
            >
              {chipItem.label}
              <FiX aria-hidden="true" className="w-3 h-3 text-neutral-400" />
              <span className="sr-only">Remove filter</span>
            </Link>
          );
        })}
        <Link
          href={basePath}
          scroll={false}
          className="text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
        >
          Clear all
        </Link>
      </div>
    );
  }

  let catalogGridClass = '';
  if (desktopOpen) {
    catalogGridClass = 'lg:grid-cols-[250px_1fr]';
  }

  let desktopSidebarElement = null;
  if (desktopOpen) {
    desktopSidebarElement = (
      <aside className="hidden lg:block self-start sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto pr-2 animate-slide-from-left">
        {filterForm}
      </aside>
    );
  }

  let mobileDrawerElement = null;
  if (mobileOpen) {
    mobileDrawerElement = (
      <div className="lg:hidden fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/40 animate-fade-in"
          onClick={handleCloseMobileDrawer}
        />
        <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-(--abumuda) shadow-xl flex flex-col animate-slide-in-left">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <span className="inline-flex items-center gap-2.5 text-sm font-semibold">
              <FiSliders className="w-5 h-5" aria-hidden="true" />
              Filter
            </span>
            <button
              type="button"
              onClick={handleCloseMobileDrawer}
              aria-label="Close filter"
              className="p-1 cursor-pointer"
            >
              <FiX className="w-5 h-5 text-neutral-800" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5">{filterForm}</div>
        </div>
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="scroll-mt-32 md:scroll-mt-40">
      <h2 className="text-center text-xl md:text-2xl font-semibold text-neutral-950">{title}</h2>

      <div className="mt-4 mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="justify-self-start">
          <button
            type="button"
            onClick={toggleFilter}
            aria-expanded={desktopOpen}
            className="inline-flex items-center gap-2.5 text-sm font-semibold text-neutral-950 cursor-pointer"
          >
            <FiSliders className="w-5 h-5" aria-hidden="true" />
            <span>Filter</span>
            {filterBadgeElement}
            <FiChevronLeft
              aria-hidden="true"
              className={`hidden lg:block w-4 h-4 text-neutral-600 transition-transform duration-200 ${desktopChevronClass}`}
            />
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-700">{resultCount} products</p>
          {headerActionElement}
        </div>

        <div className="justify-self-end">{sortDropdownElement}</div>
      </div>

      {activeChipsBar}

      <div className={`grid grid-cols-1 gap-8 ${catalogGridClass}`}>
        {desktopSidebarElement}
        <div className="min-w-0 transition-all duration-500">{children}</div>
      </div>

      {mobileDrawerElement}
    </section>
  );
}