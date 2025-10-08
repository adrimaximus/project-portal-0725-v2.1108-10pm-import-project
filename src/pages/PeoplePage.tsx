import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Person } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, LayoutGrid, List, X } from 'lucide-react';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonCard from '@/components/people/PersonCard';
import PersonListCard from '@/components/people/PersonListCard';
import { formatDistanceToNow } from "date-fns";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

export default function PeoplePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [view, setView] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [primaryContact, setPrimaryContact] = useState<Person | null>(null);
  const [secondaryContact, setSecondaryContact] = useState<Person | null>(null);

  const queryClient = useQueryClient();

  const { data: people, isLoading } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data.map((person: any) => ({
        ...person,
        avatar_url: getAvatarUrl(person.avatar_url),
        tags: person.tags ? [...person.tags].sort((a, b) => a.name.localeCompare(b.name)) : [],
      }));
    },
  });

  const { data: duplicates } = useQuery({
    queryKey: ['duplicate-people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('find_duplicate_people');
      if (error) throw error;
      return data;
    }
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase.from('people').delete().eq('id', personId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Person deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const mergeContactsMutation = useMutation({
    mutationFn: async ({ primaryId, secondaryId }: { primaryId: string, secondaryId: string }) => {
      const { error } = await supabase.rpc('merge_contacts', {
        primary_id: primaryId,
        secondary_id: secondaryId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contacts merged successfully.');
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-people'] });
      setIsMergeDialogOpen(false);
      setPrimaryContact(null);
      setSecondaryContact(null);
    },
    onError: (error: any) => {
      toast.error(`Merge failed: ${error.message}`);
    },
  });

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleDelete = (personId: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      deletePersonMutation.mutate(personId);
    }
  };

  const handleMerge = (person1: Person, person2: Person) => {
    setPrimaryContact(person1);
    setSecondaryContact(person2);
    setIsMergeDialogOpen(true);
  };

  const confirmMerge = () => {
    if (primaryContact && secondaryContact) {
      mergeContactsMutation.mutate({ primaryId: primaryContact.id, secondaryId: secondaryContact.id });
    }
  };

  const filteredPeople = people?.filter(person =>
    person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-muted-foreground">Manage your contacts and relationships.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search people..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => { setEditingPerson(null); setIsFormOpen(true); }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Contacts</TabsTrigger>
            <TabsTrigger value="duplicates">
              Duplicates
              {duplicates && duplicates.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{duplicates.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPeople?.map(person => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPeople?.map(person => (
                <PersonListCard key={person.id} person={person} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="duplicates" className="mt-4">
          <div className="space-y-4">
            {duplicates?.map((dup: any, index: number) => (
              <Card key={index} className="p-4">
                <CardHeader>
                  <CardTitle className="text-lg">Potential Duplicate</CardTitle>
                  <CardDescription>Reason: <span className="font-semibold">{dup.reason}</span></CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[dup.person1, dup.person2].map((person, pIndex) => (
                    <div key={pIndex} className="flex items-start gap-4 p-3 border rounded-md">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={person.avatar_url} />
                        <AvatarFallback style={{ backgroundColor: generatePastelColor(person.id) }}>
                          <UserIcon className="h-5 w-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-bold">{person.full_name}</p>
                        <p className="text-muted-foreground">{person.job_title} at {person.company}</p>
                        <p className="text-muted-foreground">{person.contact?.emails?.[0]}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline">Ignore</Button>
                  <Button onClick={() => handleMerge(dup.person1, dup.person2)}>Merge</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PersonFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        person={editingPerson}
      />

      {primaryContact && secondaryContact && (
        <AlertDialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Merge</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to merge these two contacts? The data from the second contact will be merged into the first, and the second contact will be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <p className="font-semibold mb-2">Keep this contact (Primary)</p>
                <div className="flex items-start gap-4 p-3 border rounded-md bg-green-50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={primaryContact.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: generatePastelColor(primaryContact.id) }}>
                      <UserIcon className="h-5 w-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-bold">{primaryContact.full_name}</p>
                    <p className="text-muted-foreground">{primaryContact.job_title}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-2">Merge and delete this contact</p>
                <div className="flex items-start gap-4 p-3 border rounded-md bg-red-50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={secondaryContact.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: generatePastelColor(secondaryContact.id) }}>
                      <UserIcon className="h-5 w-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-bold">{secondaryContact.full_name}</p>
                    <p className="text-muted-foreground">{secondaryContact.job_title}</p>
                  </div>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMerge} disabled={mergeContactsMutation.isPending}>
                {mergeContactsMutation.isPending ? 'Merging...' : 'Confirm Merge'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}