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
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type?: string } | null>(null);

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

  const handlePreview = (url: string, name: string) => {
    // Determine type based on extension if not provided
    const extension = name.split('.').pop()?.toLowerCase();
    const type = extension === 'pdf' ? 'application/pdf' : 
                 ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '') ? 'image/' + extension : 'unknown';
    
    setPreviewFile({ url, name, type });
  };

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
              // Assuming log has attachment properties, casting to any if type definition isn't updated yet
              const attachmentUrl = (log as any).attachment_url;
              const attachmentName = (log as any).attachment_name || 'Attachment';

              return (
                <TableRow key={index}>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-2 text-primary"
                        onClick={() => handlePreview(attachmentUrl, attachmentName)}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">View</span>
                      </Button>
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

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="w-full h-[100dvh] max-w-full rounded-none border-0 p-0 flex flex-col sm:h-[80vh] sm:max-w-4xl sm:rounded-lg sm:border">
          <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0 bg-background">
            <DialogTitle className="truncate pr-4 text-base">{previewFile?.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center p-4">
             {previewFile?.type === 'application/pdf' ? (
                 <iframe 
                    src={`${previewFile.url}#view=FitH`} 
                    title={previewFile.name}
                    className="w-full h-full border-none rounded-md" 
                 />
             ) : (
                 <img 
                    src={previewFile?.url} 
                    alt={previewFile?.name} 
                    className="max-w-full max-h-full object-contain rounded-md shadow-sm" 
                 />
             )}
          </div>
          <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0 bg-background">
            <Button variant="outline" onClick={() => window.open(previewFile?.url, '_blank')}>
                Open Original
            </Button>
            <Button onClick={() => setPreviewFile(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoalLogTable;