'use client';

import { useEffect, useRef, useState } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024;

// tampilkan input unggah satu gambar beserta pratinjau n validasi ukuran
export default function ImageInput({
  name,
  required = false,
  currentImage = '',
  label = 'Image',
  rounded = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  // bersihkan url pratinjau lama saat berubah atau dilepas
  useEffect(
    function cleanupPreviewUrl() {
      return function revokeCurrentUrl() {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      };
    },
    [preview]
  );

  // cek tipe n ukuran file lalu siapkan url pratinjau gambar
  function handleChange(changeEvent) {
    let selectedFile = null;
    if (changeEvent.target.files && changeEvent.target.files[0]) {
      selectedFile = changeEvent.target.files[0];
    }

    setError('');

    if (!selectedFile) {
      setPreview('');
      setFileName('');
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Please choose a JPG, PNG, WEBP, or GIF image.');
      changeEvent.target.value = '';
      setPreview('');
      setFileName('');
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError('Image size must not exceed 2 MB.');
      changeEvent.target.value = '';
      setPreview('');
      setFileName('');
      return;
    }

    setPreview(URL.createObjectURL(selectedFile));
    setFileName(selectedFile.name);
  }

  // buka dialog pilih file dari input tersembunyi
  function handleTriggerClick() {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }

  let shownImage = currentImage;
  if (preview) {
    shownImage = preview;
  }

  let shapeClass = 'rounded-xl w-24 h-32';
  if (rounded) {
    shapeClass = 'rounded-full w-24 h-24';
  }

  let requiredMark = null;
  if (required) {
    requiredMark = <span className="text-red-500">*</span>;
  }

  let thumbnailElement = (
    <span className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-400 group-hover:text-neutral-900 transition-colors">
      +
    </span>
  );
  if (shownImage) {
    thumbnailElement = (
      <img
        src={shownImage}
        alt="Preview"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  let fileStatusText = 'No image selected';
  if (fileName) {
    fileStatusText = fileName;
  } else if (currentImage) {
    fileStatusText = 'Current image';
  }

  let replaceHintElement = null;
  if (currentImage && !preview) {
    replaceHintElement = <p>Choose a new file to replace it.</p>;
  }

  let actionButtonLabel = 'Upload Image';
  if (shownImage) {
    actionButtonLabel = 'Change Image';
  }

  let errorElement = null;
  if (error) {
    errorElement = <p className="text-xs text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-800">
        {label} {requiredMark}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleTriggerClick}
          className={`group relative shrink-0 overflow-hidden border-2 border-dashed border-neutral-300 bg-white hover:border-neutral-900 transition-colors duration-200 cursor-pointer ${shapeClass}`}
          aria-label="Choose image"
        >
          {thumbnailElement}
        </button>

        <div className="min-w-0 text-xs text-neutral-500 space-y-1">
          <p className="font-medium text-neutral-800 truncate">{fileStatusText}</p>
          <p>JPG, PNG, WEBP or GIF · max 2 MB</p>
          {replaceHintElement}
          <button
            type="button"
            onClick={handleTriggerClick}
            className="mt-1 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            {actionButtonLabel}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/gif"
        required={required}
        onChange={handleChange}
        className="sr-only"
      />
      {errorElement}
    </div>
  );
}