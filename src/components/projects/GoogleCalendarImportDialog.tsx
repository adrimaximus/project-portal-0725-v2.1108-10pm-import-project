import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { subDays, isEqual } from "date-fns";
import * as dateFnsTz from 'date-fns-tz';
import { Badge } from "@/components/ui/badge";
import { formatInJakarta } from "@/lib/utils";
import { Project } from "@/types";
import { toast } from "sonner";

interface GoogleCalendarImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (events: any[]) => void;
  isImporting: boolean;
}

export const GoogleCalendarImportDialog = ({ open, onOpenChange, onImport, isImporting }: GoogleCalendarImportDialogProps) => {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { data: events = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['googleCalendarEvents'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-google-calendar-events');
      if (error) throw error;
      return data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projectsForGCalImport'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (events.length > 0 && projects.length > 0) {
      const analyzeWithAI = async () => {
        setIsAiLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('ai-handler', {
            body: {
              feature: 'ai-select-calendar-events',
              payload: {
                events: events,
                existingProjects: projects.map(p => p.name),
              }
            }
          });
          if (error) throw error;
          setSelectedEvents(data.result.event_ids_to_import);
        } catch (err) {
          console.error("AI selection failed:", err);
          toast.error("AI analysis failed, falling back to manual selection.");
          setSelectedEvents([]);
        } finally {
          setIsAiLoading(false);
        }
      };
      analyzeWithAI();
    }
  }, [events, projects]);

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
    
    if (event.start?.date) {
      const startDate = new Date(start);
      const inclusiveEndDate = subDays(new Date(end), 1);
      const formatInUTC = (date: Date, formatStr: string) => dateFnsTz.format(dateFnsTz.toZonedTime(date, 'UTC'), formatStr, { timeZone: 'UTC' });
      if (isEqual(startDate, inclusiveEndDate)) return formatInUTC(startDate, "d MMM yyyy");
      return `${formatInUTC(startDate, "d MMM")} - ${formatInUTC(inclusiveEndDate, "d MMM yyyy")}`;
    }

    if (formatInJakarta(start, 'yyyy-MM-dd') === formatInJakarta(end, 'yyyy-MM-dd')) {
        return `${formatInJakarta(start, "d MMM yyyy, HH:mm")} - ${formatInJakarta(end, "HH:mm")}`;
    }
    
    return `${formatInJakarta(start, "d MMM, HH:mm")} - ${formatInJakarta(end, "d MMM, HH:mm")}`;
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
          {(isLoading || isAiLoading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">{isAiLoading ? "AI is analyzing your events..." : "Loading events..."}</p>
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
              <div className="flex items-center justify-between p-3 border-b bg-muted/50 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="select-all"
                    checked={allSelected || (someSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium leading-none cursor-pointer">
                    Select All ({selectedEvents.length} / {events.length})
                  </label>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>AI Suggested</span>
                </div>
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
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{formatEventDate(event)}</span>
                          {event.calendar?.summary && (
                            <>
                              <span className="mx-2">|</span>
                              <span className="truncate">{event.calendar.summary}</span>
                            </>
                          )}
                        </div>
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