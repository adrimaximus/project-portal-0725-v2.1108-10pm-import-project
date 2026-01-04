import { Goal, GoalCompletion } from '@/types';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatValue } from '@/lib/formatting';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, FileText, MoreHorizontal, Pencil, Trash2, Upload, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GoalLogTableProps {
  logs: GoalCompletion[];
  unit?: string;
  goalType: Goal['type'];
  goalOwnerId?: string;
}

const GoalLogTable = ({ logs, unit, goalType, goalOwnerId }: GoalLogTableProps) => {
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [selectedLog, setSelectedLog] = useState<GoalCompletion | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

      // Update local state to reflect change immediately in the modal
      setSelectedLog(prev => prev ? {
        ...prev,
        attachment_url: publicUrl,
        attachment_name: file.name,
        attachment_type: file.type
      } : null);

      queryClient.invalidateQueries({ queryKey: ['goal'] });
      toast.success("File uploaded successfully", { id: toastId });

    } catch (error) {
      console.error('Error updating file:', error);
      toast.error('Failed to update file', { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        
        // Update local selected log so UI reflects saved state if we don't close
        setSelectedLog(prev => prev ? { ...prev, notes: note } : null);
        
    } catch (error: any) {
        toast.error("Failed to save note", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const selectedAchiever = selectedLog?.userId ? userMap.get(selectedLog.userId) : null;
  const selectedAttachmentUrl = (selectedLog as any)?.attachment_url;
  const selectedAttachmentName = (selectedLog as any)?.attachment_name || 'Attachment';
  const selectedAttachmentType = (selectedLog as any)?.attachment_type || getFileType(selectedAttachmentName);

  const isLogOwner = currentUserId && selectedLog?.userId === currentUserId;
  const isGoalOwner = currentUserId && goalOwnerId === currentUserId;
  
  // Permissions logic:
  // - Edit: Only the log owner can edit their upload file or note.
  // - Delete: Goal owner can delete any log. Log owner can delete their own log.
  const canEdit = isLogOwner;
  const canDelete = isGoalOwner || isLogOwner;

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No logs yet.</p>;
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      <div className="border rounded-md mt-4">
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
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="w-full h-[80dvh] max-w-full rounded-none border-0 p-0 flex flex-col sm:h-[70vh] sm:max-w-lg sm:rounded-lg sm:border shadow-xl [&>button]:hidden">
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
                      {canEdit && (
                        <DropdownMenuItem onClick={handleEditUpload}>
                          <Upload className="mr-2 h-4 w-4" />
                          Edit upload file
                        </DropdownMenuItem>
                      )}
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
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-5 grid gap-5 flex-shrink-0 bg-background">
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
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="log-note" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Note</Label>
                    {canEdit && note !== ((selectedLog as any)?.notes || '') && (
                         <span className="text-[10px] text-amber-600 font-medium animate-pulse">Unsaved changes</span>
                    )}
                </div>
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
            </div>

            <div className="flex-1 bg-muted/20 relative overflow-hidden flex flex-col border-t border-border/50">
               {selectedAttachmentUrl ? (
                 <div className="flex-1 w-full h-full p-4 flex items-center justify-center bg-muted/10">
                   {selectedAttachmentType === 'application/pdf' ? (
                       <iframe 
                          src={`${selectedAttachmentUrl}#view=FitH`} 
                          title={selectedAttachmentName}
                          className="w-full h-full border rounded-md shadow-sm bg-white" 
                       />
                   ) : (
                       <img 
                          src={selectedAttachmentUrl} 
                          alt={selectedAttachmentName} 
                          className="max-w-full max-h-full object-contain rounded-md shadow-sm" 
                       />
                   )}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                   <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                     <FileText className="h-8 w-8 opacity-40" />
                   </div>
                   <span className="text-sm font-medium">No attachment available</span>
                   {canEdit && (
                     <Button variant="outline" size="sm" onClick={handleEditUpload}>
                       <Upload className="mr-2 h-4 w-4" /> Upload File
                     </Button>
                   )}
                 </div>
               )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-between gap-3 flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div>
                 {canEdit && (
                    <Button 
                        size="sm" 
                        onClick={handleSaveNote} 
                        disabled={isSaving || note === ((selectedLog as any)?.notes || '')}
                        variant={note !== ((selectedLog as any)?.notes || '') ? "default" : "secondary"}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Note
                    </Button>
                 )}
            </div>
            <div className="flex gap-2">
                {selectedAttachmentUrl && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(selectedAttachmentUrl, '_blank')}>
                    <Eye className="h-4 w-4" />
                    Open Original
                </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoalLogTable;