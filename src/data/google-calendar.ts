import { User } from '@/types';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: { email: string; responseStatus: string }[];
  creator: { email: string };
  isGoogleEvent: true;
}

// Mockup data, seolah-olah diambil dari Google Calendar API
export const dummyGcalEvents: GoogleCalendarEvent[] = [
  {
    id: 'gcal-1',
    summary: 'Q3 Planning Session',
    description: 'Strategic planning for the upcoming quarter.',
    start: {
      dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      timeZone: 'Asia/Jakarta',
    },
    creator: { email: 'manager@7inked.com' },
    attendees: [
      { email: 'alice@example.com', responseStatus: 'accepted' },
      { email: 'bob@example.com', responseStatus: 'accepted' },
    ],
    isGoogleEvent: true,
  },
  {
    id: 'gcal-2',
    summary: 'Client Follow-up: Acme Corp',
    start: {
      dateTime: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString(),
      timeZone: 'Asia/Jakarta',
    },
    creator: { email: 'diana@example.com' },
    attendees: [
      { email: 'diana@example.com', responseStatus: 'accepted' },
    ],
    isGoogleEvent: true,
  },
];