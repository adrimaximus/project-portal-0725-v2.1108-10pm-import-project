import { AppNotification } from '@/types';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationIcons } from '@/data/notifications';
import InteractiveText from './InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';

interface NotificationToastProps {
  notification: AppNotification;
  toastId: string | number;
}

const NotificationToast = ({ notification, toastId }: NotificationToastProps) => {
  const { data: allUsers = [] } = useProfiles();
  const handleViewClick = () => {
    toast.dismiss(toastId);
  };

  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.system;

  return (
    <div className="flex items-start gap-3 p-4 bg-card border rounded-lg shadow-lg w-full max-w-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0 mt-1">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">
          <InteractiveText text={notification.title} members={allUsers} />
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          <InteractiveText text={notification.description} members={allUsers} />
        </p>
        <div className="mt-2">
          <Button asChild size="sm" onClick={handleViewClick}>
            <Link to={notification.link}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;