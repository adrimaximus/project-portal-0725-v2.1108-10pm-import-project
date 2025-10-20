import { useState, useMemo } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, GitMerge, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Person } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PeopleFormDialog from "@/components/people/PeopleFormDialog";
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import PeopleListView from '@/components/people/PeopleListView';
import { DuplicatePair } from "@/components/people/DuplicateContactsCard";
import DuplicateSummaryDialog from '@/components/people/DuplicateSummaryDialog';
import MergeDialog from '@/components/people/MergeDialog';

const PeoplePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<DuplicatePair | null>(null);

  const { data: people = [], isLoading: isLoadingPeople } = useQuery<Person[]>({
    queryKey: ['people', 'with-slug'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data;
    }
  });

  const { data: duplicates = [], refetch: refetchDuplicates } = useQuery<DuplicatePair[]>({
    queryKey: ['duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('find_duplicate_people');
      if (error) throw error;
      return data;
    },
    enabled: people.length > 0,
  });

  const filteredPeople = useMemo(() => {
    if (!searchTerm) return people;
    const lowercasedFilter = searchTerm.toLowerCase();
    return people.filter(person =>
      person.full_name.toLowerCase().includes(lowercasedFilter) ||
      (person.company && person.company.toLowerCase().includes(lowercasedFilter)) ||
      (person.job_title && person.job_title.toLowerCase().includes(lowercasedFilter)) ||
      (person.contact?.emails && person.contact.emails.some(e => e.toLowerCase().includes(lowercasedFilter)))
    );
  }, [people, searchTerm]);

  const handleAddNew = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    const { error } = await supabase.from('people').delete().eq('id', personToDelete.id);
    if (error) {
      toast.error(`Failed to delete ${personToDelete.full_name}.`);
    } else {
      toast.success(`${personToDelete.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people', 'with-slug'] });
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    }
    setPersonToDelete(null);
  };

  const handleAnalyzeDuplicates = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-duplicates', {
        body: { duplicates },
      });
      if (error) throw error;
      setAnalysisSummary(data.result);
      setIsSummaryOpen(true);
    } catch (error: any) {
      toast.error("Failed to analyze duplicates.", { description: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPairFromSummary = (pair: DuplicatePair) => {
    setIsSummaryOpen(false);
    setSelectedPair(pair);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbPage>People</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">People</h1>
            <p className="text-muted-foreground">Manage your contacts and connections.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Person
          </Button>
        </div>

        {duplicates && duplicates.length > 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-amber-900">Potential Duplicates Found</CardTitle>
                <CardDescription className="text-amber-700">
                  We found {duplicates.length} potential duplicate contact{duplicates.length > 1 ? 's' : ''}.
                </CardDescription>
              </div>
              <Button onClick={handleAnalyzeDuplicates} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitMerge className="mr-2 h-4 w-4" />}
                Review with AI
              </Button>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Contacts</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search contacts..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPeople ? (
              <div className="text-center p-8">Loading...</div>
            ) : (
              <PeopleListView
                people={filteredPeople}
                onEditPerson={handleEdit}
                onDeletePerson={setPersonToDelete}
                onViewProfile={(person) => navigate(`/people/${person.slug}`)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <PeopleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={personToEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['people', 'with-slug'] });
          refetchDuplicates();
        }}
      />

      <AlertDialog open={!!personToDelete} onOpenChange={(open) => !open && setPersonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {personToDelete?.full_name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DuplicateSummaryDialog
        open={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        summary={analysisSummary}
        duplicates={duplicates}
        onSelectPair={handleSelectPairFromSummary}
      />

      {selectedPair && (
        <MergeDialog
          open={!!selectedPair}
          onOpenChange={() => setSelectedPair(null)}
          person1={selectedPair.person1}
          person2={selectedPair.person2}
        />
      )}
    </PortalLayout>
  );
};

export default PeoplePage;