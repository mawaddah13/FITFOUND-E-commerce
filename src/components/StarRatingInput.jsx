'use client';

import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const RATING_LABELS = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Amazing!',
};

const STAR_VALUES = [1, 2, 3, 4, 5];

// tampilkan input rating lima bintang n label nilai
export default function StarRatingInput({ inputName = 'rating' }) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  let activeRating = selectedRating;
  if (hoveredRating > 0) {
    activeRating = hoveredRating;
  }

  let hiddenInputValue = '';
  if (selectedRating > 0) {
    hiddenInputValue = String(selectedRating);
  }

  let statusLabelText = 'Tap a star';
  let statusColorClass = 'text-neutral-400';
  if (activeRating > 0) {
    statusLabelText = RATING_LABELS[activeRating];
    statusColorClass = 'text-amber-600';
  }

  function handleMouseLeaveGroup() {
    setHoveredRating(0);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input type="hidden" name={inputName} value={hiddenInputValue} />
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Rating"
        onMouseLeave={handleMouseLeaveGroup}
      >
        {STAR_VALUES.map(function renderStarButton(starNumber) {
          const isChecked = selectedRating === starNumber;
          let starAriaLabel = `${starNumber} star`;
          if (starNumber > 1) {
            starAriaLabel = `${starNumber} stars`;
          }

          let starColorClass = 'text-neutral-300';
          if (starNumber <= activeRating) {
            starColorClass = 'text-amber-400';
          }

          function handleSelectStar() {
            setSelectedRating(starNumber);
          }

          function handleHoverStar() {
            setHoveredRating(starNumber);
          }

          return (
            <button
              key={starNumber}
              type="button"
              role="radio"
              aria-checked={isChecked}
              aria-label={starAriaLabel}
              onClick={handleSelectStar}
              onMouseEnter={handleHoverStar}
              className="p-0.5 cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              <FaStar className={`w-7 h-7 transition-colors ${starColorClass}`} />
            </button>
          );
        })}
      </div>
      <span className={`text-sm font-medium ${statusColorClass}`}>
        {statusLabelText}
      </span>
    </div>
  );
}