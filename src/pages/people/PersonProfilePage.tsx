import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { usePerson } from '@/hooks/usePerson';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import { Person, ContactProperty } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonHeader from '@/components/people/PersonHeader';
import PersonDetailsTab from '@/components/people/PersonDetailsTab';
import PersonProjectsTab from '@/components/people/PersonProjectsTab';
import PersonNotesTab from '@/components/people/PersonNotesTab';
import AssociatedUserCard from '@/components/people/AssociatedUserCard';

const PersonProfileSkeleton = () => (
  <PortalLayout>
    <Skeleton className="h-8 w-32 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </PortalLayout>
);

const PersonProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: person, isLoading, error } = usePerson(id!);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: customProperties = [] } = useQuery({
    queryKey: ['contact_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_properties').select('*').eq('is_default', false);
      if (error) throw error;
      return data as ContactProperty[];
    }
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master admin';

  const handleDelete = async () => {
    if (!person) return;

    setIsDeleteDialogOpen(false);
    await queryClient.cancelQueries({ queryKey: ['people'] });
    const previousPeople = queryClient.getQueryData<Person[]>(['people']);
    queryClient.setQueryData<Person[]>(['people'], (old) =>
      old ? old.filter((p) => p.id !== person.id) : []
    );
    navigate('/people');

    const { error } = await supabase.from('people').delete().eq('id', person.id);

    if (error) {
      queryClient.setQueryData(['people'], previousPeople);
      toast.error(`Failed to delete ${person.full_name}.`);
    } else {
      toast.success(`${person.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
  };

  if (isLoading) return <PersonProfileSkeleton />;

  if (error || !person) {
    toast.error("Could not load person's profile.");
    navigate('/people');
    return null;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/people')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>

        <PersonHeader
          person={person}
          isAdmin={isAdmin}
          onEdit={() => setIsFormOpen(true)}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <PersonDetailsTab person={person} customProperties={customProperties} />
              </TabsContent>
              <TabsContent value="projects" className="mt-4">
                <PersonProjectsTab projects={person.projects} />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <PersonNotesTab notes={person.notes} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="lg:col-span-1 space-y-6">
            {person.user_id && <AssociatedUserCard userId={person.user_id} />}
          </div>
        </div>
      </div>
      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={person}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for {person?.full_name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default PersonProfilePage;