import React, { useMemo } from 'react';
import { Person } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Edit, Trash2, User as UserIcon, Briefcase, MapPin, Mail, Instagram, Twitter, Linkedin } from 'lucide-react';
import { generatePastelColor, getAvatarUrl, getInitials, formatPhoneNumberForApi } from '@/lib/utils';
import { Badge } from '../ui/badge';
import WhatsappIcon from '../icons/WhatsappIcon';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-is-mobile';
import PersonListCard from './PersonListCard';
import { formatDistanceToNow } from 'date-fns';
import { SortableTableHead } from '../ui/SortableTableHead';

interface PeopleTableViewProps {
  people: Person[];
  isLoading: boolean;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewProfile: (person: Person) => void;
  sortConfig: { key: keyof Person | null; direction: 'asc' | 'desc' };
  requestSort: (key: keyof Person) => void;
}

const getInstagramUsername = (url: string | undefined) => {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(p => p);
    return parts[0] ? `@${parts[0]}` : null;
  } catch (e) {
    return null;
  }
};

const PeopleTableView: React.FC<PeopleTableViewProps> = ({ people, isLoading, onEdit, onDelete, onViewProfile, sortConfig, requestSort }) => {
  const isMobile = useIsMobile();

  const groupedPeople = useMemo(() => {
    return people.reduce((acc, person) => {
      const company = person.company || 'No Company';
      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(person);
      return acc;
    }, {} as Record<string, Person[]>);
  }, [people]);

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (email) {
      navigator.clipboard.writeText(email);
      toast.success('Email address copied!');
    }
  };

  if (isMobile) {
    return (
      <div className="overflow-y-auto h-full space-y-4">
        {Object.entries(groupedPeople).map(([company, peopleInGroup]) => (
          <div key={company}>
            <h3 className="font-semibold px-2 mb-2">{company}</h3>
            <div className="space-y-2">
              {peopleInGroup.map(person => (
                <PersonListCard
                  key={person.id}
                  person={person}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewProfile={onViewProfile}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead columnKey="full_name" onSort={requestSort} sortConfig={sortConfig} className="w-[250px] sticky left-0 bg-card z-10">
              Name
            </SortableTableHead>
            <SortableTableHead columnKey="job_title" onSort={requestSort} sortConfig={sortConfig} className="hidden sm:table-cell">
              Work
            </SortableTableHead>
            <SortableTableHead columnKey="address" onSort={requestSort} sortConfig={sortConfig} className="hidden lg:table-cell">
              Address
            </SortableTableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden sm:table-cell">Tags</TableHead>
            <SortableTableHead columnKey="updated_at" onSort={requestSort} sortConfig={sortConfig} className="hidden lg:table-cell">
              Last Activity
            </SortableTableHead>
            <TableHead className="text-right sticky right-0 bg-card z-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
          ) : Object.keys(groupedPeople).length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center h-24">No people found.</TableCell></TableRow>
          ) : (
            Object.entries(groupedPeople).map(([company, peopleInGroup]) => (
              <React.Fragment key={company}>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="font-semibold bg-muted/50 sticky left-0 z-10">
                    {company}
                  </TableCell>
                  <TableCell colSpan={6} className="bg-muted/50" />
                </TableRow>
                {peopleInGroup.map(person => (
                  <TableRow key={person.id}>
                    <TableCell className="sticky left-0 bg-card z-10 cursor-pointer" onClick={() => onViewProfile(person)}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarUrl(person.avatar_url, person.id)} />
                          <AvatarFallback style={generatePastelColor(person.id)}>
                            <UserIcon className="h-5 w-5 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{person.full_name}</p>
                          <p className="text-sm text-muted-foreground">{person.contact?.emails?.[0]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => onViewProfile(person)}>
                      <p className="font-medium">{person.job_title || '-'}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.department}{person.department && person.company ? ' at ' : ''}{person.company}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-sm text-muted-foreground cursor-pointer" onClick={() => onViewProfile(person)}>
                      {(typeof person.address === 'object' && person.address?.formatted_address) || (typeof person.address === 'string' && person.address) || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => onViewProfile(person)}>
                      <div className="flex items-center gap-3">
                        {person.contact?.phones?.[0] && (
                          <a href={`https://wa.me/${formatPhoneNumberForApi(person.contact.phones[0])}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                            <WhatsappIcon className="h-4 w-4" />
                            <span className="text-sm">{person.contact.phones[0]}</span>
                          </a>
                        )}
                        {person.social_media?.linkedin && <a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Linkedin className="h-4 w-4 text-muted-foreground hover:text-primary" /></a>}
                        {person.social_media?.twitter && <a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Twitter className="h-4 w-4 text-muted-foreground hover:text-primary" /></a>}
                        {person.social_media?.instagram && (
                          <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                            <Instagram className="h-4 w-4" />
                            <span className="text-sm">{getInstagramUsername(person.social_media.instagram)}</span>
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => onViewProfile(person)}>
                      <div className="flex flex-wrap gap-1">
                        {(person.tags || []).map(tag => (
                          <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground cursor-pointer" onClick={() => onViewProfile(person)}>
                      {formatDistanceToNow(new Date(person.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right sticky right-0 bg-card z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onEdit(person)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onDelete(person)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PeopleTableView;