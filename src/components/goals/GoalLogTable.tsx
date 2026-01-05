import { Goal, GoalCompletion } from '@/types';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, getYear, parseISO, formatDistanceToNow } from 'date-fns';
import { formatValue } from '@/lib/formatting';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generatePastelColor, getAvatarUrl, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, FileText, MoreHorizontal, Pencil, Trash2, Upload, Save, Loader2, Send, Paperclip, X, MessageSquare, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface GoalLogTableProps {
  logs: GoalCompletion[];
  unit?: string;
  goalType: Goal['type'];
  goalOwnerId?: string;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

const GoalLogTable = ({ logs, unit, goalType, goalOwnerId, selectedYear: propYear, onYearChange }: GoalLogTableProps) => {
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [selectedLog, setSelectedLog] = useState<GoalCompletion | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const currentYear = getYear(new Date());
  const [internalYear, setInternalYear] = useState(currentYear.toString());
  
  const selectedYear = propYear || internalYear;
  const setSelectedYear = onYearChange || setInternalYear;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Comment State
  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

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
            avatar_url: profile.avatar_url,
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

  useEffect(() => {
    if (selectedLog) {
        setNote((selectedLog as any).notes || "");
    }
  }, [selectedLog]);

  // Determine type based on extension if not provided
  const getFileType = (name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();
    return extension === 'pdf' ? 'application/pdf' : 
           ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '') ? 'image/' + extension : 'unknown';
  };

  const handleDeleteLog = async () => {
    if (!selectedLog) return;
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    try {
      const { error } = await supabase.from('goal_completions').delete().eq('id', selectedLog.id);
      if (error) throw error;
      
      toast.success("Log deleted successfully");
      setSelectedLog(null);
      queryClient.invalidateQueries({ queryKey: ['goal'] });
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    }
  };

  const handleEditUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLog) return;

    const toastId = toast.loading("Uploading file...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('goal_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('goal_attachments')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('goal_completions')
        .update({
          attachment_url: publicUrl,
          attachment_name: file.name,
          attachment_type: file.type
        })
        .eq('id', selectedLog.id);

      if (updateError) throw updateError;

      setSelectedLog(prev => prev ? {
        ...prev,
        attachment_url: publicUrl,
        attachment_name: file.name,
        attachment_type: file.type
      } as any : null);

      queryClient.invalidateQueries({ queryKey: ['goal'] });
      toast.success("File uploaded successfully", { id: toastId });

    } catch (error) {
      console.error('Error updating file:', error);
      toast.error('Failed to update file', { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async () => {
    if (!selectedLog) return;
    if (!window.confirm('Are you sure you want to remove this attachment?')) return;

    const toastId = toast.loading("Removing file...");

    try {
      const { error } = await supabase
        .from('goal_completions')
        .update({
          attachment_url: null,
          attachment_name: null,
          attachment_type: null
        })
        .eq('id', selectedLog.id);

      if (error) throw error;

      setSelectedLog(prev => prev ? {
        ...prev,
        attachment_url: null,
        attachment_name: null,
        attachment_type: null
      } as any : null);

      queryClient.invalidateQueries({ queryKey: ['goal'] });
      toast.success("File removed successfully", { id: toastId });

    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file', { id: toastId });
    }
  };

  const handleDownload = async () => {
    const attachmentUrl = (selectedLog as any)?.attachment_url;
    const attachmentName = (selectedLog as any)?.attachment_name;
    
    if (!attachmentUrl) return;
    
    try {
        const response = await fetch(attachmentUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachmentName || 'attachment';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
    } catch (error) {
        console.error('Download error:', error);
        window.open(attachmentUrl, '_blank');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedLog) return;
    setIsSaving(true);
    try {
        const { error } = await supabase
            .from('goal_completions')
            .update({ notes: note })
            .eq('id', selectedLog.id);

        if (error) throw error;

        toast.success("Note updated successfully");
        queryClient.invalidateQueries({ queryKey: ['goal'] });
        
        setSelectedLog(null); // Close modal on save
        
    } catch (error: any) {
        toast.error("Failed to save note", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  // --- DISCUSSION LOGIC ---

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['goal_log_comments', selectedLog?.id],
    queryFn: async () => {
      if (!selectedLog) return [];
      // Use date-based filtering to link comments to this specific log date/entry
      // Assuming goal_comments has comment_date which matches goal_completions date
      const dateStr = format(parseISO(selectedLog.date), 'yyyy-MM-dd');
      
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
        .eq('goal_id', selectedLog.goal_id)
        .eq('comment_date', dateStr)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLog
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles_for_log_mention', selectedLog?.goal_id],
    queryFn: async () => {
      if (!selectedLog?.goal_id) return [];

      // 1. Fetch collaborators
      const { data: collaborators, error: collabError } = await supabase
        .from('goal_collaborators')
        .select('user_id')
        .eq('goal_id', selectedLog.goal_id);
      
      if (collabError) throw collabError;

      const userIds = new Set((collaborators || []).map(c => c.user_id));

      // 2. Add owner
      if (goalOwnerId) {
        userIds.add(goalOwnerId);
      } else {
        // Fetch if not provided prop
        const { data: goal, error: goalError } = await supabase
            .from('goals')
            .select('user_id')
            .eq('id', selectedLog.goal_id)
            .single();
        
        if (!goalError && goal) {
            userIds.add(goal.user_id);
        }
      }

      if (userIds.size === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds))
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLog,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string, files: File[] }) => {
      if (!selectedLog || !user) throw new Error("No log selected or user not logged in");
      const dateStr = format(parseISO(selectedLog.date), 'yyyy-MM-dd');
      
      let attachments: any[] = [];

      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
            const fileName = `${selectedLog.goal_id}/${Date.now()}-${file.name.replace(/[^\x00-\x7F]/g, "")}`;
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
                size: file.size,
                storagePath: fileName
            };
        });

        attachments = await Promise.all(uploadPromises);
      }

      let finalContent = content;
      Object.entries(mentionMap).forEach(([name, uuid]) => {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        finalContent = finalContent.replace(new RegExp(escapedName, 'g'), `@[${name.substring(1)}]( ${uuid})`);
      });

      const { error } = await supabase
        .from('goal_comments')
        .insert({
          goal_id: selectedLog.goal_id,
          user_id: user.id,
          comment_date: dateStr,
          content: finalContent,
          attachments_jsonb: attachments
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal_log_comments', selectedLog?.id] });
      setCommentText("");
      setCommentFiles([]);
      setMentionMap({});
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    }
  });

  const handleSubmitComment = () => {
    if (commentText.trim() || commentFiles.length > 0) {
      addCommentMutation.mutate({ content: commentText, files: commentFiles });
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const newCursorPos = e.target.selectionStart;
    setCommentText(text);
    setCursorPos(newCursorPos);

    const textBeforeCursor = text.slice(0, newCursorPos);
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
    const friendlyName = `@${profile.first_name || 'User'}`;
    setMentionMap(prev => ({ ...prev, [friendlyName]: profile.id }));
    const newTextBefore = textBeforeCursor.replace(/@([^@\n]*)$/, `${friendlyName} `);
    const newText = newTextBefore + textAfterCursor;
    setCommentText(newText);
    setMentionOpen(false);
    setTimeout(() => {
        if (commentTextareaRef.current) {
            commentTextareaRef.current.focus();
            const newPos = newTextBefore.length;
            commentTextareaRef.current.setSelectionRange(newPos, newPos);
        }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && e.key === 'Enter') {
        e.preventDefault();
        const filtered = profiles?.filter(p => {
            const q = mentionQuery.toLowerCase();
            return (p.first_name + ' ' + p.last_name).toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
        });
        if (filtered && filtered.length > 0) {
            insertMention(filtered[0]);
        }
    }
  };

  const filteredProfiles = profiles?.filter(p => {
    if (!mentionQuery) return true;
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const email = (p.email || '').toLowerCase();
    const query = mentionQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const renderCommentContent = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\s*\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
      parts.push(<span key={match.index} className="font-medium text-primary hover:underline cursor-pointer">@{match[1]}</span>);
      lastIndex = mentionRegex.lastIndex;
    }
    if (lastIndex < content.length) parts.push(content.slice(lastIndex));
    return parts.length > 0 ? parts : content;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- END DISCUSSION LOGIC ---

  // Derive years for selector
  const years = useMemo(() => {
    const dataYears = logs.map(log => getYear(parseISO(log.date)));
    const uniqueYears = Array.from(new Set([currentYear, ...dataYears])).sort((a, b) => b - a);
    return uniqueYears.map(String);
  }, [logs, currentYear]);

  // Filter logs by selected year
  const filteredLogs = useMemo(() => {
    return logs.filter(log => getYear(parseISO(log.date)).toString() === selectedYear);
  }, [logs, selectedYear]);

  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedAchiever = selectedLog?.userId ? userMap.get(selectedLog.userId) : null;
  const selectedAttachmentUrl = (selectedLog as any)?.attachment_url;
  const selectedAttachmentName = (selectedLog as any)?.attachment_name || 'Attachment';
  const selectedAttachmentType = (selectedLog as any)?.attachment_type || getFileType(selectedAttachmentName);

  const isLogOwner = currentUserId && selectedLog?.userId === currentUserId;
  const isGoalOwner = currentUserId && goalOwnerId === currentUserId;
  
  const canEdit = isLogOwner;
  const canDelete = isGoalOwner || isLogOwner;

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      <div className="flex items-center justify-end mt-4 mb-2">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        {sortedLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Achiever</TableHead>
                <TableHead>Report</TableHead>
                <TableHead className="text-right">
                  {goalType === 'quantity' ? 'Quantity' : 'Value'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.map((log, index) => {
                const achiever = log.userId ? userMap.get(log.userId) : null;
                const attachmentUrl = (log as any).attachment_url;
                const hasNote = !!(log as any).notes;

                return (
                  <TableRow 
                    key={index} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(log.date), 'MMM dd, yyyy, hh:mm a')}
                    </TableCell>
                    <TableCell>
                      {achiever ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getAvatarUrl(achiever.avatar_url, achiever.id)} />
                            <AvatarFallback style={generatePastelColor(achiever.id)}>{achiever.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{achiever.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                          {attachmentUrl && <FileText className="h-4 w-4 text-primary" />}
                          {hasNote && <MoreHorizontal className="h-4 w-4 text-muted-foreground" />}
                          {!attachmentUrl && !hasNote && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatValue(log.value, unit)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No logs recorded in {selectedYear}.
          </div>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="w-full h-[90dvh] max-w-full rounded-none border-0 p-0 flex flex-col sm:h-[85vh] sm:max-w-lg sm:rounded-lg sm:border shadow-xl [&>button]:hidden">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold tracking-tight">Goal Log Details</DialogTitle>
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {selectedLog && format(new Date(selectedLog.date), 'MMM dd, yyyy • hh:mm a')}
                </div>
                {(canEdit || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canDelete && (
                        <DropdownMenuItem onClick={handleDeleteLog} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete goal log
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <DialogDescription className="sr-only">
                View or edit details for this goal log entry.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Status Card (Achiever & Value) */}
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Achiever</span>
                        {selectedAchiever ? (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border-2 border-background ring-1 ring-border/50">
                            <AvatarImage src={getAvatarUrl(selectedAchiever.avatar_url, selectedAchiever.id)} />
                            <AvatarFallback className="text-xs font-medium" style={generatePastelColor(selectedAchiever.id)}>{selectedAchiever.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold">{selectedAchiever.name}</span>
                        </div>
                        ) : (
                        <span className="text-sm text-muted-foreground italic">Unknown User</span>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">{goalType === 'quantity' ? 'Quantity' : 'Value'}</span>
                        <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight text-primary">{selectedLog && formatValue(selectedLog.value, '')}</span>
                        {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
                        </div>
                    </div>
                </div>

                {/* 2. Evidence / Report Section */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-muted-foreground ml-1">Evidence / Report</Label>
                      {canEdit && !selectedAttachmentUrl && (
                         <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleEditUpload}>
                            <Upload className="mr-1 h-3 w-3" /> Upload
                         </Button>
                      )}
                   </div>
                   
                   {selectedAttachmentUrl ? (
                      <div className="group relative flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/5 hover:border-primary/20 transition-all duration-200">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              {selectedAttachmentType === 'application/pdf' ? <FileText className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0 grid gap-0.5">
                              <p className="text-sm font-medium text-foreground break-all cursor-pointer hover:underline" onClick={() => window.open(selectedAttachmentUrl, '_blank')}>{selectedAttachmentName}</p>
                              <p className="text-xs text-muted-foreground">Attached evidence</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => window.open(selectedAttachmentUrl, '_blank')}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                  </DropdownMenuItem>
                                  {canEdit && (
                                    <>
                                      <DropdownMenuItem onClick={handleEditUpload}>
                                        <Upload className="mr-2 h-4 w-4" /> Replace
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={handleDeleteAttachment} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl border-muted-foreground/10 bg-muted/5">
                          <FileText className="h-8 w-8 text-muted-foreground/30" />
                          <span className="text-sm text-muted-foreground">No evidence attached</span>
                      </div>
                   )}
                </div>

                {/* 3. Note Section */}
                <div className="space-y-3">
                   <Label htmlFor="log-note" className="text-sm font-medium text-muted-foreground ml-1">Note (Optional)</Label>
                   {canEdit ? (
                      <Textarea 
                          id="log-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add a note..."
                          className="resize-none min-h-[80px] text-sm"
                      />
                   ) : (
                      <div className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/50 leading-relaxed min-h-[60px]">
                          {note || <span className="text-muted-foreground italic">No note provided.</span>}
                      </div>
                   )}
                </div>

                {/* 4. Discussion Section */}
                <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-medium text-muted-foreground ml-1">Discussion</Label>
                    <div className="space-y-4">
                        {isLoadingComments ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : comments?.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">No comments yet.</p>
                            </div>
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
                                        <div className="p-2 bg-muted/50 rounded-lg text-xs break-words">
                                            {renderCommentContent(comment.content)}
                                            {comment.attachments_jsonb && comment.attachments_jsonb.length > 0 && (
                                                <div className="mt-2 pt-1 border-t border-border/50 flex flex-wrap gap-2">
                                                    {comment.attachments_jsonb.map((att: any, idx: number) => (
                                                        <a 
                                                            key={idx}
                                                            href={att.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 bg-background border px-2 py-1 rounded text-[10px] hover:text-primary transition-colors"
                                                        >
                                                            <Paperclip className="h-3 w-3" />
                                                            <span className="truncate max-w-[100px]">{att.name}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {/* Comment Input */}
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
          </div>

          <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
             <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
             {canEdit && (
                <Button 
                    size="sm" 
                    onClick={handleSaveNote} 
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                </Button>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoalLogTable;