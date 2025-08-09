import { useState, useMemo } from 'react';
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import MoodStats from '@/components/mood-tracker/MoodStats';
import AiFriendSuggestion from '@/components/mood-tracker/AiFriendSuggestion';
import { moods, dummyHistory, Mood, MoodHistoryEntry } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

type MoodTrackerPeriod = 'week' | 'month' | 'year' | 'custom';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);
  const [history, setHistory] = useState<MoodHistoryEntry[]>(dummyHistory);
  const [period, setPeriod] = useState<MoodTrackerPeriod>('week');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = () => {
    const selectedMood = moods.find(mood => mood.id === selectedMoodId);
    if (!selectedMood) return;

    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const existingEntryIndex = history.findIndex(entry => entry.date === todayString);

    const newEntry: MoodHistoryEntry = {
      id: existingEntryIndex !== -1 ? history[existingEntryIndex].id : Date.now(),
      date: todayString,
      moodId: selectedMoodId,
    };

    let updatedHistory;
    if (existingEntryIndex !== -1) {
      updatedHistory = history.map((entry, index) =>
        index === existingEntryIndex ? newEntry : entry
      );
    } else {
      updatedHistory = [...history, newEntry];
    }

    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(updatedHistory);
    toast.success(`Your mood has been recorded: ${selectedMood.label} ${selectedMood.emoji}`);
  };

  const handlePeriodChange = (newPeriod: MoodTrackerPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setDateRange(undefined);
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setPeriod('custom');
  };

  const getOverviewTitle = () => {
    switch (period) {
      case 'month':
        return "This Month's Overview";
      case 'year':
        return "This Year's Overview";
      case 'custom':
        if (dateRange?.from && dateRange?.to) {
          return `Overview: ${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}`;
        }
        return "Custom Range Overview";
      case 'week':
      default:
        return "This Week's Overview";
    }
  };

  const moodDataForPeriod = useMemo(() => {
    const filteredHistory = history.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();

      if (period === 'week') {
        const dayOfWeek = today.getDay();
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - dayOfWeek);
        firstDay.setHours(0, 0, 0, 0);
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        lastDay.setHours(23, 59, 59, 999);
        return entryDate >= firstDay && entryDate <= lastDay;
      }
      if (period === 'month') {
        return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
      }
      if (period === 'year') {
        return entryDate.getFullYear() === today.getFullYear();
      }
      if (period === 'custom' && dateRange?.from && dateRange?.to) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        return entryDate >= from && entryDate <= to;
      }
      return false;
    });

    return moods.map(mood => ({
      ...mood,
      value: filteredHistory.filter(entry => entry.moodId === mood.id).length,
    })).filter(mood => mood.value > 0);
  }, [history, period, dateRange]);

  const effectivePeriodForSuggestion = useMemo(() => {
    if (period === 'custom' && dateRange?.from && dateRange?.to) {
      const days = differenceInDays(dateRange.to, dateRange.from);
      if (days <= 7) return 'week';
      if (days <= 31) return 'month';
      return 'year';
    }
    if (period !== 'custom') {
      return period;
    }
    return null;
  }, [period, dateRange]);

  const userName = user?.name || 'there';

  if (authLoading) {
    return (
      <PortalLayout>
        <div className="space-y-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-full" /></CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Keep a diary of your daily feelings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>How are you feeling today, {userName}?</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodSelector selectedMoodId={selectedMoodId} onSelectMood={setSelectedMoodId} />
              <Button onClick={handleSubmit} className="w-full mt-4">
                Submit Mood
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{getOverviewTitle()}</CardTitle>
              <div className="flex flex-wrap items-center gap-1 rounded-md bg-secondary p-1">
                <Button variant={period === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => handlePeriodChange('week')} className="h-7">This Week</Button>
                <Button variant={period === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => handlePeriodChange('month')} className="h-7">This Month</Button>
                <Button variant={period === 'year' ? 'default' : 'ghost'} size="sm" onClick={() => handlePeriodChange('year')} className="h-7">This Year</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={period === 'custom' ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "h-7 w-full sm:w-auto justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Custom</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <MoodOverview data={moodDataForPeriod} />
                <MoodStats data={moodDataForPeriod} />
              </div>
              {effectivePeriodForSuggestion && (
                <AiFriendSuggestion 
                  data={moodDataForPeriod} 
                  period={effectivePeriodForSuggestion} 
                  userName={userName} 
                />
              )}
            </CardContent>
          </Card>

          <MoodHistory history={history} className="lg:col-span-3" />
        </div>
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;