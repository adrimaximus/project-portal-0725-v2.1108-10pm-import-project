"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  count?: number;
  value?: number;
  onValueChange?: (rating: number) => void;
  isReadOnly?: boolean;
}

const StarRating = ({ count = 5, value = 0, onValueChange, isReadOnly = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);
  const stars = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (rating: number) => {
    if (!isReadOnly && onValueChange) {
      onValueChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!isReadOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!isReadOnly) {
      setHoverValue(undefined);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            !isReadOnly && 'cursor-pointer',
            'transition-colors',
            (hoverValue || value) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  );
};

export default StarRating;