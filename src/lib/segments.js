import { segmentsForCategory } from '@/data/navigation';

export const PRODUCT_SEGMENTS = [
  { value: 'Unisex', label: 'Unisex', hint: 'Women & Men' },
  { value: 'Women', label: 'Women' },
  { value: 'Men', label: 'Men' },
  { value: 'Kids', label: 'Kids' },
];

const ALL_SEGMENT_VALUES = PRODUCT_SEGMENTS.map(function mapSegmentValue(segmentItem) {
  return segmentItem.value;
});

// ambil daftar segmen pemilik kategori dari nav
function ownerSegments(categoryName) {
  return segmentsForCategory(categoryName);
}

// ambil daftar segmen yang diizinkan untuk kategori tertentu
export function allowedSegmentsForCategory(categoryName) {
  const segmentOwners = ownerSegments(categoryName);
  if (segmentOwners.length === 0) {
    return ALL_SEGMENT_VALUES;
  }

  const allowedList = [];
  for (const segmentItem of segmentOwners) {
    allowedList.push(segmentItem);
  }

  if (segmentOwners.includes('Women') && segmentOwners.includes('Men')) {
    allowedList.unshift('Unisex');
  }

  return allowedList;
}

// cek segmen valid untuk kategori yang dipilih
export function isSegmentAllowed(categoryName, segmentValue) {
  return allowedSegmentsForCategory(categoryName).includes(segmentValue);
}

// gabung daftar kata dengan pemisah koma n kata or
function joinWords(wordList) {
  if (wordList.length <= 1) {
    return wordList.join('');
  }

  const frontWords = wordList.slice(0, -1).join(', ');
  const lastWord = wordList[wordList.length - 1];
  return `${frontWords} or ${lastWord}`;
}

// pesan batasan segmen untuk kategori tertentu
export function restrictionMessage(categoryName) {
  const segmentOwners = ownerSegments(categoryName);
  if (segmentOwners.length === 0) {
    return '';
  }

  let verbForm = 'is';
  if (/[^s]s$/i.test(categoryName)) {
    verbForm = 'are';
  }

  return `${categoryName} ${verbForm} only for ${joinWords(segmentOwners)}.`;
}