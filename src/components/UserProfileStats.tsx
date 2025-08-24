import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, BookOpen, Smile } from 'lucide-react';
import { moods } from '@/data/mood';

interface UserProfileStatsProps {
  userId: string;
}

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: string | number, icon: React.ReactNode, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const UserProfileStats = ({ userId }: UserProfileStatsProps) => {
  const { data: goalStats, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['userGoalStats', userId],
    queryFn: async () => {
      const { data: companyTags } = await supabase.from('tags').select('id').in('name', ['office', '7inked', 'betterworks.id']);
      if (!companyTags || companyTags.length === 0) return { count: 0 };

      const { data: collaboratorGoals } = await supabase.from('goal_collaborators').select('goal_id').eq('user_id', userId);
      if (!collaboratorGoals || collaboratorGoals.length === 0) return { count: 0 };

      const { count } = await supabase.from('goal_tags')
        .select('goal_id', { count: 'exact', head: true })
        .in('goal_id', collaboratorGoals.map(g => g.goal_id))
        .in('tag_id', companyTags.map(t => t.id));
      
      return { count: count || 0 };
    },
  });

  const { data: kbStats, isLoading: isLoadingKb } = useQuery({
    queryKey: ['userKbStats', userId],
    queryFn: async () => {
      const { count } = await supabase.from('kb_articles').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      return { count: count || 0 };
    },
  });

  const { data: moodStats, isLoading: isLoadingMood } = useQuery({
    queryKey: ['userMoodStats', userId],
    queryFn: async () => {
      const { data } = await supabase.from('mood_history').select('mood_id').eq('user_id', userId).order('date', { ascending: false }).limit(30);
      if (!data || data.length === 0) return { mostFrequent: 'N/A' };
      
      const counts = data.reduce((acc, { mood_id }) => {
        acc[mood_id] = (acc[mood_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const mostFrequentId = Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b);
      const mostFrequentMood = moods.find(m => m.id === parseInt(mostFrequentId));
      
      return { mostFrequent: mostFrequentMood ? `${mostFrequentMood.emoji} ${mostFrequentMood.label}` : 'N/A' };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard 
        title="Company Goals" 
        value={goalStats?.count || 0} 
        icon={<Target className="h-4 w-4 text-muted-foreground" />} 
        isLoading={isLoadingGoals} 
      />
      <StatCard 
        title="KB Articles Created" 
        value={kbStats?.count || 0} 
        icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} 
        isLoading={isLoadingKb} 
      />
      <StatCard 
        title="Recent Mood" 
        value={moodStats?.mostFrequent || 'N/A'} 
        icon={<Smile className="h-4 w-4 text-muted-foreground" />} 
        isLoading={isLoadingMood} 
      />
    </div>
  );
};

export default UserProfileStats;