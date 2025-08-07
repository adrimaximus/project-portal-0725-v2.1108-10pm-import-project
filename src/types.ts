export type Role = 'Admin' | 'Member' | 'Client' | 'Comment Only' | 'View Only';

export type Collaborator = {
  id: string;
  name: string;
  src: string;
  fallback: string;
  online: boolean;
};

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}