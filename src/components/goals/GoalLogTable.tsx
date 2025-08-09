import { Goal, GoalCompletion } from '@/data/goals';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatValue } from '@/lib/formatting';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GoalLogTableProps {
  logs: GoalCompletion[];
  unit?: string;
  goalType: Goal['type'];
}

const GoalLogTable = ({ logs, unit, goalType }: GoalLogTableProps) => {
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    const fetchUsers = async () => {
      const userIds = [...new Set(logs.map(log => log.userId).filter(id => id))];
      if (userIds.length === 0) return;

      const { data, error } = await supabase.from('profiles').select('*').in('id', userIds);
      
      if (data) {
        const newMap = new Map<string, User>();
        data.forEach(profile => {
          newMap.set(profile.id, {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
            avatar: profile.avatar_url,
            email: profile.email,
            initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
            first_name: profile.first_name,
            last_name: profile.last_name,
          });
        });
        setUserMap(newMap);
      }
    };
    fetchUsers();
  }, [logs]);

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No logs yet.</p>;
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="border rounded-md mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Achiever</TableHead>
            <TableHead className="text-right">
              {goalType === 'quantity' ? 'Quantity' : 'Value'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLogs.map((log, index) => {
            const achiever = log.userId ? userMap.get(log.userId) : null;
            return (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground text-xs">
                  {format(new Date(log.date), 'MMM dd, yyyy, hh:mm a')}
                </TableCell>
                <TableCell>
                  {achiever ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={achiever.avatar || undefined} />
                        <AvatarFallback>{achiever.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{achiever.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatValue(log.value, unit)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default GoalLogTable;