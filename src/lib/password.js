import bcrypt from 'bcryptjs';

// Hash password dengan bcrypt (library "bcryptjs").
// Hasil yang disimpan di kolom users.password_hash, contoh:
//   $2a$10$KZSZlcJPexDRQhiBO6cF6uNlzKY2Z/v8cpHzozE11jqFXEts7jwkW
//   $2a$ = versi bcrypt, 10 = cost (makin besar makin lama & aman),
//   22 karakter berikutnya = salt acak, sisanya = hasil hash.
const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Mencocokkan password yang diketik user dengan hash di database
export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }
  return bcrypt.compare(password, storedHash);
}