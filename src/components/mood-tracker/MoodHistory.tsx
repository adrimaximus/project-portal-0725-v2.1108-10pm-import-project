import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { moods, MoodHistoryEntry } from '@/data/mood';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
}

const MoodHistory = ({ history }: MoodHistoryProps) => {
  const getMoodById = (moodId: number) => {
    return moods.find(mood => mood.id === moodId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Mood</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map(entry => {
              const mood = getMoodById(entry.moodId);
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className="text-2xl" title={mood?.label}>{mood?.emoji}</span>
                  </TableCell>
                  <TableCell>{new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MoodHistory;