import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// ubah password teks biasa menjadi hash bcrypt
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// cocokkan password input dengan hash yang tersimpan di db
export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }
  return bcrypt.compare(password, storedHash);
}