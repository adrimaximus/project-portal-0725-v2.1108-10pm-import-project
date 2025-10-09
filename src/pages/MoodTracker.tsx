import { useState, useMemo, useEffect } from 'react';
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import PortalLayout from '@/components/PortalLayout';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodOverview from '@/components/mood-tracker/MoodOverview';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import MoodStats from '@/components/mood-tracker/MoodStats';
import AiFriendSuggestion from '@/components/mood-tracker/AiFriendSuggestion';
import { moods, Mood, MoodHistoryEntry } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

type MoodTrackerPeriod = 'week' | 'month' | 'year' | 'custom';

const MoodTracker = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<Mood['id']>(moods[0].id);
  const [history, setHistory] = useState<MoodHistoryEntry[]>([]);
  const [period, setPeriod] = useState<MoodTrackerPeriod>('week');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        toast.error("Failed to load your mood history.");
        console.error(error);
      } else {
        const formattedHistory: MoodHistoryEntry[] = data.map(entry => ({
          id: entry.id,
          date: entry.date,
          moodId: entry.mood_id,
          userId: entry.user_id,
        }));
        setHistory(formattedHistory);
      }
    };

    fetchHistory();
  }, [user]);

  const handleSubmit = async () => {
    const selectedMood = moods.find(mood => mood.id === selectedMoodId);
    if (!selectedMood || !user) {
      toast.error("You must be logged in to record your mood.");
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    const { error } = await supabase
      .from('mood_history')
      .upsert(
        { user_id: user.id, date: todayString, mood_id: selectedMoodId },
        { onConflict: 'user_id, date' }
      );

    if (error) {
      toast.error("Could not save your mood. Please try again.");
      console.error(error);
    } else {
      // Optimistic UI update
      const existingEntryIndex = history.findIndex(entry => entry.date === todayString);
      const newEntry: MoodHistoryEntry = {
        id: existingEntryIndex !== -1 ? history[existingEntryIndex].id : uuidv4(),
        date: todayString,
        moodId: selectedMoodId,
        userId: user.id,
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
    }
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

  const getTitleForPeriod = (baseTitle: string) => {
    switch (period) {
      case 'month': return `${baseTitle} for This Month`;
      case 'year': return `${baseTitle} for This Year`;
      case 'custom':
        if (dateRange?.from && dateRange?.to) {
          return `${baseTitle}: ${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}`;
        }
        return `${baseTitle} for Custom Range`;
      case 'week':
      default:
        return `${baseTitle} for This Week`;
    }
  };

  const { moodDataForPeriod, historyForPeriod } = useMemo(() => {
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week':
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'year':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'custom':
        if (dateRange?.from) {
          startDate = dateRange.from;
          endDate = dateRange.to || dateRange.from;
        }
        break;
    }

    if (!startDate || !endDate) {
      return { moodDataForPeriod: [], historyForPeriod: [] };
    }
    
    const startDateString = format(startDate, 'yyyy-MM-dd');
    const endDateString = format(endDate, 'yyyy-MM-dd');

    const filteredHistory = history.filter(entry => {
      return entry.date >= startDateString && entry.date <= endDateString;
    });

    const calculatedMoodData = moods.map(mood => ({
      ...mood,
      value: filteredHistory.filter(entry => entry.moodId === mood.id).length,
    })).filter(mood => mood.value > 0);

    return { moodDataForPeriod: calculatedMoodData, historyForPeriod: filteredHistory };
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
              <CardTitle>{getTitleForPeriod("Overview")}</CardTitle>
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

          <MoodHistory 
            history={historyForPeriod} 
            title={getTitleForPeriod("History")}
            className="lg:col-span-3" 
          />
        </div>
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;