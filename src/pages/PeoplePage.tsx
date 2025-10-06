import React, { useState, useMemo, useEffect, useRef } from "react";
import { Project, UserProfile, Tag, Person } from '@/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlusCircle, LayoutGrid, List, Kanban, Users, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from 'lodash';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import PersonFormDialog from "@/components/people/PersonFormDialog";
import PeopleGridView from "@/components/people/PeopleGridView";
import PeopleKanbanView from "@/components/people/PeopleKanbanView";
import PersonListCard from "@/components/people/PersonListCard";
import DuplicateContactsCard from "@/components/people/DuplicateContactsCard";

type View = 'grid' | 'list' | 'kanban';
type GroupBy = 'none' | 'company' | 'first_letter';

const PeoplePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>((searchParams.get('view') as View) || 'grid');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'updated_at-desc');
  const [groupBy, setGroupBy] = useState<GroupBy>((searchParams.get('group') as GroupBy) || 'none');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  const { data: people = [], isLoading: isLoadingPeople } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data;
    },
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingPeople || isLoadingTags;

  const debouncedSetSearch = useRef(
    debounce((value) => {
      setSearchParams(prev => {
        prev.set('search', value);
        if (!value) prev.delete('search');
        return prev;
      }, { replace: true });
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const filteredAndSortedPeople = useMemo(() => {
    let filtered = people.filter(person =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const [sortField, sortOrder] = sortBy.split('-');
    filtered.sort((a, b) => {
      let valA = a[sortField as keyof Person];
      let valB = b[sortField as keyof Person];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA instanceof Date && valB instanceof Date) {
        return sortOrder === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      }
      return 0;
    });

    return filtered;
  }, [people, searchTerm, sortBy]);

  const groupedPeople = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All People': filteredAndSortedPeople };
    }
    return filteredAndSortedPeople.reduce((acc, person) => {
      let key: string;
      if (groupBy === 'company') {
        key = person.company || 'No Company';
      } else { // first_letter
        key = person.full_name?.[0]?.toUpperCase() || '#';
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(person);
      return acc;
    }, {} as Record<string, Person[]>);
  }, [filteredAndSortedPeople, groupBy]);

  const handleViewChange = (value: View) => {
    if (value) {
      setView(value);
      setSearchParams(prev => {
        prev.set('view', value);
        return prev;
      }, { replace: true });
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setSearchParams(prev => {
      prev.set('sort', value);
      return prev;
    }, { replace: true });
  };

  const handleGroupByChange = (value: GroupBy) => {
    setGroupBy(value);
    setSearchParams(prev => {
      prev.set('group', value);
      return prev;
    }, { replace: true });
  };

  const handleAddNew = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const renderContent = () => {
    if (isLoading) return <div>Loading...</div>;

    if (view === 'grid') {
      return <PeopleGridView people={filteredAndSortedPeople} onEdit={handleEdit} />;
    }
    if (view === 'kanban') {
      return <PeopleKanbanView people={people} tags={tags} onEdit={handleEdit} />;
    }
    // List view
    if (groupBy === 'none') {
      return (
        <div className="space-y-2">
          {filteredAndSortedPeople.map(person => (
            <PersonListCard key={person.id} person={person} onEdit={handleEdit} />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {Object.entries(groupedPeople).sort(([a], [b]) => a.localeCompare(b)).map(([group, peopleInGroup]) => (
          <Collapsible key={group} defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold">
              {group} ({peopleInGroup.length})
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {view === 'list' && (
                <div className="space-y-2 mt-2">
                  {(peopleInGroup as Person[]).map(person => (
                    <PersonListCard key={person.id} person={person} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">People</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger><SelectValue placeholder="Sort by..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at-desc">Last Modified</SelectItem>
              <SelectItem value="full_name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="full_name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="created_at-desc">Date Added</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={handleGroupByChange}>
            <SelectTrigger><SelectValue placeholder="Group by..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="first_letter">First Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <ToggleGroup type="single" value={view} onValueChange={handleViewChange}>
          <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>

      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={personToEdit}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['people'] })}
      />
    </div>
  );
};

export default PeoplePage;