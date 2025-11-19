import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
}

interface CompanySelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const CompanySelector = ({ value, onChange }: CompanySelectorProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('companies').insert({ name }).select('id, name').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onChange(newCompany.id);
      toast.success(`Company "${newCompany.name}" created.`);
      setOpen(false);
      setSearch('');
    },
    onError: (error: any) => {
      toast.error('Failed to create company.', { description: error.message });
    },
  });

  const handleCreateCompany = () => {
    if (search.trim() && !companies.some(c => c.name.toLowerCase() === search.trim().toLowerCase())) {
      createCompanyMutation.mutate(search.trim());
    }
  };

  const selectedCompany = companies.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedCompany ? selectedCompany.name : "Select company..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search or create company..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm">Loading...</div>
            ) : (
              <>
                <CommandEmpty>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCreateCompany}
                    disabled={createCompanyMutation.isPending || !search.trim()}
                  >
                    {createCompanyMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    Create "{search}"
                  </Button>
                </CommandEmpty>
                <CommandGroup>
                  {companies.map((company) => (
                    <CommandItem
                      key={company.id}
                      value={company.name}
                      onSelect={() => {
                        onChange(company.id === value ? null : company.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${value === company.id ? "opacity-100" : "opacity-0"}`}
                      />
                      {company.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CompanySelector;