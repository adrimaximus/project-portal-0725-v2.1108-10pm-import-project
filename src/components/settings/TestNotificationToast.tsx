import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

export const TestNotificationToast = () => {
  const { user } = useAuth();

  if (!user) return null;

  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || "You";
  const avatarUrl = getAvatarUrl(user.avatar_url);
  const initials = getInitials(name, user.email);

  return (
    <div className="flex items-start gap-3">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
          <div className="bg-blue-500 text-white rounded-full p-0.5">
            <Bell className="h-2.5 w-2.5" />
          </div>
        </div>
      </div>
      <div className="flex-1">
        <p className="font-semibold">Test Notification</p>
        <p className="text-sm text-muted-foreground">
          This is a test to confirm that notifications are working.
        </p>
      </div>
    </div>
  );
};