import React, { useState, useMemo, useEffect, useRef } from "react";
import { Project, User, Tag, Person } from '@/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, LayoutGrid, List, Users, Building, MoreHorizontal, ChevronsUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import PeopleGridView from '@/components/people/PeopleGridView';
import PeopleKanbanView from '@/components/people/PeopleKanbanView';
import CompaniesView from '@/components/people/CompaniesView';
import PersonListCard from "@/components/people/PersonListCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge";
import DuplicateContactsCard from "@/components/people/DuplicateContactsCard";

type View = 'grid' | 'list' | 'grouped-list' | 'kanban';

const PeoplePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'people');
  const [view, setView] = useState<View>((searchParams.get('view') as View) || 'grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person | null; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });

  const { data: people = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw new Error(error.message);
      return data as Person[];
    },
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw new Error(error.message);
      return data as Tag[];
    },
  });

  const filteredPeople = useMemo(() => {
    return people.filter(person =>
      person.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (person.company && person.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [people, searchQuery]);

  const sortedPeople = useMemo(() => {
    let sortableItems = [...filteredPeople];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
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
    return sortableItems;
  }, [filteredPeople, sortConfig]);

  const groupedByCompany = useMemo(() => {
    const grouped: { [company: string]: Person[] } = {};
    sortedPeople.forEach(person => {
      const company = person.company || 'No Company';
      if (!grouped[company]) {
        grouped[company] = [];
      }
      grouped[company].push(person);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [sortedPeople]);

  const handleViewChange = (newView: View) => {
    setView(newView);
    setSearchParams({ tab: activeTab, view: newView });
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab, view });
  };

  const handleAddNew = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const handleViewProfile = (person: Person) => {
    navigate(`/people/${person.id}`);
  };

  const requestSort = (key: keyof Person) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Person) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4 ml-2" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const renderContent = () => {
    if (isLoadingPeople || isLoadingTags) {
      return <div className="text-center p-8">Loading...</div>;
    }

    if (activeTab === 'people') {
      switch (view) {
        case 'grid':
          return <PeopleGridView people={sortedPeople} onEdit={handleEditPerson} onViewProfile={handleViewProfile} />;
        case 'kanban':
          return <PeopleKanbanView people={people} tags={tags} />;
        case 'grouped-list':
          return (
            <div className="space-y-4">
              <DuplicateContactsCard />
              {groupedByCompany.map(([company, peopleInGroup]) => (
                <Collapsible key={company} defaultOpen>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border">
                      <h3 className="font-semibold">{company}</h3>
                      <Badge variant="secondary">{peopleInGroup.length}</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border border-t-0 rounded-b-lg">
                    <div className="space-y-2">
                      {(peopleInGroup as Person[]).map(person => (
                        <PersonListCard
                          key={person.id}
                          person={person}
                          onEdit={() => handleEditPerson(person)}
                          onViewProfile={() => handleViewProfile(person)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          );
        case 'list':
        default:
          return (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => requestSort('full_name')} className="px-2">Name {getSortIcon('full_name')}</Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('company')} className="px-2">Company {getSortIcon('company')}</Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Tags</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('updated_at')} className="px-2">Last Activity {getSortIcon('updated_at')}</Button>
                    </TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPeople.map(person => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleViewProfile(person)}>
                          <Avatar>
                            <AvatarImage src={getAvatarUrl(person.avatar_url, person.id)} />
                            <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{person.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {person.department}{person.department && person.company ? ' at ' : ''}{person.company}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => handleViewProfile(person)}>
                        {person.company || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell cursor-pointer" onClick={() => handleViewProfile(person)}>
                        <div className="flex flex-wrap gap-1">
                          {person.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: 'white' }}>{tag.name}</Badge>
                          ))}
                          {person.tags && person.tags.length > 2 && <Badge variant="outline">+{person.tags.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground cursor-pointer" onClick={() => handleViewProfile(person)}>
                        {person.updated_at ? formatDistanceToNow(new Date(person.updated_at), { addSuffix: true }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleViewProfile(person)}>View Profile</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleEditPerson(person)}>Edit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          );
      }
    }
    if (activeTab === 'companies') {
      return <CompaniesView />;
    }
  };

  return (
    <PortalLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">People</h1>
          <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Add New</Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="people"><Users className="mr-2 h-4 w-4" /> People</TabsTrigger>
            <TabsTrigger value="companies"><Building className="mr-2 h-4 w-4" /> Companies</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          {activeTab === 'people' && (
            <div className="flex items-center gap-2">
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewChange('grid')}><LayoutGrid className="h-4 w-4" /></Button>
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewChange('list')}><List className="h-4 w-4" /></Button>
              <Button variant={view === 'grouped-list' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewChange('grouped-list')}><Users className="h-4 w-4" /></Button>
              <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewChange('kanban')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
              </Button>
            </div>
          )}
        </div>

        {renderContent()}
      </div>
      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={personToEdit}
      />
    </PortalLayout>
  );
};

export default PeoplePage;