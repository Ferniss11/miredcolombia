
'use client';

import { Star } from 'lucide-react';

export const StarRating = ({ rating, count }: { rating?: number; count?: number }) => {
  if (!rating || !count) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        <span className="text-sm font-bold">{rating.toFixed(1)}</span>
        <Star className="w-4 h-4 ml-1 text-yellow-400 fill-yellow-400" />
      </div>
      <span className="text-xs text-muted-foreground">({count} reseñas)</span>
    </div>
  );
};
