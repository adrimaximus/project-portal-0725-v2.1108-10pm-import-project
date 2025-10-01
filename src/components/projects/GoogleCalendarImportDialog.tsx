import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface GoogleCalendarImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (events: any[]) => void;
  isImporting: boolean;
}

export const GoogleCalendarImportDialog = ({ open, onOpenChange, onImport, isImporting }: GoogleCalendarImportDialogProps) => {
  const { data: events = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['googleCalendarEvents'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-google-calendar-events');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedEvents([]);
    }
  }, [open]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedEvents(events.map(e => e.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handleImport = () => {
    const eventsToImport = events.filter(e => selectedEvents.includes(e.id));
    onImport(eventsToImport);
  };

  const formatEventDate = (event: any) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    if (!start) return "Date not specified";
    
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (event.start?.date) { // All-day event
        if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
            return format(startDate, "d MMM yyyy");
        }
        return `${format(startDate, "d MMM")} - ${format(endDate, "d MMM yyyy")}`;
    }

    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        return `${format(startDate, "d MMM yyyy, HH:mm")} - ${format(endDate, "HH:mm")}`;
    }
    
    return `${format(startDate, "d MMM, HH:mm")} - ${format(endDate, "d MMM, HH:mm")}`;
  };

  const allSelected = events.length > 0 && selectedEvents.length === events.length;
  const someSelected = selectedEvents.length > 0 && !allSelected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Import Events from Google Calendar</DialogTitle>
          <DialogDescription>Select the events you want to import as new projects. Events already imported will not be shown.</DialogDescription>
        </DialogHeader>
        <div className="relative h-96">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-destructive text-center p-4">{error.message}</div>
          )}
          {!isLoading && !error && events.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">No upcoming events found to import.</div>
          )}
          {!isLoading && !error && events.length > 0 && (
            <div className="h-full flex flex-col border rounded-md">
              <div className="flex items-center space-x-3 p-3 border-b bg-muted/50 flex-shrink-0">
                <Checkbox
                  id="select-all"
                  checked={allSelected || (someSelected ? 'indeterminate' : false)}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium leading-none cursor-pointer">
                  Select All ({selectedEvents.length} / {events.length})
                </label>
              </div>
              <ScrollArea className="flex-grow">
                <div className="p-4 space-y-2">
                  {events.map(event => (
                    <div key={event.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => handleSelectEvent(event.id)}
                      />
                      <label htmlFor={event.id} className="flex-grow cursor-pointer">
                        <p className="font-medium">{event.summary || "No Title"}</p>
                        <p className="text-sm text-muted-foreground">{formatEventDate(event)}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={selectedEvents.length === 0 || isImporting}>
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {selectedEvents.length > 0 ? `${selectedEvents.length} Event(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};