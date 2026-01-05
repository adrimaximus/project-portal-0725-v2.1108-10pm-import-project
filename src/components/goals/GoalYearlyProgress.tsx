import { useState, useEffect, useRef } from 'react';
import { Goal } from '@/types';
import { format, getYear, eachDayOfInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval, isBefore, isToday, isAfter, startOfDay, getDay, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X, FileText, Paperclip, Eye, Trash2, Send, MoreHorizontal, Pencil, Loader2 } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface GoalYearlyProgressProps {
  goal: Goal;
  onToggleCompletion: (date: Date) => void;
  onUpdateCompletion: (date: Date, value: number, file?: File | null, removeAttachment?: boolean, note?: string) => void;
}

const GoalYearlyProgress = ({ goal, onToggleCompletion, onUpdateCompletion }: GoalYearlyProgressProps) => {
  const { completions: rawCompletions, color, specific_days: specificDays } = goal;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
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
  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  // Store mapped mentions to convert back to UUIDs before sending: { "@John Doe": "uuid" }
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({});

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editAttachments, setEditAttachments] = useState<any[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Query for comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['goal_comments', goal.id, selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDay) return [];
      const dateStr = format(selectedDay, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('goal_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          attachments_jsonb,
          profiles:user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('goal_id', goal.id)
        .eq('comment_date', dateStr)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDay
  });

  // Get collaborator IDs to filter mentions
  const collaboratorIds = (goal.collaborators || []).map((c: any) => c.id);

  // Query for profiles (for mentions) - Limited to collaborators
  const { data: profiles } = useQuery({
    queryKey: ['profiles_for_mention', goal.id], // Dependent on goal.id so it refreshes if goal changes
    queryFn: async () => {
      if (collaboratorIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', collaboratorIds)
        .eq('status', 'active');
        
      if (error) throw error;
      return data;
    },
    enabled: collaboratorIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to add comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string, files: File[] }) => {
      if (!selectedDay || !user) throw new Error("No day selected or user not logged in");
      const dateStr = format(selectedDay, 'yyyy-MM-dd');
      
      let attachments: any[] = [];

      if (files && files.length > 0) {
        // Upload all files
        const uploadPromises = files.map(async (file) => {
            const fileName = `${goal.id}/${Date.now()}-${file.name.replace(/[^\x00-\x7F]/g, "")}`;
            const { error: uploadError } = await supabase.storage
                .from('goal-attachments')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('goal-attachments')
                .getPublicUrl(fileName);
                
            return {
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size
            };
        });

        attachments = await Promise.all(uploadPromises);
      }

      // Convert friendly mentions (@Name) back to raw format (@[Name](uuid)) using the map
      let finalContent = content;
      Object.entries(mentionMap).forEach(([name, uuid]) => {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        finalContent = finalContent.replace(new RegExp(escapedName, 'g'), `@[${name.substring(1)}]( ${uuid})`);
      });

      const { error } = await supabase
        .from('goal_comments')
        .insert({
          goal_id: goal.id,
          user_id: user.id,
          comment_date: dateStr,
          content: finalContent,
          attachments_jsonb: attachments
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_comments', goal.id, selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null] });
      setCommentText("");
      setCommentFiles([]);
      setMentionMap({});
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    }
  });

  // Mutation to update comment
  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content, newFiles, existingAttachments }: { id: string, content: string, newFiles: File[], existingAttachments: any[] }) => {
      let updatedAttachments = [...(existingAttachments || [])];

      if (newFiles && newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (file) => {
            const fileName = `${goal.id}/${Date.now()}-${file.name.replace(/[^\x00-\x7F]/g, "")}`;
            const { error: uploadError } = await supabase.storage
                .from('goal-attachments')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('goal-attachments')
                .getPublicUrl(fileName);
                
            return {
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size
            };
        });

        const newAttachments = await Promise.all(uploadPromises);
        updatedAttachments = [...updatedAttachments, ...newAttachments];
      }

      const { error } = await supabase
        .from('goal_comments')
        .update({ 
            content,
            attachments_jsonb: updatedAttachments
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_comments', goal.id, selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null] });
      setEditingCommentId(null);
      setEditContent("");
      setEditNewFiles([]);
      setEditAttachments([]);
      toast.success("Comment updated");
    },
    onError: (error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    }
  });

  // Mutation to delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('goal_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_comments', goal.id, selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    }
  });

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

  const handleSubmitComment = () => {
    if (commentText.trim() || commentFiles.length > 0) {
      addCommentMutation.mutate({ content: commentText, files: commentFiles });
    }
  };

  // Mention handling
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const newCursorPos = e.target.selectionStart;
    setCommentText(text);
    setCursorPos(newCursorPos);

    // Detect if we are typing a mention
    const textBeforeCursor = text.slice(0, newCursorPos);
    // Modified regex to allow spaces in names (e.g. @John Doe) as long as we are still typing
    // It captures anything after @ that isn't another @ or newline, until the cursor
    const mentionMatch = textBeforeCursor.match(/@([^@\n]*)$/);

    if (mentionMatch) {
      setMentionOpen(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (profile: any) => {
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const textAfterCursor = commentText.slice(cursorPos);
    
    // The friendly name to display
    const friendlyName = `@${profile.first_name || 'User'}`;
    
    // Store mapping for submission
    setMentionMap(prev => ({
        ...prev,
        [friendlyName]: profile.id
    }));

    // Replace the part starting with @ until cursor with the friendly name
    const newTextBefore = textBeforeCursor.replace(/@([^@\n]*)$/, `${friendlyName} `);
    
    const newText = newTextBefore + textAfterCursor;
    setCommentText(newText);
    setMentionOpen(false);
    
    // Refocus text area and set cursor position
    setTimeout(() => {
        if (commentTextareaRef.current) {
            commentTextareaRef.current.focus();
            const newPos = newTextBefore.length;
            commentTextareaRef.current.setSelectionRange(newPos, newPos);
        }
    }, 0);
  };

  const filteredProfiles = profiles?.filter(p => {
    if (!mentionQuery) return true;
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const email = (p.email || '').toLowerCase();
    const query = mentionQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && e.key === 'Enter') {
        e.preventDefault();
        // Auto-select the first filtered profile if available
        if (filteredProfiles && filteredProfiles.length > 0) {
            insertMention(filteredProfiles[0]);
        }
    }
  };

  // Helper to render mentions in comments properly
  const renderCommentContent = (content: string) => {
    // Regex to find @[Name](uuid)
    const mentionRegex = /@\[([^\]]+)\]\s*\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      // Add the mention part styled
      parts.push(
        <span key={match.index} className="font-medium text-primary hover:underline cursor-pointer">
          @{match[1]}
        </span>
      );
      lastIndex = mentionRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    return parts.length > 0 ? parts : content;
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
                      <div className="flex justify-between items-center">
                          <Label htmlFor="note" className="text-sm font-medium text-muted-foreground ml-1">Note (Optional)</Label>
                          {savedNote && note === "" && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setSavedNote(""); setNote(""); }}>
                                  Clear Note
                              </Button>
                          )}
                      </div>
                      <Textarea 
                          id="note" 
                          placeholder="Add a note about today's progress..." 
                          className="resize-none min-h-[80px]"
                          value={note !== "" ? note : savedNote}
                          onChange={(e) => setNote(e.target.value)}
                      />
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-3 pt-4 border-t">
                      <Label className="text-sm font-medium text-muted-foreground ml-1">Discussion</Label>
                      <div className="space-y-4">
                          {isLoadingComments ? (
                              <div className="flex justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                          ) : comments?.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
                          ) : (
                              comments?.map((comment: any) => (
                                  <div key={comment.id} className="flex gap-3 text-sm">
                                      <Avatar className="h-8 w-8 shrink-0">
                                          <AvatarImage src={comment.profiles?.avatar_url} />
                                          <AvatarFallback>{comment.profiles?.first_name?.[0] || 'U'}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 space-y-1">
                                          <div className="flex items-center justify-between">
                                              <span className="font-semibold text-xs">
                                                  {comment.profiles?.first_name} {comment.profiles?.last_name}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                              </span>
                                          </div>
                                          {editingCommentId === comment.id ? (
                                              <div className="flex flex-col gap-2">
                                                  <Textarea 
                                                      value={editContent} 
                                                      onChange={(e) => setEditContent(e.target.value)} 
                                                      className="text-xs min-h-[60px]"
                                                  />
                                                  
                                                  {/* List existing/current attachments */}
                                                  {(editAttachments.length > 0 || editNewFiles.length > 0) && (
                                                      <div className="grid grid-cols-4 gap-2">
                                                          {/* Existing attachments */}
                                                          {editAttachments.map((att: any, idx: number) => (
                                                              <div key={`existing-${idx}`} className="relative group/attachment border rounded-md overflow-hidden bg-background aspect-square">
                                                                  {att.type?.startsWith('image/') ? (
                                                                      <div className="w-full h-full">
                                                                          <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                                                      </div>
                                                                  ) : (
                                                                      <div className="w-full h-full flex items-center justify-center">
                                                                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                                                                      </div>
                                                                  )}
                                                                  <button
                                                                      onClick={() => setEditAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                                      className="absolute top-0 right-0 bg-black/50 hover:bg-destructive text-white p-0.5 rounded-bl-md opacity-0 group-hover/attachment:opacity-100 transition-opacity"
                                                                      title="Remove attachment"
                                                                  >
                                                                      <X className="h-3 w-3" />
                                                                  </button>
                                                              </div>
                                                          ))}
                                                          {/* New attachments pending upload */}
                                                          {editNewFiles.map((file, idx) => (
                                                              <div key={`new-${idx}`} className="relative group/attachment border rounded-md overflow-hidden bg-background aspect-square">
                                                                  {file.type?.startsWith('image/') ? (
                                                                      <div className="w-full h-full">
                                                                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                                                      </div>
                                                                  ) : (
                                                                      <div className="w-full h-full flex items-center justify-center">
                                                                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                                                                      </div>
                                                                  )}
                                                                  <button
                                                                      onClick={() => setEditNewFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                      className="absolute top-0 right-0 bg-black/50 hover:bg-destructive text-white p-0.5 rounded-bl-md opacity-0 group-hover/attachment:opacity-100 transition-opacity"
                                                                      title="Remove file"
                                                                  >
                                                                      <X className="h-3 w-3" />
                                                                  </button>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}

                                                  <div className="flex gap-2 justify-between items-center">
                                                      <div className="flex items-center">
                                                          <label 
                                                              htmlFor={`edit-file-input-${comment.id}`}
                                                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-muted-foreground hover:text-primary"
                                                              title="Attach file"
                                                          >
                                                              <Paperclip className="h-3.5 w-3.5" />
                                                          </label>
                                                          <input 
                                                              id={`edit-file-input-${comment.id}`}
                                                              type="file" 
                                                              className="hidden" 
                                                              multiple
                                                              onChange={(e) => {
                                                                  if (e.target.files && e.target.files.length > 0) {
                                                                      setEditNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                                                                  }
                                                                  // Reset value to allow re-selection
                                                                  e.target.value = '';
                                                              }} 
                                                          />
                                                      </div>
                                                      <div className="flex gap-2">
                                                          <Button size="sm" variant="outline" onClick={() => {
                                                              setEditingCommentId(null);
                                                              setEditNewFiles([]);
                                                              setEditAttachments([]);
                                                          }}>Cancel</Button>
                                                          <Button size="sm" onClick={() => updateCommentMutation.mutate({ 
                                                              id: comment.id, 
                                                              content: editContent,
                                                              newFiles: editNewFiles,
                                                              existingAttachments: editAttachments 
                                                          })}>Save</Button>
                                                      </div>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="p-2 bg-muted/50 rounded-lg text-xs break-words relative group">
                                                  {renderCommentContent(comment.content)}
                                                  {comment.attachments_jsonb && comment.attachments_jsonb.length > 0 && (
                                                      <div className="mt-2 pt-1 border-t border-border/50 flex flex-wrap gap-2">
                                                          {/* Viewing logic: Show all items to avoid confusion about missing uploads */}
                                                          {comment.attachments_jsonb.map((att: any, idx: number) => (
                                                              <div key={idx} className="w-[70px]">
                                                                  {att.type?.startsWith('image/') ? (
                                                                      <div className="aspect-square rounded-md overflow-hidden border border-border/50 bg-background hover:opacity-90 transition-opacity">
                                                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
                                                                              <img 
                                                                                src={att.url} 
                                                                                alt={att.name} 
                                                                                className="w-full h-full object-cover" 
                                                                                loading="lazy"
                                                                              />
                                                                          </a>
                                                                      </div>
                                                                  ) : (
                                                                      <div className="aspect-square rounded-md overflow-hidden border border-border/50 bg-muted/30 hover:opacity-90 transition-opacity">
                                                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-full p-2 text-center">
                                                                              {att.type === 'application/pdf' ? (
                                                                                  <FileText className="h-8 w-8 text-red-500 mb-1" />
                                                                              ) : (
                                                                                  <Paperclip className="h-8 w-8 text-muted-foreground mb-1" />
                                                                              )}
                                                                              <span className="text-[9px] text-muted-foreground w-full truncate px-1">
                                                                                  {att.name}
                                                                              </span>
                                                                          </a>
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                                  {user?.id === comment.user_id && (
                                                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <DropdownMenu>
                                                              <DropdownMenuTrigger asChild>
                                                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                      <MoreHorizontal className="h-3 w-3" />
                                                                  </Button>
                                                              </DropdownMenuTrigger>
                                                              <DropdownMenuContent align="end">
                                                                  <DropdownMenuItem onClick={() => {
                                                                      setEditingCommentId(comment.id);
                                                                      setEditContent(comment.content);
                                                                      setEditAttachments(comment.attachments_jsonb || []);
                                                                      setEditNewFiles([]);
                                                                  }}>
                                                                      <Pencil className="h-3 w-3 mr-2" /> Edit
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteCommentMutation.mutate(comment.id)}>
                                                                      <Trash2 className="h-3 w-3 mr-2" /> Delete
                                                                  </DropdownMenuItem>
                                                              </DropdownMenuContent>
                                                          </DropdownMenu>
                                                      </div>
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                      
                      <div className="flex gap-3 items-start mt-4">
                          <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={user?.user_metadata?.avatar_url} />
                              <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                              {commentFiles.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                      {commentFiles.map((file, index) => (
                                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs border max-w-full">
                                              <Paperclip className="h-3 w-3 text-primary shrink-0" />
                                              <span className="truncate max-w-[150px]">{file.name}</span>
                                              <button 
                                                  onClick={() => setCommentFiles(prev => prev.filter((_, i) => i !== index))} 
                                                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                              >
                                                  <X className="h-3.5 w-3.5" />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                              <div className="relative">
                                  <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
                                    <PopoverTrigger asChild>
                                        <div className="w-full">
                                            <Textarea
                                                ref={commentTextareaRef}
                                                placeholder="Write a comment... (Type @ to mention)"
                                                className="min-h-[80px] text-xs resize-none pr-20 pb-8"
                                                value={commentText}
                                                onChange={handleCommentChange}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                        className="p-0 w-[200px]" 
                                        align="start" 
                                        side="top"
                                        onOpenAutoFocus={(e) => e.preventDefault()}
                                        onCloseAutoFocus={(e) => e.preventDefault()}
                                    >
                                        <Command shouldFilter={false}>
                                            <div className="hidden">
                                                <CommandInput placeholder="Search people..." value={mentionQuery} onValueChange={setMentionQuery} />
                                            </div>
                                            <CommandList>
                                                <CommandEmpty>No person found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredProfiles?.map((profile) => (
                                                        <CommandItem
                                                            key={profile.id}
                                                            value={`${profile.first_name} ${profile.last_name} ${profile.email}`}
                                                            onSelect={() => insertMention(profile)}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            <Avatar className="h-6 w-6 mr-2">
                                                                <AvatarImage src={profile.avatar_url} />
                                                                <AvatarFallback>{profile.first_name?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{profile.first_name} {profile.last_name}</span>
                                                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{profile.email}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <div className="absolute bottom-2 right-2 flex gap-1">
                                      <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                                          onClick={() => commentFileInputRef.current?.click()}
                                          title="Attach file"
                                      >
                                          <Paperclip className="h-3.5 w-3.5" />
                                      </Button>
                                      <input 
                                          type="file" 
                                          ref={commentFileInputRef} 
                                          className="hidden" 
                                          multiple
                                          onChange={(e) => {
                                              if (e.target.files && e.target.files.length > 0) {
                                                  setCommentFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                                              }
                                              if (commentFileInputRef.current) {
                                                  commentFileInputRef.current.value = '';
                                              }
                                          }} 
                                      />
                                      <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-primary hover:bg-primary/10"
                                          disabled={(!commentText.trim() && commentFiles.length === 0) || addCommentMutation.isPending}
                                          onClick={handleSubmitComment}
                                          title="Send comment"
                                      >
                                          {addCommentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                      </Button>
                                  </div>
                              </div>
                          </div>
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