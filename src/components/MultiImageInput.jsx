'use client';

import { useEffect, useRef, useState } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024;

// tampilkan input unggah banyak foto produk beserta foto lama yg dipertahankan
export default function MultiImageInput({ existingImages = [], max = 5 }) {
  const fileInputRef = useRef(null);
  const [kept, setKept] = useState(existingImages);
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState('');

  const total = kept.length + newFiles.length;
  const remaining = max - total;

  // samakan daftar file baru ke input file agar ikut terkirim saat submit
  useEffect(
    function syncFilesToInput() {
      if (!fileInputRef.current) {
        return;
      }

      const dataTransfer = new DataTransfer();
      for (const fileItem of newFiles) {
        dataTransfer.items.add(fileItem.file);
      }
      fileInputRef.current.files = dataTransfer.files;
    },
    [newFiles]
  );

  // bersihkan semua url pratinjau file baru saat komponen dilepas
  useEffect(function cleanupAllPreviews() {
    return function revokeAllNewPreviews() {
      for (const fileItem of newFiles) {
        URL.revokeObjectURL(fileItem.preview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cek validitas n batas kuota lalu tambahkan file foto baru
  function addFiles(fileList) {
    setError('');
    const acceptedFiles = [];

    for (const fileItem of fileList) {
      if (!ALLOWED_TYPES.includes(fileItem.type)) {
        setError(`"${fileItem.name}" is not a JPG, PNG, WEBP, or GIF image.`);
        continue;
      }

      if (fileItem.size > MAX_SIZE) {
        setError(`"${fileItem.name}" is larger than 2 MB.`);
        continue;
      }

      acceptedFiles.push({
        file: fileItem,
        preview: URL.createObjectURL(fileItem),
      });
    }

    const availableSlots = max - kept.length - newFiles.length;
    let allowedSlotCount = availableSlots;
    if (allowedSlotCount < 0) {
      allowedSlotCount = 0;
    }

    if (acceptedFiles.length > allowedSlotCount) {
      setError(`Only ${max} photos are allowed. Extra photos were not added.`);
      const overflowFiles = acceptedFiles.slice(allowedSlotCount);
      for (const overflowItem of overflowFiles) {
        URL.revokeObjectURL(overflowItem.preview);
      }
    }

    const keptNewFiles = acceptedFiles.slice(0, allowedSlotCount);
    setNewFiles([...newFiles, ...keptNewFiles]);
  }

  // cek kuota lalu buka pemilih file foto baru
  function openPicker() {
    if (remaining <= 0) {
      setError(`You can upload up to ${max} photos.`);
      return;
    }

    const pickerInput = document.createElement('input');
    pickerInput.type = 'file';
    pickerInput.accept = ALLOWED_TYPES.join(',');
    pickerInput.multiple = true;
    pickerInput.onchange = function handlePickerChange() {
      let pickedFiles = [];
      if (pickerInput.files) {
        pickedFiles = Array.from(pickerInput.files);
      }
      addFiles(pickedFiles);
    };
    pickerInput.click();
  }

  // hapus path foto lama dari daftar foto yg dipertahankan
  function removeKept(targetPath) {
    const nextKept = kept.filter(function keepOtherPath(existingPath) {
      return existingPath !== targetPath;
    });
    setKept(nextKept);
    setError('');
  }

  // hapus foto baru berdasarkan indeks lalu lepaskan url pratinjaunya
  function removeNew(targetIndex) {
    if (newFiles[targetIndex]) {
      URL.revokeObjectURL(newFiles[targetIndex].preview);
    }

    const nextNewFiles = newFiles.filter(function keepOtherNewFile(_item, itemIndex) {
      return itemIndex !== targetIndex;
    });
    setNewFiles(nextNewFiles);
    setError('');
  }

  const tiles = [];

  for (const keptPath of kept) {
    // hapus foto lama saat tombol hapus ditekan
    function handleRemoveKept() {
      removeKept(keptPath);
    }

    tiles.push({
      key: keptPath,
      src: keptPath,
      isNew: false,
      onRemove: handleRemoveKept,
    });
  }

  for (let fileIndex = 0; fileIndex < newFiles.length; fileIndex += 1) {
    const currentNewFile = newFiles[fileIndex];

    // hapus foto baru saat tombol hapus ditekan
    function handleRemoveNew() {
      removeNew(fileIndex);
    }

    tiles.push({
      key: currentNewFile.preview,
      src: currentNewFile.preview,
      isNew: true,
      onRemove: handleRemoveNew,
    });
  }

  let errorElement = null;
  if (error) {
    errorElement = <p className="text-xs text-red-600">{error}</p>;
  }

  let addPhotoTile = null;
  if (remaining > 0) {
    addPhotoTile = (
      <button
        type="button"
        onClick={openPicker}
        className="aspect-[3/4] rounded-xl border-2 border-dashed border-neutral-300 bg-white text-neutral-400 hover:border-neutral-900 hover:text-neutral-900 transition-colors duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer"
      >
        <span className="text-2xl leading-none">+</span>
        <span className="text-[11px] font-medium">Add photo</span>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-neutral-800">
          Product Photos <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-neutral-500">
          {total}/{max} photos
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {tiles.map(function buildPhotoTile(tileItem, tileIndex) {
          let mainBadge = null;
          if (tileIndex === 0) {
            mainBadge = (
              <span className="absolute left-1.5 bottom-1.5 px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-semibold">
                Main
              </span>
            );
          }

          let newBadge = null;
          if (tileItem.isNew) {
            newBadge = (
              <span className="absolute left-1.5 top-1.5 px-2 py-0.5 rounded-full bg-(--biru) text-white text-[10px] font-semibold">
                New
              </span>
            );
          }

          return (
            <div
              key={tileItem.key}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-white border border-neutral-200 animate-pop-in"
            >
              <img
                src={tileItem.src}
                alt={`Photo ${tileIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {mainBadge}
              {newBadge}
              <button
                type="button"
                onClick={tileItem.onRemove}
                aria-label={`Remove photo ${tileIndex + 1}`}
                className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-white/90 text-neutral-900 text-xs font-bold shadow opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}

        {addPhotoTile}
      </div>

      <p className="text-[11px] text-neutral-500">
        JPG, PNG, WEBP or GIF · max 2 MB each · up to {max} photos. The first photo is the main photo.
      </p>
      {errorElement}

      {kept.map(function buildKeptImageInput(keptPath) {
        return <input key={keptPath} type="hidden" name="keep_images" value={keptPath} />;
      })}
      <input
        ref={fileInputRef}
        type="file"
        name="gambar_files"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}