export interface Collaborator {
  id: string;
  name: string;
  src: string;
  fallback: string;
  online: boolean;
  email?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
    date?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
    date?: string;
  };
  creator?: {
    email: string;
  };
  attendees?: {
    email: string;
    responseStatus: string;
    self?: boolean;
  }[];
  isGoogleEvent: true;
  htmlLink: string;
  calendarId: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
}