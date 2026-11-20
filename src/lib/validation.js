// Helper validasi input FormData dan JSON body.

// Ambil teks dari FormData dan hapus spasi berlebih
export function getString(formData, key) {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

// Konversi ke bilangan bulat positif (> 0), atau null jika tidak valid
export function toPositiveInt(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }
  return number;
}

// Cek format email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Cek nomor telepon (8-20 karakter: angka, spasi, +, -)
export function isValidPhone(phone) {
  return /^[0-9+\-\s]{8,20}$/.test(phone);
}

// Cek harga produk (> 0 sampai 9.999.999.999)
export function isValidPrice(value) {
  if (value === '') {
    return false;
  }
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= 9999999999;
}

// Cek stok produk (bilangan bulat 0 sampai 1.000.000)
export function isValidStock(value) {
  if (value === '') {
    return false;
  }
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 1000000;
}

// Rapikan ukuran ("s, M ,l" -> "S,M,L") tanpa duplikat dan spasi
export function normalizeSizes(value) {
  if (!value) {
    return '';
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');

  const unique = [];
  for (const item of items) {
    const label = item.length <= 4 ? item.toUpperCase() : item;
    if (!unique.includes(label)) {
      unique.push(label);
    }
  }
  return unique.join(',');
}

// Pecah string ukuran dipisah koma menjadi array
export function parseSizes(value) {
  if (!value || value.trim() === '') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}