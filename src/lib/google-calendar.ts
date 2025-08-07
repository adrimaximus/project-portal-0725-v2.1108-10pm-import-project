import { supabase } from "../supabaseClient";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("No user session found");
    return [];
  }
  const { user } = session;

  const { data, error } = await supabase
    .from("synced_calendars")
    .select("google_calendar_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching synced calendars:", error);
    return [];
  }

  return data || [];
};

export const syncGoogleCalendars = async (
  calendarIds: string[]
): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("User not authenticated");
  }
  const { user } = session;

  // Delete all existing synced calendars for the user first
  const { error: deleteError } = await supabase
    .from("synced_calendars")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error clearing old calendar syncs:", deleteError);
    throw new Error("Could not update calendar selection.");
  }

  // If there are new calendars to sync, insert them
  if (calendarIds.length > 0) {
    const rowsToInsert = calendarIds.map((id) => ({
      user_id: user.id,
      google_calendar_id: id,
    }));

    const { error: insertError } = await supabase
      .from("synced_calendars")
      .insert(rowsToInsert);

    if (insertError) {
      console.error("Error inserting new calendar syncs:", insertError);
      throw new Error("Could not save calendar selection.");
    }
  }
};