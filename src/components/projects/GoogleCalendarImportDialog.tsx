import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";
import { Project } from "@/types";
import { formatInJakarta } from "@/lib/utils";
import { Separator } from "../ui/separator";

interface CalendarEvent {
  id: string;
  summary: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  calendar?: { id: string; summary: string };
}

interface GoogleCalendarImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (events: any[]) => void;
  isImporting: boolean;
}

export const GoogleCalendarImportDialog = ({ open, onOpenChange, onImport, isImporting }: GoogleCalendarImportDialogProps) => {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: isLoadingEvents, error } = useQuery<CalendarEvent[]>({
    queryKey: ['googleCalendarEvents'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-google-calendar-events');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<{ origin_event_id: string | null }[]>({
    queryKey: ['projectsForGCalImport'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('origin_event_id');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Ensure we check for latest projects from other admins when opening the dialog
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ['projectsForGCalImport'] });
      setSelectedEvents([]);
    }
  }, [open, queryClient]);

  const isOverallLoading = isLoadingEvents || isLoadingProjects;

  const filteredEvents = useMemo(() => {
    if (isOverallLoading || events.length === 0) return [];
    const existingEventIds = new Set(projects.map(p => p.origin_event_id).filter(Boolean));
    return events.filter(event => event.id && !existingEventIds.has(event.id));
  }, [events, projects, isOverallLoading]);

  const groupedEvents = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return [];
    
    const groups = filteredEvents.reduce((acc: Record<string, CalendarEvent[]>, event) => {
      const dateVal = event.start?.date || event.start?.dateTime;
      if (!dateVal) {
        console.warn("Skipping event with no start date:", event);
        return acc;
      }
      const dateStr = dateVal.substring(0, 10);
      
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(event);
      } else {
        console.warn("Skipping event with invalid date string:", dateStr, event);
      }

      return acc;
    }, {});

    return Object.entries(groups).sort(([dateA], [dateB]) => {
        return dateA.localeCompare(dateB);
    });
  }, [filteredEvents]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedEvents(filteredEvents.map(e => e.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handleImport = () => {
    const eventsToImport = filteredEvents.filter(e => selectedEvents.includes(e.id));
    onImport(eventsToImport);
  };

  const formatEventTime = (event: any) => {
    try {
      const start = event.start;
      const end = event.end;

      if (start?.dateTime) { // It's a timed event
          const startTime = formatInJakarta(start.dateTime, 'HH:mm');
          if (end?.dateTime) {
              const endTime = formatInJakarta(end.dateTime, 'HH:mm');
              if (startTime === endTime) {
                return startTime;
              }
              return `${startTime} - ${endTime}`;
          }
          return startTime;
      }
      
      if (start?.date) { // It's an all-day event
        return "All-day";
      }

      return "Time not specified"; // Fallback
    } catch (e) {
      console.error("Error formatting event time:", e, event);
      return "Invalid time";
    }
  };

  const allSelected = filteredEvents.length > 0 && selectedEvents.length === filteredEvents.length;
  const someSelected = selectedEvents.length > 0 && !allSelected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Import Events from Google Calendar</DialogTitle>
          <DialogDescription>Select the events you want to import as new projects. Events already imported will not be shown.</DialogDescription>
        </DialogHeader>
        <div className="relative h-96">
          {isOverallLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading events...</p>
            </div>
          )}
          {error && (
            <div className="text-destructive text-center p-4">{error.message}</div>
          )}
          {!isOverallLoading && !error && filteredEvents.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">No upcoming events found to import.</div>
          )}
          {!isOverallLoading && !error && filteredEvents.length > 0 && (
            <div className="h-full flex flex-col border rounded-md">
              <div className="flex items-center justify-between p-3 border-b bg-muted/50 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="select-all"
                    checked={allSelected || (someSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium leading-none cursor-pointer">
                    Select All ({selectedEvents.length} / {filteredEvents.length})
                  </label>
                </div>
              </div>
              <ScrollArea className="flex-grow">
                <div className="p-4 space-y-4">
                  {groupedEvents.map(([dateStr, eventsOnDay], index) => {
                    const displayDate = new Date(`${dateStr}T00:00:00`);
                    return (
                      <div key={dateStr}>
                        {index > 0 && <Separator className="my-4" />}
                        <h3 className="font-semibold text-sm mb-2 px-2 text-muted-foreground">
                          {format(displayDate, 'EEEE, MMMM d')}
                        </h3>
                        <div className="space-y-1">
                          {eventsOnDay.map(event => (
                            <div key={event.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                              <Checkbox
                                id={event.id}
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={() => handleSelectEvent(event.id)}
                              />
                              <label htmlFor={event.id} className="flex-grow cursor-pointer">
                                <p className="font-medium">{event.summary || "No Title"}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span>{formatEventTime(event)}</span>
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
                      </div>
                    );
                  })}
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