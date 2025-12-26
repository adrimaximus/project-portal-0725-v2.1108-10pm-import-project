import { Goal, GoalCompletion } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatValue } from '@/lib/formatting';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GoalLogTableProps {
  logs: GoalCompletion[];
  unit?: string;
  goalType: Goal['type'];
}

const GoalLogTable = ({ logs, unit, goalType }: GoalLogTableProps) => {
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [selectedLog, setSelectedLog] = useState<GoalCompletion | null>(null);

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

  // Determine type based on extension if not provided
  const getFileType = (name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();
    return extension === 'pdf' ? 'application/pdf' : 
           ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '') ? 'image/' + extension : 'unknown';
  };

  const selectedAchiever = selectedLog?.userId ? userMap.get(selectedLog.userId) : null;
  const selectedAttachmentUrl = (selectedLog as any)?.attachment_url;
  const selectedAttachmentName = (selectedLog as any)?.attachment_name || 'Attachment';
  const selectedAttachmentType = (selectedLog as any)?.attachment_type || getFileType(selectedAttachmentName);

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No logs yet.</p>;
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
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
                    {attachmentUrl ? (
                      <div className="flex items-center gap-2 text-primary">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">View</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
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

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="w-full h-[80dvh] max-w-full rounded-none border-0 p-0 flex flex-col sm:h-[70vh] sm:max-w-lg sm:rounded-lg sm:border shadow-xl">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold tracking-tight">Goal Log Details</DialogTitle>
              <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {selectedLog && format(new Date(selectedLog.date), 'MMM dd, yyyy • hh:mm a')}
              </div>
            </div>
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
              
              {selectedLog?.notes && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</span>
                  <div className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/50 leading-relaxed">
                    {selectedLog.notes}
                  </div>
                </div>
              )}
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
                 </div>
               )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-end gap-3 flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {selectedAttachmentUrl && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(selectedAttachmentUrl, '_blank')}>
                  <Eye className="h-4 w-4" />
                  Open Original
              </Button>
            )}
            <Button size="sm" onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoalLogTable;