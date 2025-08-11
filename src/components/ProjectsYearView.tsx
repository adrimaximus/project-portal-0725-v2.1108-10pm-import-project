import { Project } from '@/data/projects';
import { GoogleCalendarEvent } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfMonth,
  startOfWeek,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectsYearViewProps {
  projects: Project[];
  events: GoogleCalendarEvent[];
}

const ProjectsYearView = ({ projects, events }: ProjectsYearViewProps) => {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
      end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });
  }, [firstDayCurrentMonth]);

  const projectsByDay = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach(p => {
      const start = parseISO(p.startDate);
      const end = parseISO(p.dueDate);
      const intervalDays = eachDayOfInterval({ start, end });
      intervalDays.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(p);
      });
    });
    return map;
  }, [projects]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, GoogleCalendarEvent[]>();
    events.forEach(e => {
      const dayKey = format(parseISO(e.start.dateTime), 'yyyy-MM-dd');
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)?.push(e);
    });
    return map;
  }, [events]);

  const previousMonth = () => {
    const prev = new Date(firstDayCurrentMonth.setMonth(firstDayCurrentMonth.getMonth() - 1));
    setCurrentMonth(format(prev, 'MMM-yyyy'));
  };

  const nextMonth = () => {
    const next = new Date(firstDayCurrentMonth.setMonth(firstDayCurrentMonth.getMonth() + 1));
    setCurrentMonth(format(next, 'MMM-yyyy'));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {format(firstDayCurrentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={previousMonth}><ChevronLeft /></button>
          <button onClick={nextMonth}><ChevronRight /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-px mt-2">
        {days.map(day => (
          <div
            key={day.toString()}
            className={cn(
              'border border-muted/40 p-2 h-32 overflow-y-auto',
              !isSameMonth(day, firstDayCurrentMonth) && 'bg-muted/20 text-muted-foreground'
            )}
          >
            <time dateTime={format(day, 'yyyy-MM-dd')} className={cn('font-bold', isToday(day) && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center')}>
              {format(day, 'd')}
            </time>
            <div className="mt-1 text-xs">
              {(projectsByDay.get(format(day, 'yyyy-MM-dd')) || []).map(p => (
                <div key={p.id} className="bg-blue-100 rounded px-1 mb-1 truncate">{p.name}</div>
              ))}
              {(eventsByDay.get(format(day, 'yyyy-MM-dd')) || []).map(e => (
                <div key={e.id} className="bg-green-100 rounded px-1 mb-1 truncate">{e.summary}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsYearView;