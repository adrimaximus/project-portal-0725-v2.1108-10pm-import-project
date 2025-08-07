interface Calendar {
  id: string;
  summary: string;
}

export const getGoogleCalendarList = async (
  token: string
): Promise<Calendar[]> => {
  console.log("Fetching Google Calendar list with token:", token);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    { id: "primary", summary: "Primary Calendar" },
    { id: "work_calendar", summary: "Work" },
    { id: "personal_calendar", summary: "Personal" },
  ];
};

export const getSyncedCalendars = async (): Promise<
  { google_calendar_id: string }[]
> => {
  console.log("Fetching synced calendars");
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