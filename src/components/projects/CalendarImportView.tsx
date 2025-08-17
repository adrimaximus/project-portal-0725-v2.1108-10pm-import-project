import CalendarEventsList from "@/components/CalendarEventsList";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string; };
  end: { dateTime?: string; date?: string; };
  htmlLink: string;
}

interface CalendarImportViewProps {
  events: CalendarEvent[];
  onImportEvent: (event: CalendarEvent) => void;
}

const CalendarImportView = ({ events, onImportEvent }: CalendarImportViewProps) => {
  return <CalendarEventsList events={events} onImportEvent={onImportEvent} />;
};

export default CalendarImportView;