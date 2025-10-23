import React, { useState, useMemo, useEffect, useRef } from "react";
import { Project, User, Tag, Person } from '@/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, GitMerge, Loader2, Kanban, LayoutGrid, Table as TableIcon, Settings, Building } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PersonFormDialog from "@/components/people/PersonFormDialog";
import { DuplicatePair } from "@/components/people/DuplicateContactsCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PeopleKanbanView from "@/components/people/PeopleKanbanView";
import PeopleGridView from "@/components/people/PeopleGridView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DuplicateSummaryDialog from "@/components/people/DuplicateSummaryDialog";
import MergeDialog from "@/components/people/MergeDialog";
import CompaniesView from "@/components/people/CompaniesView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeopleTableView from "@/components/people/PeopleTableView";

type KanbanViewHandle = {
  openSettings: () => void;
};

const PeoplePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person | null; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });
  
  const activeTab = searchParams.get('tab') || 'people';
  const viewModeFromUrl = searchParams.get('view') as 'table' | 'kanban' | 'grid';
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'grid'>(viewModeFromUrl || 'grid');

  const [isFindingDuplicates, setIsFindingDuplicates] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{ summary: string; pairs: DuplicatePair[] } | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [selectedMergePair, setSelectedMergePair] = useState<DuplicatePair | null>(null);
  const kanbanViewRef = useRef<KanbanViewHandle>(null);

  useEffect(() => {
    if (activeTab === 'people') {
      localStorage.setItem('people_view_mode', viewMode);
      setSearchParams({ tab: 'people', view: viewMode }, { replace: true });
    } else {
      setSearchParams({ tab: 'companies' }, { replace: true });
    }
  }, [viewMode, activeTab, setSearchParams]);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people', 'with-slug'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return (data as Person[]).map(person => ({
        ...person,
        tags: person.tags ? [...person.tags].sort((a, b) => a.name.localeCompare(b.name)) : [],
      }));
    }
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      return data as Tag[];
    }
  });

  const findAndAnalyzeDuplicates = async () => {
    setIsFindingDuplicates(true);
    toast.info("Searching for duplicates...");

    const { data: pairs, error: rpcError } = await supabase.rpc('find_duplicate_people');
    if (rpcError) {
      toast.error("Failed to check for duplicates.", { description: rpcError.message });
      setIsFindingDuplicates(false);
      return;
    }

    if (!pairs || pairs.length === 0) {
      toast.info("No potential duplicates found.");
      setIsFindingDuplicates(false);
      return;
    }

    toast.info(`Found ${pairs.length} potential duplicate(s). Asking AI for analysis...`);

    const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-handler', {
      body: { feature: 'analyze-duplicates', payload: { duplicates: pairs } },
    });

    if (aiError) {
      toast.error("AI analysis failed.", { description: aiError.message });
      setIsFindingDuplicates(false);
      return;
    }

    setDuplicateData({ summary: aiData.result, pairs: pairs as DuplicatePair[] });
    setIsSummaryDialogOpen(true);
    setIsFindingDuplicates(false);
  };

  const requestSort = (key: keyof Person) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedPeople = useMemo(() => {
    let sortableItems = [...people];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [people, sortConfig]);

  const filteredPeople = useMemo(() => {
    return sortedPeople.filter(person =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.job_title && person.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedPeople, searchTerm]);

  const handleAddNew = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const handleViewProfile = (person: Person) => {
    if (person.slug) {
      navigate(`/people/${person.slug}`);
    } else {
      toast.error('Cannot view profile, slug is missing.');
    }
  };

  const handleDelete = async () => {
    if (!personToDelete) return;

    await queryClient.cancelQueries({ queryKey: ['people', 'with-slug'] });
    const previousPeople = queryClient.getQueryData<Person[]>(['people', 'with-slug']);
    queryClient.setQueryData<Person[]>(['people', 'with-slug'], (old) =>
      old ? old.filter((p) => p.id !== personToDelete.id) : []
    );
    setPersonToDelete(null);

    const { error } = await supabase.from('people').delete().eq('id', personToDelete.id);

    if (error) {
      queryClient.setQueryData(['people', 'with-slug'], previousPeople);
      toast.error(`Failed to delete ${personToDelete.full_name}.`, { description: getErrorMessage(error) });
    } else {
      toast.success(`${personToDelete.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people', 'with-slug'] });
    }
  };

  return (
    <PortalLayout>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">People & Companies</h1>
              <p className="text-muted-foreground">Manage your contacts, connections, and companies.</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="flex-grow flex flex-col space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="flex-grow flex flex-col space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 flex-wrap">
              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="icon" onClick={findAndAnalyzeDuplicates} disabled={isFindingDuplicates}>
                  {isFindingDuplicates ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                </Button>
                <Button size="icon" onClick={handleAddNew}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate('/settings/people-properties')}>
                      Manage Properties
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as 'grid' | 'table' | 'kanban')}}>
                  <TooltipProvider>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Grid View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Table View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Kanban View</p></TooltipContent></Tooltip>
                  </TooltipProvider>
                </ToggleGroup>
              </div>
            </div>
            <div className="flex-grow min-h-0">
              {viewMode === 'table' ? (
                <PeopleTableView
                  people={filteredPeople}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={setPersonToDelete}
                  onViewProfile={handleViewProfile}
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                />
              ) : viewMode === 'kanban' ? (
                <PeopleKanbanView ref={kanbanViewRef} people={filteredPeople} tags={tags} onEditPerson={handleEdit} onDeletePerson={setPersonToDelete} />
              ) : (
                <div className="overflow-y-auto h-full">
                  <PeopleGridView people={filteredPeople} onEditPerson={handleEdit} onDeletePerson={setPersonToDelete} onViewProfile={handleViewProfile} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="flex-grow flex flex-col mt-0">
            <CompaniesView />
          </TabsContent>
        </Tabs>

        <PersonFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={(newPerson) => {
            queryClient.invalidateQueries({ queryKey: ['people'] });
            if (newPerson.slug) {
              navigate(`/people/${newPerson.slug}`);
            }
          }}
          person={personToEdit}
        />

        <AlertDialog open={!!personToDelete} onOpenChange={(open) => !open && setPersonToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the record for {personToDelete?.full_name}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {duplicateData && (
          <DuplicateSummaryDialog
            open={isSummaryDialogOpen}
            onOpenChange={setIsSummaryDialogOpen}
            summary={duplicateData.summary}
            duplicates={duplicateData.pairs}
            onSelectPair={(pair) => {
              setIsSummaryDialogOpen(false);
              setSelectedMergePair(pair);
            }}
          />
        )}

        {selectedMergePair && (
          <MergeDialog
            open={!!selectedMergePair}
            onOpenChange={() => setSelectedMergePair(null)}
            person1={selectedMergePair.person1}
            person2={selectedMergePair.person2}
          />
        )}
      </div>
    </PortalLayout>
  );
};

export default PeoplePage;