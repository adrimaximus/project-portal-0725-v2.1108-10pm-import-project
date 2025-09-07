import React, { useState, useMemo, useEffect, useRef } from "react";
import { Project, User, Tag, Person } from '@/types';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { Plus, List, View, Kanban, Building, MoreHorizontal, Trash2, Edit, User as UserIcon, Linkedin, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generatePastelColor, getAvatarUrl, getInitials, formatInJakarta } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PersonFormDialog } from "@/components/people/PersonFormDialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import PeopleKanbanView from "@/components/people/PeopleKanbanView";
import PersonCard from "@/components/people/PersonCard";
import CompaniesView from "@/components/people/CompaniesView";
import DuplicateContactsCard from "@/components/people/DuplicateContactsCard";

export default function PeoplePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person | null; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'grid' | 'companies'>(() => {
    return (localStorage.getItem('peopleViewMode') as 'table' | 'kanban' | 'grid' | 'companies') || 'table';
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  
  const { data: people = [], isLoading, error } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw new Error(error.message);
      return (data as Person[]).map(person => ({
        ...person,
        avatar_url: getAvatarUrl(person.avatar_url, person.id)
      }));
    }
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw new Error(error.message);
      return data;
    }
  });

  useEffect(() => {
    localStorage.setItem('peopleViewMode', viewMode);
  }, [viewMode]);

  const filteredAndSortedPeople = useMemo(() => {
    let filtered = people;
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = people.filter(person =>
        person.full_name.toLowerCase().includes(lowercasedFilter) ||
        (person.company && person.company.toLowerCase().includes(lowercasedFilter)) ||
        (person.job_title && person.job_title.toLowerCase().includes(lowercasedFilter)) ||
        (person.tags && person.tags.some(tag => tag.name.toLowerCase().includes(lowercasedFilter)))
      );
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [people, searchTerm, sortConfig]);

  const requestSort = (key: keyof Person) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteClick = (person: Person) => {
    setSelectedPerson(person);
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPerson) return;
    const { error } = await supabase.from('people').delete().eq('id', selectedPerson.id);
    if (error) {
      toast.error(`Failed to delete ${selectedPerson.full_name}: ${error.message}`);
    } else {
      toast.success(`${selectedPerson.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
    setDeleteConfirmationOpen(false);
    setSelectedPerson(null);
  };

  const handleEditClick = (person: Person) => {
    setEditPerson(person);
  };
  
  const handleViewProfile = (person: Person) => {
    navigate(`/people/${person.id}`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading people: {error.message}</div>;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">People</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}><View className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')}><Kanban className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'companies' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('companies')}><Building className="h-4 w-4" /></Button>
          </div>
          <PersonFormDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['people'] })} />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <DuplicateContactsCard />
        {viewMode === 'table' && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('full_name')} className="px-2">Name</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('job_title')} className="px-2">Title</Button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('address')} className="px-2">Address</Button>
                  </TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('updated_at')} className="px-2">Last Activity</Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPeople.map(person => (
                  <TableRow key={person.id} className="cursor-pointer" onClick={() => handleViewProfile(person)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={person.avatar_url || undefined} />
                          <AvatarFallback style={generatePastelColor(person.id)}>
                            {getInitials(person.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{person.full_name}</p>
                          <p className="text-sm text-muted-foreground">{person.contact?.emails?.[0]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{person.job_title || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          {person.department}{person.department && person.company ? ' at ' : ''}{person.company}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-sm text-muted-foreground cursor-pointer" onClick={() => handleViewProfile(person)}>
                      {person.address?.formatted_address || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {person.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag.id} variant="secondary" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>{tag.name}</Badge>
                        ))}
                        {person.tags && person.tags.length > 2 && (
                          <Badge variant="outline">+{person.tags.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground cursor-pointer" onClick={() => handleViewProfile(person)}>
                      {person.updated_at ? formatDistanceToNow(new Date(person.updated_at), { addSuffix: true }) : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(person); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(person); }} className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {viewMode === 'kanban' && <PeopleKanbanView people={filteredAndSortedPeople} tags={tags} onEditPerson={handleEditClick} onDeletePerson={handleDeleteClick} />}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedPeople.map(person => (
              <PersonCard key={person.id} person={person} onViewProfile={handleViewProfile} onEdit={handleEditClick} onDelete={handleDeleteClick} />
            ))}
          </div>
        )}
        {viewMode === 'companies' && <CompaniesView people={filteredAndSortedPeople} />}
      </main>

      <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedPerson?.full_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {editPerson && <PersonFormDialog person={editPerson} onSuccess={() => { setEditPerson(null); queryClient.invalidateQueries({ queryKey: ['people'] }); }} />}
    </div>
  );
}