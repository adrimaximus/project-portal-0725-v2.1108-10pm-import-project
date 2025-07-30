"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingDisplayProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

const StarRatingDisplay = ({ rating, maxRating = 5, className }: StarRatingDisplayProps) => {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            className={cn(
              "h-5 w-5",
              rating >= starValue
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        );
      })}
    </div>
  );
};

export default StarRatingDisplay;