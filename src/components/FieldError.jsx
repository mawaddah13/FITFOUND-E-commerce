'use client';

import { createContext, useContext } from 'react';

// pesan error per kolom form, diisi sama ActionForm (cek di browser + balasan server)
export const FieldErrorsContext = createContext({});

// tulisan merah tetap di bawah kolom yg salah, hilang sendiri pas kolomnya diubah
export default function FieldError({ name }) {
  const fieldErrors = useContext(FieldErrorsContext);
  if (!name || !fieldErrors || !fieldErrors[name]) {
    return null;
  }
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 animate-fade-up">
      {fieldErrors[name]}
    </p>
  );
}