'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getSizePreset,
  normalizeSizeLabel,
  isValidSizeLabel,
  isSizelessList,
  NO_SIZE,
  MAX_SIZES_PER_PRODUCT,
} from '@/lib/sizes';

// input ukuran n stok produk sesuai kategori atau segmen terpilih
export default function SizeStockFields({ category, segment, initialSizes = [] }) {
  const preset = getSizePreset(category, segment);

  let presetKey = 'none';
  if (preset) {
    presetKey = preset.key;
  }

  let presetSizes = [];
  if (preset) {
    presetSizes = preset.sizes;
  }

  const initialIsSizeless = isSizelessList(initialSizes);

  let realInitialSizes = initialSizes;
  if (initialIsSizeless) {
    realInitialSizes = [];
  }

  const noSize = Boolean(preset && preset.noSize);

  const [activeKey, setActiveKey] = useState(presetKey);

  const [noSizeStock, setNoSizeStock] = useState(function initNoSizeStock() {
    if (initialSizes.length === 0) {
      return '';
    }
    let stockSum = 0;
    for (const sizeItem of initialSizes) {
      stockSum += Number(sizeItem.stok);
    }
    return String(stockSum);
  });

  const [checked, setChecked] = useState(function initCheckedSizes() {
    const selectedLabels = [];
    for (const sizeItem of realInitialSizes) {
      selectedLabels.push(sizeItem.ukuran);
    }
    return selectedLabels;
  });

  const [extras, setExtras] = useState(function initExtraSizes() {
    const extraLabels = [];
    for (const sizeItem of realInitialSizes) {
      if (!presetSizes.includes(sizeItem.ukuran)) {
        extraLabels.push(sizeItem.ukuran);
      }
    }
    return extraLabels;
  });

  const [stocks, setStocks] = useState(function initSizeStocks() {
    const stockMap = {};
    for (const sizeItem of realInitialSizes) {
      stockMap[sizeItem.ukuran] = String(sizeItem.stok);
    }
    return stockMap;
  });

  const [customSize, setCustomSize] = useState('');
  const [customError, setCustomError] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  if (presetKey !== activeKey) {
    const hadSelection = checked.length > 0;
    setActiveKey(presetKey);
    setChecked([]);
    setExtras([]);
    setCustomError('');

    let nextNotice = '';
    if (hadSelection && preset && !preset.noSize) {
      nextNotice = `Size list changed to ${preset.label.toLowerCase()}. Please select the sizes again.`;
    }
    setResetNotice(nextNotice);
  }

  const filteredExtras = extras.filter(function filterNonPresetSize(extraSize) {
    return !presetSizes.includes(extraSize);
  });
  const options = [...presetSizes, ...filteredExtras];

  const allChecked =
    options.length > 0 &&
    options.every(function checkOptionSelected(sizeOption) {
      return checked.includes(sizeOption);
    });

  const someChecked = checked.length > 0 && !allChecked;

  const selectAllRef = useRef(null);
  useEffect(
    function syncSelectAllIndeterminate() {
      if (selectAllRef.current) {
        selectAllRef.current.indeterminate = someChecked;
      }
    },
    [someChecked]
  );

  // ubah status centang satu ukuran
  function toggleSize(sizeLabel) {
    setResetNotice('');
    if (checked.includes(sizeLabel)) {
      const nextChecked = checked.filter(function removeCheckedSize(item) {
        return item !== sizeLabel;
      });
      setChecked(nextChecked);
    } else {
      const nextChecked = options.filter(function keepSelectedInOrder(item) {
        return item === sizeLabel || checked.includes(item);
      });
      setChecked(nextChecked);
    }
  }

  // centang atau lepas semua pilihan ukuran
  function toggleAll() {
    setResetNotice('');
    if (allChecked) {
      setChecked([]);
    } else {
      setChecked([...options]);
    }
  }

  // perbarui nilai stok utk ukuran
  function changeStock(sizeLabel, nextStockValue) {
    const updatedStocks = { ...stocks };
    updatedStocks[sizeLabel] = nextStockValue;
    setStocks(updatedStocks);
  }

  // cek n tambahkan ukuran kustom baru ke daftar pilihan
  function addCustomSize() {
    const normalizedLabel = normalizeSizeLabel(customSize);
    if (normalizedLabel === '') {
      return;
    }

    if (!isValidSizeLabel(normalizedLabel)) {
      setCustomError(
        'Use a real size such as S, M, L or 28 (letters or numbers, max 10 characters). "All Size" is not allowed.'
      );
      return;
    }

    if (options.includes(normalizedLabel)) {
      setCustomError(`Size "${normalizedLabel}" is already in the list.`);
      if (!checked.includes(normalizedLabel)) {
        toggleSize(normalizedLabel);
      }
      return;
    }

    if (options.length >= MAX_SIZES_PER_PRODUCT) {
      setCustomError(`A product can have up to ${MAX_SIZES_PER_PRODUCT} sizes.`);
      return;
    }

    setExtras([...extras, normalizedLabel]);
    setChecked([...checked, normalizedLabel]);
    setCustomSize('');
    setCustomError('');
  }

  // hapus ukuran kustom dari daftar n pilihan aktif
  function removeCustomSize(sizeLabel) {
    const nextExtras = extras.filter(function keepOtherExtra(item) {
      return item !== sizeLabel;
    });
    const nextChecked = checked.filter(function keepOtherChecked(item) {
      return item !== sizeLabel;
    });
    setExtras(nextExtras);
    setChecked(nextChecked);
  }

  // perbarui input teks ukuran kustom saat diketik
  function handleCustomSizeChange(changeEvent) {
    setCustomSize(changeEvent.target.value);
    setCustomError('');
  }

  // tambahkan ukuran kustom saat tombol enter ditekan
  function handleCustomSizeKeyDown(keyEvent) {
    if (keyEvent.key === 'Enter') {
      keyEvent.preventDefault();
      addCustomSize();
    }
  }

  // perbarui stok produk tanpa ukuran saat nilai berubah
  function handleNoSizeStockChange(changeEvent) {
    setNoSizeStock(changeEvent.target.value);
  }

  let totalStock = 0;
  for (const sizeLabel of checked) {
    const parsedStock = Number(stocks[sizeLabel]);
    if (Number.isInteger(parsedStock) && parsedStock > 0) {
      totalStock += parsedStock;
    }
  }

  if (!preset) {
    return (
      <div>
        <p className="text-sm font-medium text-neutral-800">
          Sizes & Stock <span className="text-red-500">*</span>
        </p>
        <p className="mt-2 text-xs text-neutral-500 bg-neutral-50 border border-dashed border-neutral-300 rounded-xl px-4 py-3">
          Choose a category first to set the sizes and stock.
        </p>
      </div>
    );
  }

  if (noSize) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-neutral-800">
            Stock <span className="text-red-500">*</span>
          </p>
          <p className="text-[11px] text-neutral-400">
            Accessories (bags, jewelry, watches, wallets, ties, headbands) have no size. Buyers just choose the quantity.
          </p>
        </div>
        <input type="hidden" name="size_name" value={NO_SIZE} />
        <input
          type="number"
          name="size_stock"
          min="0"
          step="1"
          required
          placeholder="Stock"
          aria-label="Stock"
          value={noSizeStock}
          onChange={handleNoSizeStockChange}
          className="w-40 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
        />
      </div>
    );
  }

  let customErrorElement = null;
  if (customError) {
    customErrorElement = <p className="text-[11px] text-red-600">{customError}</p>;
  }

  let resetNoticeElement = null;
  if (resetNotice) {
    resetNoticeElement = <p className="text-[11px] text-amber-700">{resetNotice}</p>;
  }

  let selectedSummaryText = `${checked.length} size(s) selected`;
  if (checked.length === 0) {
    selectedSummaryText = 'No size selected yet';
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-neutral-800">
            Sizes & Stock <span className="text-red-500">*</span>
          </p>
          <p className="text-[11px] text-neutral-400">
            {preset.label}. Tick the sizes you sell, then fill in the stock.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer select-none">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-neutral-900 cursor-pointer"
          />
          Select all sizes
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(function buildSizeRow(sizeLabel) {
          const isChecked = checked.includes(sizeLabel);
          const isExtra = !presetSizes.includes(sizeLabel);

          let rowBorderClass = 'border-neutral-200 bg-neutral-50';
          if (isChecked) {
            rowBorderClass = 'border-neutral-900 bg-white';
          }

          let labelTextClass = 'text-neutral-500';
          if (isChecked) {
            labelTextClass = 'font-semibold text-neutral-900';
          }

          // toggle ukuran saat checkbox ukuran diubah
          function handleSizeToggle() {
            toggleSize(sizeLabel);
          }

          // perbarui stok ukuran saat input angka diubah
          function handleStockInputChange(changeEvent) {
            changeStock(sizeLabel, changeEvent.target.value);
          }

          // hapus ukuran kustom saat tombol hapus ditekan
          function handleRemoveExtraClick() {
            removeCustomSize(sizeLabel);
          }

          let stockInputValue = '';
          if (stocks[sizeLabel] !== undefined) {
            stockInputValue = stocks[sizeLabel];
          }

          let trailingControl = null;
          if (isChecked) {
            trailingControl = (
              <>
                <input type="hidden" name="size_name" value={sizeLabel} />
                <input
                  type="number"
                  name="size_stock"
                  min="0"
                  step="1"
                  required
                  placeholder="Stock"
                  aria-label={`Stock for size ${sizeLabel}`}
                  value={stockInputValue}
                  onChange={handleStockInputChange}
                  className="w-20 px-2 py-1.5 text-sm text-right bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </>
            );
          } else if (isExtra) {
            trailingControl = (
              <button
                type="button"
                onClick={handleRemoveExtraClick}
                className="text-[11px] text-neutral-400 hover:text-red-600 cursor-pointer"
                aria-label={`Remove size ${sizeLabel}`}
              >
                ✕
              </button>
            );
          }

          return (
            <div
              key={sizeLabel}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors duration-200 ${rowBorderClass}`}
            >
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleSizeToggle}
                  className="w-4 h-4 rounded accent-neutral-900 cursor-pointer shrink-0"
                />
                <span className={`text-sm truncate ${labelTextClass}`}>{sizeLabel}</span>
              </label>
              {trailingControl}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customSize}
          maxLength={10}
          placeholder='Other size, e.g. "28"'
          onChange={handleCustomSizeChange}
          onKeyDown={handleCustomSizeKeyDown}
          className="flex-1 max-w-56 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900"
        />
        <button
          type="button"
          onClick={addCustomSize}
          className="px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-300 hover:border-neutral-900 transition cursor-pointer"
        >
          + Add size
        </button>
      </div>

      {customErrorElement}
      {resetNoticeElement}

      <div className="flex items-center justify-between text-xs rounded-xl bg-neutral-50 px-3 py-2">
        <span className="text-neutral-500">{selectedSummaryText}</span>
        <span className="font-semibold text-neutral-900">Total stock: {totalStock}</span>
      </div>
    </div>
  );
}