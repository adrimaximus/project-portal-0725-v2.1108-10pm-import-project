import React, { memo } from 'react';
import { Person as BasePerson } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { User as UserIcon, Instagram, Briefcase, Mail, Building } from 'lucide-react';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import WhatsappIcon from '../icons/WhatsappIcon';
import { toast } from 'sonner';

type Person = BasePerson & { company_id?: string | null; company_logo_url?: string | null };

interface PersonCardProps {
  person: Person;
  onViewProfile: (person: Person) => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
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

const PersonCard = ({ person, onViewProfile }: PersonCardProps) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [person.avatar_url]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (email) {
      navigator.clipboard.writeText(email);
      toast.success('Email address copied!');
    }
  };

  const emailToDisplay = person.contact?.emails?.[0] || person.email;
  const phoneToDisplay = (person.contact as any)?.phones?.[0] || person.phone;

  return (
    <Card 
      className="group h-full flex flex-col transition-shadow hover:shadow-lg cursor-pointer rounded-2xl" 
      onClick={() => onViewProfile(person)}
    >
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          {!imageError ? (
            <img
              src={getAvatarUrl(person.avatar_url, person.id)}
              alt={person.full_name}
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={generatePastelColor(person.id)}>
              <UserIcon className="h-16 w-16 text-white/50" />
            </div>
          )}
        </div>
      </div>
      <CardContent className="p-3 border-t bg-background flex-grow flex flex-col rounded-b-2xl">
        <div className="flex justify-end mb-2 h-5">
          <div className="flex items-center gap-3">
            {person.social_media?.instagram && (
              <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {emailToDisplay && (
              <button
                onClick={(e) => handleCopyEmail(e, emailToDisplay)}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Copy email address"
              >
                <Mail className="h-4 w-4" />
              </button>
            )}
            {phoneToDisplay && (
              <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(phoneToDisplay)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                <WhatsappIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        
        <div className="min-w-0">
          <h3 className="font-bold text-sm truncate">{person.full_name}</h3>
        </div>
        
        {person.job_title && (
          <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <p>{person.job_title}</p>
          </div>
        )}

        {person.company && (
          <div className="mt-auto pt-2">
            <div className="inline-flex items-center gap-2 bg-muted p-1 pr-2 rounded-full">
              {person.company_logo_url ? (
                <img src={person.company_logo_url} alt={`${person.company} logo`} className="h-5 w-5 object-contain rounded-full bg-white" loading="lazy" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-background flex items-center justify-center">
                  <Building className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="text-xs font-medium text-muted-foreground truncate">{person.company}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(PersonCard);