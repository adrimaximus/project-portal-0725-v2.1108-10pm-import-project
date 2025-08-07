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
  console.log("Fetching synced calendars");
  // This is still mock data, returns one calendar as synced by default.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [{ google_calendar_id: "primary" }];
};

export const syncGoogleCalendars = async (
  calendarIds: string[]
): Promise<void> => {
  console.log("Syncing calendar IDs:", calendarIds);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log("Sync complete!");
};