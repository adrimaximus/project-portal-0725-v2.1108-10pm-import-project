import { useState, useMemo, useRef } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatValue, formatNumber } from '@/lib/formatting';
import GoalLogTable from './GoalLogTable';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generatePastelColor } from '@/lib/utils';
import { Paperclip, X } from 'lucide-react';

interface GoalValueTrackerProps {
  goal: Goal;
  onLogValue: (date: Date, value: number, file?: File | null) => void;
}

const GoalValueTracker = ({ goal, onLogValue }: GoalValueTrackerProps) => {
  const [logValue, setLogValue] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentPeriodTotal, periodProgress, periodName, logsInPeriod, daysRemaining, valueToGo, achieverSummary } = useMemo(() => {
    const today = new Date();
    let periodStart, periodEnd, periodName;

    if (goal.target_period === 'Weekly') {
      periodStart = startOfWeek(today, { weekStartsOn: 1 });
      periodEnd = endOfWeek(today, { weekStartsOn: 1 });
      periodName = "minggu ini";
    } else { // Monthly
      periodStart = startOfMonth(today);
      periodEnd = endOfMonth(today);
      periodName = "bulan ini";
    }

    const daysRemaining = differenceInDays(periodEnd, today);

    const logsInPeriod = goal.completions.filter(c => {
      const completionDate = parseISO(c.date);
      return isWithinInterval(completionDate, { start: periodStart, end: periodEnd });
    });

    const currentPeriodTotal = logsInPeriod.reduce((sum, c) => sum + c.value, 0);
    const periodProgress = goal.target_value ? Math.round((currentPeriodTotal / goal.target_value) * 100) : 0;
    const valueToGo = Math.max(0, (goal.target_value || 0) - currentPeriodTotal);
    
    const achieverSummary = goal.collaborators.map(collaborator => {
        const collaboratorLogs = logsInPeriod.filter(log => log.userId === collaborator.id);
        const totalValue = collaboratorLogs.reduce((sum, log) => sum + log.value, 0);
        return {
            ...collaborator,
            totalValue,
        };
    }).filter(summary => summary.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    return { currentPeriodTotal, periodProgress, periodName, logsInPeriod, daysRemaining, valueToGo, achieverSummary };
  }, [goal]);

  const handleLog = () => {
    const value = Number(logValue);
    if (value > 0) {
      onLogValue(new Date(), value, file);
      toast.success(`Mencatat ${formatValue(value, goal.unit)} untuk "${goal.title}"`);
      setLogValue('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      toast.error("Silakan masukkan angka yang valid.");
    }
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/,/g, '');

    if (sanitizedValue === '') {
      setLogValue('');
      return;
    }

    const numValue = parseInt(sanitizedValue, 10);
    if (!isNaN(numValue)) {
      setLogValue(numValue);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Progres {periodName}</CardTitle>
          {daysRemaining >= 0 && (
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {daysRemaining} hari lagi
            </span>
          )}
        </div>
        <CardDescription>
          Anda telah mencatat {formatValue(currentPeriodTotal, goal.unit)} dari {formatValue(goal.target_value || 0, goal.unit)}.
          {valueToGo > 0 ? (
            <span className="font-medium"> {formatValue(valueToGo, goal.unit)} lagi.</span>
          ) : (
            <span className="font-medium text-green-600"> Target tercapai! 🎉</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress value={periodProgress} style={{ '--primary-color': goal.color } as React.CSSProperties} className="h-3 [&>*]:bg-[var(--primary-color)]" />
          <span className="font-bold text-lg">{periodProgress}%</span>
        </div>
        <div className="flex flex-col gap-2 mt-4">
            <div className="flex gap-2">
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={`Catat ${goal.unit || 'nilai'}...`}
                    value={logValue !== '' ? formatNumber(logValue) : ''}
                    onChange={handleNumericInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleLog()}
                    className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                />
                <Button onClick={handleLog}>Catat</Button>
            </div>
            {file && (
                <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded-md">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>

        {achieverSummary.length > 1 && (
            <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground">Kontribusi per Anggota</h4>
                <ul className="space-y-4">
                    {achieverSummary.map(achiever => (
                        <li key={achiever.id} className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                                <AvatarImage src={achiever.avatar_url} alt={achiever.name} />
                                <AvatarFallback style={generatePastelColor(achiever.id)}>{achiever.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold">{achiever.name}</p>
                                    <p className="text-sm font-bold">{formatValue(achiever.totalValue, goal.unit)}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Progress 
                                        value={currentPeriodTotal > 0 ? (achiever.totalValue / currentPeriodTotal) * 100 : 0} 
                                        className="h-1.5 flex-1 [&>*]:bg-[var(--primary-color)]"
                                        style={{ '--primary-color': goal.color } as React.CSSProperties}
                                    />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {Math.round(currentPeriodTotal > 0 ? (achiever.totalValue / currentPeriodTotal) * 100 : 0)}%
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        <GoalLogTable logs={logsInPeriod} unit={goal.unit} goalType={goal.type} />
      </CardContent>
    </Card>
  );
};

export default GoalValueTracker;