import { useState, useEffect } from 'react';
import { getGoogleCalendarEvents } from '@/lib/gcal';
import { GoogleCalendarEvent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';

const GoogleCalendarEventsView = () => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('gcal_access_token');
      if (!token) {
        setError('Tidak terhubung ke Google Calendar. Silakan hubungkan di pengaturan.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedEvents = await getGoogleCalendarEvents(token);
        setEvents(fetchedEvents);
        setError(null);
      } catch (e) {
        setError('Gagal mengambil acara. Koneksi Anda mungkin telah kedaluwarsa. Silakan coba hubungkan kembali di pengaturan.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-[120px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const formatEventDate = (event: GoogleCalendarEvent) => {
    const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
    const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);
    
    if (event.start.date) {
        const adjustedEnd = new Date(end.getTime() - 1);
        if (start.toDateString() === adjustedEnd.toDateString()) {
            return format(start, 'MMM d, yyyy');
        }
        return `${format(start, 'MMM d')} - ${format(adjustedEnd, 'MMM d, yyyy')}`;
    }

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
        return `${format(start, 'MMM d, yyyy')} · ${format(start, 'p')} - ${format(end, 'p')}`;
    }
    
    return `${format(start, 'MMM d, p')} - ${format(end, 'MMM d, p')}`;
  }

  return (
    <div>
      {events.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">Tidak ada acara mendatang</h3>
            <p className="mt-1 text-sm text-muted-foreground">Google Calendar Anda kosong untuk periode mendatang.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map(event => (
            <li key={event.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <p className="font-semibold">{event.summary}</p>
                        <p className="text-sm text-muted-foreground">{formatEventDate(event)}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                            Lihat di Google
                        </a>
                    </Button>
                </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoogleCalendarEventsView;