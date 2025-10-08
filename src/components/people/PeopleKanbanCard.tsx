import { Person } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, generatePastelColor, formatInJakarta, formatPhoneNumberForApi } from '@/lib/utils';
import { User as UserIcon, Mail, MoreHorizontal, Edit, Trash2, Instagram, Briefcase } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

interface PeopleKanbanCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
}

export default function PeopleKanbanCard({ person, onEdit, onDelete }: PeopleKanbanCardProps) {
  const primaryEmail = person.contact?.emails?.[0];
  const primaryPhone = person.contact?.phones?.[0];

  return (
    <Card className="mb-4 bg-card hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <Link to={`/people/${person.id}`} className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={person.avatar_url} />
              <AvatarFallback style={{ backgroundColor: generatePastelColor(person.id) }}>
                <UserIcon className="h-4 w-4 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold">{person.full_name}</p>
              <p className="text-sm text-muted-foreground">{person.job_title}</p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(person)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(person.id)} className="text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {person.company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{person.company}</span>
            </div>
          )}
          {primaryEmail && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${primaryEmail}`} className="hover:underline">{primaryEmail}</a>
            </div>
          )}
          {person.social_media?.instagram && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Instagram className="h-4 w-4" />
              <a href={`https://instagram.com/${person.social_media.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {person.social_media.instagram}
              </a>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {person.tags?.map(tag => (
            <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}