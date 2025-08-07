"use client";

import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Loader2, XCircle, RefreshCw, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuth } from "@/hooks/useAuth";
import {
  getGoogleCalendarList,
  syncGoogleCalendars,
  getSyncedCalendars,
} from "@/lib/google-calendar";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";


interface Calendar {
  id: string;
  summary: string;
}

export function GoogleCalendarPage() {
  const { googleAccessToken, setGoogleAccessToken } = useAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleAccessToken(tokenResponse.access_token);
      setError(null);
      toast.success("Successfully connected to Google Calendar!");
    },
    onError: () => {
      setError("Failed to connect to Google Calendar. Please try again.");
      toast.error("Failed to connect to Google Calendar.");
    },
    scope:
      "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
  });

  useEffect(() => {
    if (!googleAccessToken) {
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
          setSelectedCalendarIds(
            syncedList.map((c: any) => c.google_calendar_id)
          );
        }
      } catch (e: any) {
        if (e.message.includes("401")) {
          setError(
            "Your session has expired. Please reconnect your Google account."
          );
          toast.error(
            "Your session has expired. Please reconnect your Google account."
          );
          setGoogleAccessToken(null);
        } else {
          setError("Failed to load calendars. Please try again.");
          toast.error("Failed to load calendars. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendars(googleAccessToken);
  }, [googleAccessToken, setGoogleAccessToken]);

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

  const handleDisconnect = () => {
    setGoogleAccessToken(null);
    setCalendars([]);
    setSelectedCalendarIds([]);
    setError(null);
    toast.info("Disconnected from Google Calendar.");
  };

  const calendarOptions = calendars.map((cal) => ({
    value: cal.id,
    label: cal.summary,
  }));

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">
            Loading your calendars...
          </p>
        </div>
      );
    }

    if (!googleAccessToken || error) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          {error && (
            <div className="text-destructive mb-4">
              <XCircle className="h-8 w-8 mx-auto" />
              <p className="mt-2">{error}</p>
            </div>
          )}
          <Button onClick={() => login()}>
            <Link2 className="h-4 w-4 mr-2" />
            Connect to Google Calendar
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            You'll be redirected to Google to authorize access.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Select calendars to sync</h3>
            <Button
              variant="link"
              className="text-destructive h-auto p-0"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
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
    );
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings/integrations">Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Google Calendar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Google Calendar Sync</CardTitle>
            <CardDescription>
              Connect your Google Calendar to sync events and keep your schedules
              aligned.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}