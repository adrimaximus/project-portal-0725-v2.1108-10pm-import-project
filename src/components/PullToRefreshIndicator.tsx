import { Loader2, ArrowDown } from 'lucide-react';

const PULL_THRESHOLD = 80;

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullPosition: number;
}

const PullToRefreshIndicator = ({ isRefreshing, pullPosition }: PullToRefreshIndicatorProps) => {
  const rotation = Math.min(pullPosition / PULL_THRESHOLD, 1) * 180;
  const opacity = Math.min(pullPosition / PULL_THRESHOLD, 1);

  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-center items-center transition-opacity duration-200 pointer-events-none"
      style={{ 
        transform: `translateY(${pullPosition - 60}px)`,
        opacity: isRefreshing ? 1 : opacity,
      }}
    >
      <div className="bg-background rounded-full shadow-lg p-2 mt-4">
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <ArrowDown
            className="h-6 w-6 text-muted-foreground transition-transform"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;