import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/utils";

interface TestNotificationToastProps {
  user: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  };
  type: {
    id: string;
    label: string;
    description: string;
  } | undefined;
}

const TestNotificationToast = ({ user, type }: TestNotificationToastProps) => {
  if (!type || !user) return null;

  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || "You";
  const avatarUrl = getAvatarUrl(user.avatar_url, user.id);
  const initials = getInitials(name, user.email);

  const getSampleMessage = () => {
    switch (type.id) {
      case 'project_update':
        return 'Anda ditambahkan ke proyek "Website Baru".';
      case 'mention':
        return '@' + (name.split(' ')[0] || 'Anda') + ' bisa tolong periksa ini?';
      case 'comment':
        return 'Hai, hanya ingin menindaklanjuti diskusi terakhir kita.';
      case 'goal':
        return 'Goal baru "Selesaikan Laporan Q3" telah dibuat untuk Anda.';
      case 'system':
        return 'Pembaruan sistem baru tersedia. Silakan segarkan halaman.';
      default:
        return `Ini adalah notifikasi tes untuk ${type.label}.`;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">{name}</span>
        <p className="text-sm text-muted-foreground">{getSampleMessage()}</p>
      </div>
    </div>
  );
};

export default TestNotificationToast;