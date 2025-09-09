import { Person } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, MoreVertical, Trash2, User as UserIcon, Mail, Instagram } from 'lucide-react';
import WhatsappIcon from '../icons/WhatsappIcon';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generatePastelColor } from '@/lib/utils';

interface PersonHeaderProps {
  person: Person;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const formatPhoneNumberForWhatsApp = (phone: string | undefined) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

const PersonHeader = ({ person, onEdit, onDelete, isAdmin }: PersonHeaderProps) => {
  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0] || person.phone;
  const whatsappLink = firstPhone ? `https://wa.me/${formatPhoneNumberForWhatsApp(firstPhone)}` : null;

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstEmail) {
      navigator.clipboard.writeText(firstEmail);
      toast.success('Email address copied!');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <Avatar className="h-24 w-24 border">
        <AvatarImage src={person.avatar_url} alt={person.full_name} />
        <AvatarFallback style={generatePastelColor(person.id)} className="text-3xl">
          <UserIcon className="h-10 w-10 text-white" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-3xl font-bold">{person.full_name}</h2>
        <p className="text-muted-foreground">{person.job_title || 'No title specified'}</p>
        <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
          {firstEmail && (
            <Button variant="outline" size="sm" onClick={handleCopyEmail}>
              <Mail className="mr-2 h-4 w-4" /> Email
            </Button>
          )}
          {whatsappLink && (
            <Button variant="outline" size="sm" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <WhatsappIcon className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
          {person.social_media?.instagram && (
            <Button variant="outline" size="icon" asChild>
              <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default PersonHeader;