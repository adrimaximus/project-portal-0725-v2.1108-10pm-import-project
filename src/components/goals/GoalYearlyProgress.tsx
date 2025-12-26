import { useState, useEffect, useRef } from 'react';
import { Goal } from '@/types';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X, FileText, Paperclip, Eye, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AiCoachInsight from './AiCoachInsight';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface GoalYearlyProgressProps {
  goal: Goal;
  onToggleCompletion: (date: Date) => void;
  onUpdateCompletion: (date: Date, value: number, file?: File | null, removeAttachment?: boolean) => void;
}

const GoalYearlyProgress = ({ goal, onToggleCompletion, onUpdateCompletion }: GoalYearlyProgressProps) => {
  const { completions: rawCompletions, color, specific_days: specificDays } = goal;
  
  // Explicitly map snake_case from DB to our internal camelCase usage if needed, 
  // or just use the properties directly if the type is correct.
  const completions = rawCompletions.map(c => ({ 
    date: c.date, 
    completed: c.value === 1,
    attachmentUrl: c.attachment_url || (c as any).attachmentUrl, // Fallback for safety
    attachmentName: c.attachment_name || (c as any).attachmentName
  }));

  const today = new Date();
  const currentYear = getYear(today);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<{ url: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dayToConfirm, setDayToConfirm] = useState<Date | null>(null);

  const todayStart = startOfDay(today);

  const handlePrevYear = () => setDisplayYear(prev => prev - 1);
  const handleNextYear = () => setDisplayYear(prev => prev + 1);

  const yearStartDate = startOfYear(new Date(displayYear, 0, 1));
  const yearEndDate = endOfYear(new Date(displayYear, 0, 1));

  const relevantCompletions = completions.filter(c => {
    const completionDate = parseISO(c.date);
    return isWithinInterval(completionDate, { start: yearStartDate, end: yearEndDate });
  });
  
  const totalCompleted = relevantCompletions.filter(c => c.completed).length;
  const totalPossible = relevantCompletions.length;
  const overallPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const months = Array.from({ length: 12 }).map((_, i) => startOfMonth(new Date(displayYear, i, 1)));

  const dayKeys = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const isDaily = !specificDays || specificDays.length === 0 || specificDays.length === 7;

  const isDayValidForGoal = (date: Date): boolean => {
    if (isDaily) return true;
    const dayKey = dayKeys[getDay(date)];
    return specificDays!.includes(dayKey);
  };

  const monthlyData = months.map(monthDate => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const completionMap = new Map<string, { completed: boolean; attachmentUrl?: string; attachmentName?: string }>(
      relevantCompletions.map(c => [
        format(parseISO(c.date), 'yyyy-MM-dd'), 
        { completed: c.completed, attachmentUrl: c.attachmentUrl, attachmentName: c.attachmentName }
      ])
    );

    const daysWithStatus = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const isValid = isDayValidForGoal(day);
        const completionData = completionMap.get(dayStr);
        
        let isCompleted: boolean | undefined;
        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;

        if (completionData) {
            isCompleted = completionData.completed;
            attachmentUrl = completionData.attachmentUrl;
            attachmentName = completionData.attachmentName;
        }
        
        if (isCompleted === undefined && isValid && isBefore(day, todayStart)) {
            isCompleted = false;
        }
        return { date: day, isCompleted, isValid, attachmentUrl, attachmentName };
    });

    const possibleDaysInPast = daysWithStatus.filter(d => d.isValid && isBefore(d.date, todayStart));
    const completedCount = possibleDaysInPast.filter(d => d.isCompleted === true).length;
    const possibleCount = possibleDaysInPast.length;
    const percentage = possibleCount > 0 ? Math.round((completedCount / possibleCount) * 100) : 0;

    return {
        date: monthDate,
        name: format(monthDate, 'MMMM', { locale: enUS }),
        percentage,
        completedCount,
        possibleCount,
        days: daysWithStatus.map(d => ({ 
            date: d.date, 
            isCompleted: d.isCompleted, 
            attachmentUrl: d.attachmentUrl,
            attachmentName: d.attachmentName
        }))
    };
  });

  const [aiContext, setAiContext] = useState<{
    yearly?: { percentage: number };
    month?: { name: string; percentage: number; completedCount: number; possibleCount: number; };
  }>({ yearly: { percentage: overallPercentage } });

  const handleDayClick = (day: { date: Date; isCompleted?: boolean; attachmentUrl?: string; attachmentName?: string }) => {
    if (isAfter(day.date, todayStart)) return;
    
    setSelectedDay(day.date);
    setIsCompleted(!!day.isCompleted);
    setFile(null);
    if (day.attachmentUrl) {
      setExistingAttachment({ url: day.attachmentUrl, name: day.attachmentName || 'Attachment' });
    } else {
      setExistingAttachment(null);
    }
  };

  const handleSaveDay = () => {
    if (selectedDay) {
        // If file is present, it will replace existing. 
        // If existingAttachment is null but was present initially, and no file, it means delete.
        // However, here we have explicit delete button.
        // If we just save, we pass the file if new. 
        onUpdateCompletion(selectedDay, isCompleted ? 1 : 0, file);
    }
    setSelectedDay(null);
  };

  const handleRemoveExistingAttachment = () => {
    if (selectedDay) {
        onUpdateCompletion(selectedDay, isCompleted ? 1 : 0, null, true);
        setExistingAttachment(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
    }
  };

  const handleConfirmToggle = () => {
      if (dayToConfirm) {
          onToggleCompletion(dayToConfirm);
          setDayToConfirm(null);
      }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>Yearly Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevYear}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg w-24 text-center">{displayYear}</span>
              <Button variant="outline" size="icon" onClick={handleNextYear} disabled={displayYear === currentYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            You have completed this target <strong>{totalCompleted}</strong> of <strong>{totalPossible}</strong> times in {displayYear}.
          </CardDescription>
          <div className="flex items-center gap-4 pt-2">
            <Progress value={overallPercentage} className="w-full" indicatorStyle={{ backgroundColor: color }} />
            <span className="font-bold text-lg">{overallPercentage}%</span>
          </div>
          <AiCoachInsight 
            goal={goal} 
            yearlyProgress={aiContext.yearly}
            monthlyProgress={aiContext.month}
          />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthlyData.map(month => {
            return (
              <div 
                key={month.name} 
                className="p-3 border rounded-lg transition-all hover:bg-muted/20"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-sm">{month.name}</p>
                  <p className="text-sm font-bold">{month.percentage}%</p>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: (month.days[0].date.getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
                  {month.days.map(day => {
                    const isFutureDay = isAfter(day.date, todayStart);
                    const isValidDay = isDayValidForGoal(day.date);
                    const isDisabled = isFutureDay || !isValidDay;
                    const isMissed = isValidDay && day.isCompleted === false;

                    const buttonStyle: React.CSSProperties = {};
                    let buttonClasses = "w-full h-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed relative";

                    if (isMissed) {
                      buttonStyle.backgroundColor = 'transparent';
                      buttonStyle.border = `1px solid ${color}80`;
                      buttonClasses += ' box-border';
                    } else {
                      let bgColor = '#E5E7EB';
                      if (isValidDay && day.isCompleted === true) {
                        bgColor = color;
                      }
                      buttonStyle.backgroundColor = bgColor;
                    }

                    if (isFutureDay) {
                      buttonStyle.opacity = 0.2;
                    }

                    return (
                      <TooltipProvider key={day.date.toString()} delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                              disabled={isDisabled}
                              className={buttonClasses}
                              style={buttonStyle}
                            >
                              {day.attachmentUrl && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                                </div>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(day.date, 'PPP', { locale: enUS })}</p>
                            {isFutureDay ? <p>Future date</p> : 
                             !isValidDay ? <p>Not a scheduled day</p> :
                             day.isCompleted !== undefined ? (
                                <>
                                  <p>{day.isCompleted ? 'Completed' : 'Not completed'}</p>
                                  {day.attachmentUrl && <div className="flex items-center gap-1 mt-1 text-xs text-primary"><FileText className="h-3 w-3" /> Report attached</div>}
                                </>
                             ) : <p>Click to update</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Update Progress</DialogTitle>
                  <DialogDescription>
                      {selectedDay && format(selectedDay, "EEEE, MMMM do, yyyy")}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                      <Label htmlFor="completed-toggle">Completed</Label>
                      <Switch id="completed-toggle" checked={isCompleted} onCheckedChange={setIsCompleted} />
                  </div>
                  <div className="space-y-2">
                      <Label>Attachment</Label>
                      {existingAttachment && !file ? (
                          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                              <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText className="h-4 w-4 text-primary shrink-0" />
                                  <a href={existingAttachment.url} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline">
                                      {existingAttachment.name}
                                  </a>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(existingAttachment.url, '_blank')}>
                                      <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleRemoveExistingAttachment}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip className="h-4 w-4 mr-2" /> {file ? 'Change File' : 'Upload Report'}
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                            {file && (
                                <div className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }} />
                                </div>
                            )}
                        </div>
                      )}
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setSelectedDay(null)}>Cancel</Button>
                  <Button onClick={handleSaveDay}>Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={!!dayToConfirm} onOpenChange={() => setDayToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to change this?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will change the completion status for a past date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setDayToConfirm(null)}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleConfirmToggle}>
                Confirm
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GoalYearlyProgress;