import { useAuth } from '@/contexts/AuthContext';
import MoodSelector from '@/components/mood-tracker/MoodSelector';
import MoodHistory from '@/components/mood-tracker/MoodHistory';
import AiFriendSuggestion from '@/components/mood-tracker/AiFriendSuggestion';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, formatISO } from 'date-fns';
import { MoodEntry } from '@/types';

const fetchMoodHistory = async (userId: string, days: number): Promise<MoodEntry[]> => {
  const { data, error } = await supabase
    .from('mood_history')
    .select('*')
    .eq('user_id', userId)
    .gte('date', formatISO(subDays(new Date(), days), { representation: 'date' }))
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const MoodTracker = () => {
  const { user, isLoading: authLoading } = useAuth();
  const periodDays = 30;

  const { data: moodHistory } = useQuery({
    queryKey: ['moodHistory', user?.id, periodDays],
    queryFn: () => fetchMoodHistory(user!.id, periodDays),
    enabled: !!user,
  });

  if (authLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div>Please log in to track your mood.</div>;
  }
  
  const userName = user?.name || 'there';

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hello, {userName}!</h1>
        <p className="text-muted-foreground">How are you feeling today?</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <MoodSelector />
          <MoodHistory />
        </div>
        <div>
          <AiFriendSuggestion 
            data={moodHistory || []}
            period={periodDays}
            userName={userName}
          />
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;