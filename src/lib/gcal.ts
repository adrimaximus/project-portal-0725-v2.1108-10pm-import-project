import { GoogleCalendarEvent } from "@/types";

export async function getGoogleCalendarEvents(token: string): Promise<GoogleCalendarEvent[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=' + (new Date()).toISOString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token tidak valid atau kedaluwarsa, hapus data koneksi yang basi
      localStorage.removeItem("gcal_connected");
      localStorage.removeItem("gcal_access_token");
      localStorage.removeItem("gcal_clientId");
    }
    throw new Error('Gagal mengambil acara Google Calendar');
  }

  const data = await response.json();
  return data.items as GoogleCalendarEvent[];
}