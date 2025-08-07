interface Calendar {
  id: string;
  summary: string;
}

export const getGoogleCalendarList = async (
  token: string
): Promise<Calendar[]> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Calendar API error:", errorData);
      throw new Error(`Google API responded with ${response.status}`);
    }

    const data = await response.json();
    return data.items.map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
    }));
  } catch (error) {
    console.error("Failed to fetch Google Calendar list:", error);
    throw error;
  }
};

export const getSyncedCalendars = async (): Promise<
  { google_calendar_id: string }[]
> => {
  try {
    const storedIds = localStorage.getItem('gcal_calendar_ids');
    if (storedIds) {
      const ids = JSON.parse(storedIds);
      if (Array.isArray(ids)) {
        return ids.map(id => ({ google_calendar_id: id }));
      }
    }
  } catch (error) {
    console.error("Failed to parse synced calendars from localStorage", error);
  }
  return [];
};

export const syncGoogleCalendars = async (
  calendarIds: string[]
): Promise<void> => {
  try {
    localStorage.setItem('gcal_calendar_ids', JSON.stringify(calendarIds));
  } catch (error) {
    console.error("Failed to save synced calendars to localStorage", error);
    throw new Error("Could not save calendar selection.");
  }
};