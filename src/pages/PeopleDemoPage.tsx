import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';
import PersonCard from '@/components/people/PersonCard';
import { UpsertPersonSheet } from '@/components/people/UpsertPersonSheet';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PeopleDemoPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const { data: people, isLoading, error } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { mutate: deletePerson } = useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase.from('people').delete().eq('id', personId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Person deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
    onError: (error) => {
      toast.error(`Error deleting person: ${error.message}`);
    },
  });

  const handleNewPerson = () => {
    setSelectedPerson(null);
    setSheetOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setSheetOpen(true);
  };

  const handleDeletePerson = (person: Person) => {
    if (window.confirm(`Are you sure you want to delete ${person.full_name}?`)) {
      if (person.id) {
        deletePerson(person.id);
      }
    }
  };

  const handleViewProfile = (person: Person) => {
    console.log('Viewing profile for:', person.full_name);
    toast.info(`Viewing profile for: ${person.full_name}`);
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">People</h1>
        <Button onClick={handleNewPerson}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Person
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {people?.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onViewProfile={handleViewProfile}
            onEdit={handleEditPerson}
            onDelete={handleDeletePerson}
          />
        ))}
      </div>

      <UpsertPersonSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        person={selectedPerson}
        onSave={() => {
          // Invalidation is handled by the sheet's mutation
        }}
      />
    </div>
  );
}