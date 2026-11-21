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

// buat token sesi bertanda tangan hmac, masa berlakunya 24 jam
export async function createToken(payload) {
  const data = Object.assign({}, payload, {
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });

  const encodedPayload = btoa(JSON.stringify(data));
  const key = await getSecretKey();
  const encoder = new TextEncoder();

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(encodedPayload)
  );

  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(function (b) {
      return b.toString(16).padStart(2, '0');
    })
    .join('');

  return `${encodedPayload}.${signatureHex}`;
}

// verif keaslian, masa berlaku token lalu mengembalikan data sesi
export async function verifyToken(token) {
  try {
    if (!token || !token.includes('.')) {
      return null;
    }

    const parts = token.split('.');
    const encodedPayload = parts[0];
    const signatureHex = parts[1];
    const key = await getSecretKey();
    const encoder = new TextEncoder();

    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g).map(function (byte) {
        return parseInt(byte, 16);
      })
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(encodedPayload)
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(atob(encodedPayload));

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}