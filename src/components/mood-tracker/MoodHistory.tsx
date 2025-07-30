import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { MoodHistoryEntry, moods } from '@/data/mood';
import { DayContent, DayContentProps } from 'react-day-picker';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
}

const MoodHistory = ({ history }: MoodHistoryProps) => {
  const [month, setMonth] = useState(new Date());

  // Create a Map for efficient lookups of mood entries by date
  const historyMap = new Map(history.map(entry => [entry.date, entry.moodId]));

  // Define modifiers for react-day-picker. Each mood gets a modifier.
  const moodModifiers = moods.reduce((acc, mood) => {
    acc[`mood-${mood.id}`] = (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      return historyMap.get(dateString) === mood.id;
    };
    return acc;
  }, {} as Record<string, (date: Date) => boolean>);

  // Define the styles for each mood modifier
  const moodModifierStyles = moods.reduce((acc, mood) => {
    acc[`mood-${mood.id}`] = {
      backgroundColor: mood.color,
      color: '#fff', // Use white text for better contrast on colored backgrounds
      borderRadius: '0.5rem',
    };
    return acc;
  }, {} as Record<string, React.CSSProperties>);

  // Custom component to render the content of a day cell
  const CustomDayContent = (props: DayContentProps) => {
    const defaultContent = <DayContent {...props} />;
    
    // Don't customize days outside the current month
    if (props.activeModifiers.outside) {
      return defaultContent;
    }

    const dateString = props.date.toISOString().split('T')[0];
    const moodId = historyMap.get(dateString);
    const mood = moodId ? moods.find(m => m.id === moodId) : null;

    // If a mood is logged for this day, show the emoji
    if (mood) {
      return <span className="text-lg" role="img" aria-label={mood.label}>{mood.emoji}</span>;
    }

    // Otherwise, show the default day number
    return defaultContent;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center p-2 sm:p-4">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          modifiers={moodModifiers}
          modifiersStyles={moodModifierStyles}
          components={{
            DayContent: CustomDayContent,
          }}
          className="p-0"
        />
      </CardContent>
    </Card>
  );
};

export default MoodHistory;