import { GoogleCalendarEvent } from "@/types";

export async function getGoogleCalendarEvents(token: string, calendarIds: string[]): Promise<GoogleCalendarEvent[]> {
  if (calendarIds.length === 0) {
    return [];
  }

  const timeMin = new Date().toISOString();

  const requests = calendarIds.map(calendarId => 
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  );

  const responses = await Promise.all(requests);

  for (const response of responses) {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("gcal_connected");
        localStorage.removeItem("gcal_access_token");
        localStorage.removeItem("gcal_clientId");
      }
      throw new Error('Gagal mengambil acara Google Calendar');
    }
  }

  const allEventData = await Promise.all(responses.map(res => res.json()));
  const allItems = allEventData.flatMap(data => data.items || []);

  const formattedEvents: GoogleCalendarEvent[] = allItems.map((item: any) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    start: { dateTime: item.start.dateTime, date: item.start.date },
    end: { dateTime: item.end.dateTime, date: item.end.date },
    isGoogleEvent: true,
    htmlLink: item.htmlLink,
    calendarId: item.calendarId,
  }));

  return formattedEvents.sort((a, b) => 
    new Date(a.start.dateTime || a.start.date!).getTime() - new Date(b.start.dateTime || b.start.date!).getTime()
  );
}