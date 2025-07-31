import { Goal } from '@/data/goals';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { format, isAfter, startOfDay, parseISO } from 'date-fns';

interface CompletionCalendarProps {
  goal: Goal;
  onToggleCompletion: (date: string) => void;
}

const CompletionCalendar = ({ goal, onToggleCompletion }: CompletionCalendarProps) => {
  const [month, setMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const completedDays = goal.completions
    .filter(c => c.completed)
    .map(c => parseISO(c.date));

  const handleDayClick = (day: Date | undefined) => {
    if (!day || isAfter(day, today)) {
      return;
    }
    onToggleCompletion(format(day, 'yyyy-MM-dd'));
  };

  return (
    <Calendar
      mode="multiple"
      selected={completedDays}
      onDayClick={handleDayClick}
      month={month}
      onMonthChange={setMonth}
      disabled={(date) => isAfter(date, today)}
      modifiers={{
        completed: completedDays,
      }}
      styles={{
        completed: {
            backgroundColor: goal.color,
            color: 'white',
        },
        button: {
            backgroundColor: 'transparent',
        }
      }}
      className="rounded-md border p-0"
    />
  );
};

export default CompletionCalendar;