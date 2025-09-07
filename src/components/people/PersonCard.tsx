import { useState, useEffect } from 'react';
import { Person } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Linkedin, Twitter, Instagram, Briefcase, Mail } from 'lucide-react';
import { generatePastelColor, getInstagramUsername } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import WhatsappIcon from '../icons/WhatsappIcon';

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
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [person.avatar_url]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card 
      className="group h-full flex flex-col transition-shadow hover:shadow-lg cursor-pointer rounded-2xl overflow-hidden" 
      onClick={() => onViewProfile(person)}
    >
      <div className="aspect-[16/9] w-full overflow-hidden relative">
        {person.avatar_url && !imageError ? (
          <img
            src={person.avatar_url}
            alt={person.full_name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={generatePastelColor(person.id)}>
            <UserIcon className="h-16 w-16 text-white/50" />
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-background flex-grow flex flex-col">
        <div className="min-w-0">
          <h3 className="font-bold text-base truncate">{person.full_name}</h3>
        </div>
        
        {(person.company || person.job_title) && (
          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <p>
              {person.job_title}
              {person.job_title && person.company && ' at '}
              {!person.job_title && person.company && 'at '}
              {person.company}
            </p>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center gap-3">
          {person.social_media?.instagram && (
            <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {person.phone && (
            <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(person.phone)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
              <WhatsappIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;