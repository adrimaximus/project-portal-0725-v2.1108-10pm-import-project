import React, { useState, useMemo, useEffect } from 'react';
import { Person, Tag } from '@/types';
import { useNavigate } from 'react-router-dom';
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, User as UserIcon, GitMerge, Loader2, ArrowUpDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DuplicatePair } from "@/components/people/DuplicateContactsCard";
import DuplicateSummaryDialog from "@/components/people/DuplicateSummaryDialog";
import MergeDialog from "@/components/people/MergeDialog";
import { PeopleDataTable } from '@/components/people/PeopleDataTable';
import { ColumnDef } from '@tanstack/react-table';
import { ColumnToggle } from '@/components/people/ColumnToggle';
import { Badge } from '@/components/ui/badge';

const EditableCell = ({ getValue, row: { index }, column: { id }, table }: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    if (value !== initialValue) {
      table.options.meta?.updateData(index, id, value);
    }
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      value={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      className="border-none focus-visible:ring-1 h-9"
    />
  );
};

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Full Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: EditableCell,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: EditableCell,
  },
  {
    accessorKey: 'phone',
    header: 'Phone Number',
    cell: EditableCell,
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.getValue('tags') as Tag[] || [];
      return (
        <div className="flex flex-wrap gap-1 px-3">
          {tags.map(tag => (
            <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
              {tag.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: EditableCell,
  },
  {
    accessorKey: 'website',
    header: 'Website',
    cell: EditableCell,
  },
  {
    accessorKey: 'job_title',
    header: 'Job Title',
    cell: EditableCell,
  },
];

const PeoplePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const queryClient = useQueryClient();
  const [isFindingDuplicates, setIsFindingDuplicates] = useState(false);
  const [duplicateData, setDuplicateData] = useState<{ summary: string; pairs: DuplicatePair[] } | null>(null);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [selectedMergePair, setSelectedMergePair] = useState<DuplicatePair | null>(null);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data as Person[];
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
    const { data: aiData, error: aiError } = await supabase.functions.invoke('openai-generator', {
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

  const filteredPeople = useMemo(() => {
    return people.filter(person =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.job_title && person.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [people, searchTerm]);

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
            {/* The ColumnToggle will be part of the DataTable component */}
        </div>

        <div className="flex-grow min-h-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <PeopleDataTable columns={columns} data={filteredPeople} />
          )}
        </div>
      </div>

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
            <AlertDialogAction>Delete</AlertDialogAction>
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