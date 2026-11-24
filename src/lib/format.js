//ubah angka jd rupiah 
export function formatRupiah(value) {
  let amount = 0;
  if (value) {
    amount = Number(value);
  }
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// ubah data waktu jadi lebih mudah dibaca
export function formatDate(value) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// cari tanggal terakhir sebuah status di riwayat pesanan (status pending pakai tanggal order kalau belum ada riwayat)
export function getStatusDate(history, statusName, orderCreatedAt) {
  let foundDate = null;
  if (history) {
    for (const historyItem of history) {
      if (historyItem.status === statusName) {
        foundDate = historyItem.tanggal;
      }
    }
  }
  if (!foundDate && statusName === 'pending') {
    foundDate = orderCreatedAt;
  }
  return foundDate;
}

export const ORDER_STATUS = {
  pending: {
    label: 'Awaiting Payment',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  waiting_verification: {
    label: 'Awaiting Payment Verification',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  paid: {
    label: 'Payment Confirmed',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
};

// alur status yg boleh diubah seller: pembayaran harus diverifikasi dulu sebelum diproses
// waiting_verification -> pending = bukti pembayaran ditolak, buyer upload ulang
export const SELLER_STATUS_FLOW = {
  pending: ['cancelled'],
  waiting_verification: ['paid', 'pending', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export const USER_STATUS = {
  active: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
};

export const ACCOUNT_STATUS = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', className: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
  suspended: { label: 'Suspended', className: 'bg-red-50 text-red-600 border-red-200' },
};

export const ROLE_LABELS = {
  buyer: 'Buyer',
  seller: 'Seller',
  admin: 'Admin',
};