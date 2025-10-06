import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building } from 'lucide-react';
import { generatePastelColor } from '@/lib/utils';

type Company = {
  id: string;
  name: string;
  address: string | null;
  logo_url: string | null;
};

interface CompaniesViewProps {
  searchTerm: string;
}

const CompaniesView: React.FC<CompaniesViewProps> = ({ searchTerm }) => {
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, address, logo_url');
      if (error) throw error;
      return data;
    },
  });

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) {
      return companies;
    }
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.address && company.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [companies, searchTerm]);

  return (
    <div className="border rounded-lg overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center h-24">Loading companies...</TableCell>
            </TableRow>
          ) : filteredCompanies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center h-24">No companies found.</TableCell>
            </TableRow>
          ) : (
            filteredCompanies.map(company => (
              <TableRow key={company.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={company.logo_url || undefined} />
                      <AvatarFallback style={generatePastelColor(company.id)}>
                        <Building className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{company.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{company.address || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompaniesView;