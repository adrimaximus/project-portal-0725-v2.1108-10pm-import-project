import { useState, useEffect, useRef } from 'react';
import { Goal } from '@/types';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X, FileText, Paperclip, Eye, Trash2, Send, MoreHorizontal, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AiCoachInsight from './AiCoachInsight';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GoalYearlyProgressProps {
  goal: Goal;
  onToggleCompletion: (date: Date) => void;
  onUpdateCompletion: (date: Date, value: number, file?: File | null, removeAttachment?: boolean, note?: string) => void;
}

const GoalYearlyProgress = ({ goal, onToggleCompletion, onUpdateCompletion }: GoalYearlyProgressProps) => {
  const { completions: rawCompletions, color, specific_days: specificDays } = goal;
  const { user } = useAuth();
  
  // Map completions, ensuring we catch 'notes' from DB and map it to 'note' for internal use
  const completions = rawCompletions.map(c => ({ 
    date: c.date, 
    completed: c.value === 1,
    attachmentUrl: (c as any).attachment_url,
    attachmentName: (c as any).attachment_name,
    note: (c as any).notes || (c as any).note // Handle both 'notes' (DB column) and 'note' keys
  }));

  const today = new Date();
  const currentYear = getYear(today);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState(""); // State for the existing note
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
    
    // Create a map for fast lookup of completions by date string
    const completionMap = new Map<string, { completed: boolean; attachmentUrl?: string; attachmentName?: string; note?: string }>(
      relevantCompletions.map(c => [
        format(parseISO(c.date), 'yyyy-MM-dd'), 
        { completed: c.completed, attachmentUrl: c.attachmentUrl, attachmentName: c.attachmentName, note: c.note }
      ])
    );

    const daysWithStatus = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const isValid = isDayValidForGoal(day);
        const completionData = completionMap.get(dayStr);
        
        let isCompleted: boolean | undefined;
        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;
        let note: string | undefined;

        if (completionData) {
            isCompleted = completionData.completed;
            attachmentUrl = completionData.attachmentUrl;
            attachmentName = completionData.attachmentName;
            note = completionData.note;
        }
        
        if (isCompleted === undefined && isValid && isBefore(day, todayStart)) {
            isCompleted = false;
        }
        return { date: day, isCompleted, isValid, attachmentUrl, attachmentName, note };
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
            attachmentName: d.attachmentName,
            note: d.note
        }))
    };
  });

  const [aiContext, setAiContext] = useState<{
    yearly?: { percentage: number };
    month?: { name: string; percentage: number; completedCount: number; possibleCount: number; };
  }>({ yearly: { percentage: overallPercentage } });

  const handleDayClick = (day: { date: Date; isCompleted?: boolean; attachmentUrl?: string; attachmentName?: string; note?: string }) => {
    if (isAfter(day.date, todayStart)) return;
    
    setSelectedDay(day.date);
    setIsCompleted(!!day.isCompleted);
    // Separate saved note from input note
    setSavedNote(day.note || ""); 
    setNote(""); // Input starts empty
    setFile(null);
    if (day.attachmentUrl) {
      setExistingAttachment({ url: day.attachmentUrl, name: day.attachmentName || 'Attachment' });
    } else {
      setExistingAttachment(null);
    }
  };

  const handleSaveDay = () => {
    if (selectedDay) {
        // Use new note if typed, otherwise keep savedNote. 
        // If savedNote was cleared by user (via X button), it is empty string here.
        const noteToSend = note.trim() !== "" ? note : savedNote;
        onUpdateCompletion(selectedDay, isCompleted ? 1 : 0, file, false, noteToSend);
    }
    setSelectedDay(null);
  };

  const handleRemoveExistingAttachment = () => {
    if (selectedDay) {
        // Also preserve note when removing attachment
        const noteToSend = note.trim() !== "" ? note : savedNote;
        onUpdateCompletion(selectedDay, isCompleted ? 1 : 0, null, true, noteToSend);
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

  const handleEditNote = () => {
    setNote(savedNote);
    setSavedNote("");
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
                              {(day.attachmentUrl || day.note) && (
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
                                  {day.note && <div className="mt-1 text-xs italic opacity-80 line-clamp-2 max-w-[150px]">"{day.note}"</div>}
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
          <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-xl flex flex-col max-h-[90vh]">
              {/* Header Section */}
              <div className="px-6 py-6 bg-muted/20 border-b shrink-0">
                  <DialogHeader className="p-0 space-y-1 text-left">
                      <DialogTitle className="text-2xl font-bold text-foreground break-words">
                          {selectedDay && format(selectedDay, "MMMM do")}
                      </DialogTitle>
                      <DialogDescription className="text-base text-muted-foreground break-words">
                          {selectedDay && format(selectedDay, "EEEE, yyyy")}
                      </DialogDescription>
                  </DialogHeader>
              </div>

              {/* Body Section */}
              <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Status Card */}
                  <div className="flex flex-row items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-200">
                      <div className="space-y-1 flex-1 mr-4">
                          <Label htmlFor="completed-toggle" className="text-base font-semibold cursor-pointer">
                              Completion Status
                          </Label>
                          <p className="text-xs text-muted-foreground break-words">
                              {isCompleted ? 'Marked as done' : 'Marked as missed'}
                          </p>
                      </div>
                      <Switch 
                          id="completed-toggle" 
                          checked={isCompleted} 
                          onCheckedChange={setIsCompleted}
                          className="scale-110 data-[state=checked]:bg-primary shrink-0"
                      />
                  </div>

                  {/* Attachment Section */}
                  <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground ml-1">Evidence / Report</Label>
                      
                      {existingAttachment && !file ? (
                          <div className="group relative flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/5 hover:border-primary/20 transition-all duration-200">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0 grid gap-0.5">
                                  <p className="text-sm font-medium text-foreground break-all">{existingAttachment.name}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                      onClick={() => window.open(existingAttachment.url, '_blank')}
                                  >
                                      <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                      onClick={handleRemoveExistingAttachment}
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      ) : file ? (
                          <div className="group relative flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/5 transition-all duration-200">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                  <Paperclip className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0 grid gap-0.5">
                                  <p className="text-sm font-medium text-foreground break-all">{file.name}</p>
                                  <p className="text-xs text-emerald-600 font-medium">Ready to upload</p>
                              </div>
                              <div className="shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                              </div>
                          </div>
                      ) : (
                          <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group"
                          >
                              <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-200">
                                  <Paperclip className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div className="text-center space-y-1">
                                  <p className="text-sm font-medium group-hover:text-primary transition-colors">Click to upload</p>
                                  <p className="text-xs text-muted-foreground">PDF, IMG, DOC up to 5MB</p>
                              </div>
                          </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  </div>

                  {/* Note Section */}
                  <div className="space-y-3">
                      {savedNote && (
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground ml-1">Posted Note</Label>
                            <div className="flex gap-3 items-start p-3 rounded-xl border bg-muted/30 relative group">
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-sm text-foreground break-words pt-1 min-w-0">
                                    {savedNote}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0 -mt-1 -mr-1">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleEditNote}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setSavedNote("")}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                      )}

                      <Label htmlFor="note" className="text-sm font-medium text-muted-foreground ml-1">
                        {savedNote ? "Update Note" : "Note"}
                      </Label>
                      <div className="relative">
                        <Textarea 
                          id="note"
                          placeholder="Add a note..." 
                          value={note} 
                          onChange={(e) => setNote(e.target.value)} 
                          className="resize-none min-h-[100px] pr-12"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="absolute bottom-3 right-3 h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={handleSaveDay}
                          title="Save note"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                  </div>
              </div>

              {/* Footer Section */}
              <DialogFooter className="p-6 pt-0 shrink-0">
                  <div className="grid grid-cols-2 gap-3 w-full">
                      <Button variant="outline" onClick={() => setSelectedDay(null)} className="h-11 rounded-lg">
                          Cancel
                      </Button>
                      <Button onClick={handleSaveDay} className="h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                          Save Changes
                      </Button>
                  </div>
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