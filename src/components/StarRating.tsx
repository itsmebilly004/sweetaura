import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  count?: number;
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

const StarRating = ({ count = 5, value, onChange, size = 24, className, disabled = false }: StarRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(count)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => !disabled && onChange(ratingValue)}
              className="sr-only"
              disabled={disabled}
            />
            <Star
              size={size}
              className={cn(
                "cursor-pointer transition-colors",
                ratingValue <= (hover || value)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onMouseEnter={() => !disabled && setHover(ratingValue)}
              onMouseLeave={() => !disabled && setHover(null)}
            />
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;