import React from 'react';
import { Person } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

interface PeopleListViewProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PeopleListView: React.FC<PeopleListViewProps> = ({ people, onEditPerson, onDeletePerson, onViewProfile }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map(person => (
          <TableRow key={person.id} onClick={() => onViewProfile(person)} className="cursor-pointer">
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={getAvatarUrl(person.avatar_url, person.id)} />
                  <AvatarFallback style={generatePastelColor(person.id)}>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{person.full_name}</span>
                  <span className="text-sm text-muted-foreground">{person.contact?.emails?.[0] || person.email}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>{person.company}</TableCell>
            <TableCell>{person.job_title}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onEditPerson(person); }}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onDeletePerson(person); }} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PeopleListView;