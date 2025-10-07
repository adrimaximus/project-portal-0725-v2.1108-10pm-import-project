import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import { User } from "@/types";
import { Bell } from "lucide-react";

interface TestNotificationToastProps {
  user: User;
}

const TestNotificationToast = ({ user }: TestNotificationToastProps) => {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || "You";
  const avatarUrl = getAvatarUrl(user);
  const initials = getInitials(name);

  return (
    <div className="flex items-start gap-3">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
          <div className="bg-blue-500 text-white rounded-full p-0.5">
            <Bell className="h-2.5 w-2.5" />
          </div>
        </div>
      </div>
      <div className="flex-grow">
        <p className="font-semibold">Test Notification</p>
        <p className="text-sm text-muted-foreground">
          This is a test to confirm that notifications are working for {name}.
        </p>
      </div>
    </div>
  );
};

export default TestNotificationToast;