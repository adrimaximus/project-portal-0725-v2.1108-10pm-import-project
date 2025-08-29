import { Person } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Linkedin, Twitter, Instagram } from 'lucide-react';
import { generateVibrantGradient } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onViewProfile: (person: Person) => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

const PersonCard = ({ person, onViewProfile }: PersonCardProps) => {
  return (
    <Card 
      className="group h-full flex flex-col transition-shadow hover:shadow-lg cursor-pointer rounded-2xl overflow-hidden" 
      onClick={() => onViewProfile(person)}
    >
      <div className="aspect-[4/3] w-full overflow-hidden relative">
        {person.avatar_url ? (
          <img
            src={person.avatar_url}
            alt={person.full_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={generateVibrantGradient(person.id)}>
            <UserIcon className="h-16 w-16 text-white/50" />
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-background">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <h3 className="font-bold text-base truncate">{person.full_name}</h3>
            <p className="text-sm text-muted-foreground truncate">{person.job_title || 'No title'}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {person.social_media?.twitter && (
              <a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Twitter className="h-4 w-4" /></Button>
              </a>
            )}
            {person.social_media?.instagram && (
              <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Instagram className="h-4 w-4" /></Button>
              </a>
            )}
            {person.social_media?.linkedin && (
              <a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Linkedin className="h-4 w-4" /></Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;