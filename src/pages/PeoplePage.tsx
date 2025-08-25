import { useState, useMemo, useEffect } from "react";
import { Project, User, Tag, Person } from '@/types';
import { useNavigate } from 'react-router-dom';
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, User as UserIcon, Linkedin, Twitter, Instagram, GitMerge, Loader2, Kanban, LayoutGrid, Table as TableIcon, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { generateVibrantGradient } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PersonFormDialog from "@/components/people/PersonFormDialog";
import { Badge } from "@/components/ui/badge";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { DuplicatePair } from "@/components/people/DuplicateContactsCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PeopleKanbanView from "@/components/people/PeopleKanbanView";
import PeopleGridView from "@/components/people/PeopleGridView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DuplicateSummaryDialog from "@/components/people/DuplicateSummaryDialog";
import MergeDialog from "@/components/people/MergeDialog";
import React from "react";

const PeoplePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person | null; direction: 'ascending' | 'descending' }>({ key: 'updated_at', direction: 'descending' });
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'grid'>(() => {
    const savedView = localStorage.getItem('people_view_mode') as 'table' | 'kanban' | 'grid';
    return savedView || 'grid';
  });
  const [isFindingDuplicates, setIsFindingDuplicates] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{ summary: string; pairs: DuplicatePair[] } | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [selectedMergePair, setSelectedMergePair] = useState<DuplicatePair | null>(null);

  useEffect(() => {
    localStorage.setItem('people_view_mode', viewMode);
  }, [viewMode]);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data as Person[];
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

  const groupedPeople = useMemo(() => {
    return filteredPeople.reduce((acc, person) => {
      const company = person.company || 'No Company';
      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(person);
      return acc;
    }, {} as Record<string, Person[]>);
  }, [filteredPeople]);

  const handleAddNew = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const handleViewProfile = (person: Person) => {
    navigate(`/people/${person.id}`);
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    const { error } = await supabase.from('people').delete().eq('id', personToDelete.id);
    if (error) {
      toast.error(`Failed to delete ${personToDelete.full_name}.`);
    } else {
      toast.success(`${personToDelete.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
    setPersonToDelete(null);
  };

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

  return (
    <PortalLayout>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">People</h1>
              <p className="text-muted-foreground">Manage your contacts and connections.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="icon" onClick={findAndAnalyzeDuplicates} disabled={isFindingDuplicates} className="flex-shrink-0">
                {isFindingDuplicates ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
              </Button>
              <Button onClick={handleAddNew} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Person
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, company, or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full"
                />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/settings/people-properties')}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Properties
              </Button>
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as 'table' | 'kanban' | 'grid')}} className="w-full sm:w-auto justify-center sm:justify-end">
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                          </TooltipTrigger>
                          <TooltipContent><p>Grid View</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem>
                          </TooltipTrigger>
                          <TooltipContent><p>Table View</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem>
                          </TooltipTrigger>
                          <TooltipContent><p>Kanban View</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </ToggleGroup>
            </div>
        </div>

        <div className="flex-grow min-h-0">
          {viewMode === 'table' ? (
            <div className="border rounded-lg overflow-auto h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px] sticky left-0 bg-card z-10">
                      <Button variant="ghost" onClick={() => requestSort('full_name')} className="px-2">Name</Button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('job_title')} className="px-2">Work</Button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('address')} className="px-2">Address</Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden sm:table-cell">Tags</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <Button variant="ghost" onClick={() => requestSort('updated_at')} className="px-2">Last Activity</Button>
                    </TableHead>
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
                          <TableRow key={person.id} className="cursor-pointer" onClick={() => handleViewProfile(person)}>
                            <TableCell className="sticky left-0 bg-card z-10">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={person.avatar_url} />
                                  <AvatarFallback style={generateVibrantGradient(person.id)}>
                                    <UserIcon className="h-5 w-5 text-white" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{person.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{person.contact?.emails?.[0]}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <p className="font-medium">{person.job_title || '-'}</p>
                              <p className="text-sm text-muted-foreground">
                                {person.department}{person.department && person.company ? ' at ' : ''}{person.company}
                              </p>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                              {person.address?.formatted_address || '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-3">
                                {person.contact?.phones?.[0] && (
                                  <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(person.contact.phones[0])}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
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
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {(person.tags || []).map(tag => (
                                  <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(person.updated_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right sticky right-0 bg-card z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEdit(person); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); setPersonToDelete(person); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
          ) : viewMode === 'kanban' ? (
            <PeopleKanbanView people={filteredPeople} tags={tags} onEditPerson={handleViewProfile} />
          ) : (
            <div className="overflow-y-auto h-full">
              <PeopleGridView people={filteredPeople} onEditPerson={handleEdit} onDeletePerson={setPersonToDelete} onViewProfile={handleViewProfile} />
            </div>
          )}
        </div>
      </div>

      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
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
    </PortalLayout>
  );
};

export default PeoplePage;