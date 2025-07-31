import { Progress } from '@/components/ui/progress';
import { Mood } from '@/data/mood';
import React from 'react';

interface MoodStatData extends Mood {
  value: number;
}

interface MoodStatsProps {
  data: MoodStatData[];
}

const MoodStats = ({ data }: MoodStatsProps) => {
  const totalDays = data.reduce((sum, mood) => sum + mood.value, 0);

  if (totalDays === 0) {
    return null; // Don't show anything if there's no data
  }

  return (
    <div className="space-y-4">
      {data.map(mood => {
        const percentage = totalDays > 0 ? Math.round((mood.value / totalDays) * 100) : 0;
        return (
          <div key={mood.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mood.emoji}</span>
                <span className="font-medium">{mood.label}</span>
              </div>
              <span className="text-muted-foreground">{mood.value} day{mood.value !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={percentage} 
                className="h-2 w-full bg-white border [&>div]:bg-[var(--mood-color)]"
                style={{ '--mood-color': mood.color } as React.CSSProperties}
              />
              <span className="text-xs font-semibold w-10 text-right">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MoodStats;