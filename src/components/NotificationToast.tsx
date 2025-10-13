import { Bell } from 'lucide-react';

interface NotificationToastProps {
  title: string;
  body: string;
}

const NotificationToast = ({ title, body }: NotificationToastProps) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="bg-primary/10 text-primary p-2 rounded-full">
        <Bell className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
};

export default NotificationToast;