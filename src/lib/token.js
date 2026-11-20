// Ambil kunci rahasia wajib dari .env.local
const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error('SESSION_SECRET belum diatur di .env.local');
}

// Siapkan kunci kriptografi HMAC SHA-256 untuk tanda tangan dan verifikasi token
async function getSecretKey() {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Buat tiket sesi bertanda tangan (dipakai saat user berhasil login)
export async function createToken(payload) {
  // Gabungkan data user dengan batas waktu berlaku (1 hari = 24 jam)
  const data = Object.assign({}, payload, {
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });

  // Ubah data user menjadi format teks yang aman disimpan di cookie
  const encodedPayload = btoa(JSON.stringify(data));
  const key = await getSecretKey();
  const encoder = new TextEncoder();

  // Buat tanda tangan digital dari data menggunakan kunci rahasia
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(encodedPayload)
  );

  // Ubah tanda tangan menjadi deretan karakter hex agar mudah digabung
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(function (b) {
      return b.toString(16).padStart(2, '0');
    })
    .join('');

  // Gabungkan data dan tanda tangan dengan pemisah titik
  return `${encodedPayload}.${signatureHex}`;
}

// Periksa keaslian dan masa berlaku tiket sesi dari cookie
export async function verifyToken(token) {
  try {
    // Tolak jika token kosong atau tidak memiliki pemisah titik
    if (!token || !token.includes('.')) {
      return null;
    }

    // Pisahkan bagian data dan bagian tanda tangan
    const parts = token.split('.');
    const encodedPayload = parts[0];
    const signatureHex = parts[1];
    const key = await getSecretKey();
    const encoder = new TextEncoder();

    // Kembalikan tanda tangan ke bentuk biner untuk dicocokkan
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g).map(function (byte) {
        return parseInt(byte, 16);
      })
    );

    // Verifikasi apakah tanda tangan cocok dengan data (gagal jika data diubah)
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(encodedPayload)
    );

    if (!isValid) {
      return null;
    }

    // Buka kembali isi data user dari teks token
    const payload = JSON.parse(atob(encodedPayload));

    // Tolak jika sudah melewati batas waktu kedaluwarsa
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    // Kembalikan null jika token rusak atau gagal diproses
    return null;
  }
}