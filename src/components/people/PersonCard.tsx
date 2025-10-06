import React, { useMemo } from 'react';
import { Person as BasePerson } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, User as UserIcon, Briefcase, Mail, Phone } from 'lucide-react';
import { generatePastelColor } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Person = BasePerson & { company_id?: string | null };

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PersonCard = ({ person, onEdit, onDelete, onViewProfile }: PersonCardProps) => {
  const { data: companyProperties = [] } = useQuery({
    queryKey: ['company_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_properties').select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: company } = useQuery({
    queryKey: ['company_details_for_person_card', person.id],
    queryFn: async () => {
      const companyId = person.company_id;
      const companyName = person.company?.trim();

      if (!companyId && !companyName) return null;

      let companyData: { logo_url: string | null; custom_properties: any } | null = null;

      if (companyId) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, custom_properties')
          .eq('id', companyId)
          .single();
        if (!error && data) companyData = data;
      }

      if (!companyData && companyName) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, custom_properties')
          .ilike('name', `%${companyName}%`)
          .limit(1)
          .maybeSingle();
        if (!error && data) companyData = data;
      }
      return companyData;
    },
    enabled: !!person,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const companyLogoUrl = useMemo(() => {
    if (!company) return null;
    const logoProperty = companyProperties.find(p => p.label === 'Logo Image');
    if (logoProperty && company.custom_properties) {
        const customLogo = company.custom_properties[logoProperty.name];
        if (customLogo) return customLogo;
    }
    return company.logo_url;
  }, [company, companyProperties]);

  const emailToDisplay = person.contact?.emails?.[0] || person.email;
  const phoneToDisplay = (person.contact as any)?.phones?.[0] || person.phone;

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      onClick={() => onViewProfile(person)}
    >
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="w-full flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => onEdit(person)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(person)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Avatar className="w-20 h-20 mb-4 -mt-7">
          <AvatarImage src={person.avatar_url} alt={person.full_name} />
          <AvatarFallback style={generatePastelColor(person.id)}>
            <UserIcon className="w-8 h-8 text-white" />
          </AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-lg truncate w-full" title={person.full_name}>{person.full_name}</h3>
        <p className="text-sm text-muted-foreground truncate w-full" title={person.job_title || ''}>{person.job_title || 'No title'}</p>

        <div className="mt-4 pt-4 border-t w-full flex flex-col items-center space-y-2">
          <div className="flex items-center justify-center h-8">
            {companyLogoUrl ? (
              <img src={companyLogoUrl} alt={person.company || 'Company Logo'} className="max-h-8 max-w-full object-contain" />
            ) : person.company ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm truncate" title={person.company}>{person.company}</span>
              </div>
            ) : (
              <div className="h-4" /> // Placeholder to maintain height
            )}
          </div>
          
          <div className="flex space-x-3 text-muted-foreground pt-2">
            {emailToDisplay && (
              <a href={`mailto:${emailToDisplay}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
                <Mail className="h-4 w-4" />
              </a>
            )}
            {phoneToDisplay && (
              <a href={`tel:${phoneToDisplay}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonCard;