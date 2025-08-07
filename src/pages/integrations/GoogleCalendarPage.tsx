"use client";

import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuth } from "@/hooks/useAuth";
import {
  getGoogleCalendarList,
  syncGoogleCalendars,
  getSyncedCalendars,
} from "@/lib/google-calendar";

interface Calendar {
  id: string;
  summary: string;
}

export function GoogleCalendarPage() {
  const { user, googleAccessToken, refreshGoogleToken } = useAuth();
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!googleAccessToken) {
      setError("Google account not connected. Please connect your account.");
      setIsLoading(false);
      return;
    }

    const fetchCalendars = async (token: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const [calendarList, syncedList] = await Promise.all([
          getGoogleCalendarList(token),
          getSyncedCalendars(),
        ]);

        if (calendarList) {
          setCalendars(calendarList);
        } else {
          throw new Error("Failed to fetch calendar list.");
        }

        if (syncedList) {
          setSelectedCalendarIds(syncedList.map((c: any) => c.google_calendar_id));
        }
      } catch (e: any) {
        if (e.message.includes("401")) {
          // Token might be expired
          try {
            const newAccessToken = await refreshGoogleToken();
            if (newAccessToken) {
              fetchCalendars(newAccessToken); // Retry with new token
            } else {
              throw new Error("Failed to refresh token.");
            }
          } catch (refreshError) {
            setError(
              "Your session has expired. Please disconnect and reconnect your Google account."
            );
            toast.error(
              "Your session has expired. Please disconnect and reconnect your Google account."
            );
          }
        } else {
          setError("Failed to load calendars. Please try again.");
          toast.error("Failed to load calendars. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendars(googleAccessToken);
  }, [user, googleAccessToken, navigate, refreshGoogleToken]);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.loading("Syncing calendars...");
    try {
      await syncGoogleCalendars(selectedCalendarIds);
      toast.dismiss();
      toast.success("Calendars synced successfully!");
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to sync calendars. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const calendarOptions = calendars.map((cal) => ({
    value: cal.id,
    label: cal.summary,
  }));

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Google Calendar Sync</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">
                Loading your calendars...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-destructive">
              <XCircle className="h-8 w-8" />
              <p className="mt-4 text-center">{error}</p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => {
                  // Here you would typically have a function to disconnect the account
                  // For now, we just show a message.
                  toast.info(
                    "Please go to settings to disconnect your account."
                  );
                }}
              >
                Disconnect Account
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">
                  Select calendars to sync
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Events from selected calendars will be synced to your project
                  management board.
                </p>
                <MultiSelect
                  options={calendarOptions}
                  defaultValue={selectedCalendarIds}
                  onValueChange={setSelectedCalendarIds}
                  placeholder="Select calendars to sync..."
                />
              </div>
              <Button
                onClick={handleSync}
                disabled={isSyncing || selectedCalendarIds.length === 0}
                className="w-full"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? "Syncing..." : "Sync Selected Calendars"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}