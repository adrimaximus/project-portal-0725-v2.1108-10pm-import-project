import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person as BasePerson } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, generatePastelColor, formatInJakarta, formatPhoneNumberForApi, getAvatarUrl } from '@/lib/utils';
import { User as UserIcon, Mail, MoreHorizontal, Edit, Trash2, Instagram, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import WhatsappIcon from '../icons/WhatsappIcon';
import { useQuery } from '@tanstack/react-query';

type Person = BasePerson & { company_id?: string | null };

const PeopleKanbanCard = ({ person, dragHappened, onEdit, onDelete }: { person: Person, dragHappened: React.MutableRefObject<boolean>, onEdit: (person: Person) => void, onDelete: (person: Person) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: person.id });
  const navigate = useNavigate();

  const { data: companyProperties = [] } = useQuery({
    queryKey: ['custom_properties', 'company'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'company');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { data: company } = useQuery({
    queryKey: ['company_details_for_kanban_card', person.id],
    queryFn: async () => {
      const companyId = person.company_id;
      const companyName = person.company?.trim();

      if (!companyId && !companyName) {
        return null;
      }

      let companyData: { logo_url: string | null; address: string | null; custom_properties: any } | null = null;

      if (companyId) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, address, custom_properties')
          .eq('id', companyId)
          .single();
        if (!error && data) {
          companyData = data;
        }
      }

      if (!companyData && companyName) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, address, custom_properties')
          .ilike('name', `%${companyName}%`)
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          companyData = data;
        }
      }
      return companyData;
    },
    enabled: !!person,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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

  const companyAddress = company?.address;
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : undefined,
  };

  const handleClick = () => {
    if (!dragHappened.current) {
      navigate(`/people/${person.id}`);
    }
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (email) {
      navigator.clipboard.writeText(email);
      toast.success('Email address copied!');
    }
  };

  const emailToDisplay = person.contact?.emails?.[0] || person.email;
  const phoneToDisplay = (person.contact as any)?.phones?.[0] || person.phone;
  const googleMapsUrl = companyAddress 
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(companyAddress)}`
    : '#';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-3 space-y-2">
          {/* Top Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(person.avatar_url, person.id)} />
                <AvatarFallback style={generatePastelColor(person.id)}>
                  <UserIcon className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm leading-snug truncate">{person.full_name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {person.updated_at ? `Updated ${formatInJakarta(person.updated_at, 'MMM d')}` : ''}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onEdit(person); }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onDelete(person); }} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <hr />

          {/* Bottom Section */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 min-w-0">
              {companyLogoUrl ? (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-background p-0.5 rounded-md shadow-sm flex items-center justify-center flex-shrink-0"
                  title={`Get directions to ${person.company}`}
                >
                  <img src={companyLogoUrl} alt={`${person.company} logo`} className="h-6 w-6 object-contain rounded-sm" />
                </a>
              ) : person.company ? (
                <div className="h-6 w-6 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                </div>
              ) : (
                <div className="h-6 w-6 flex-shrink-0" /> /* Placeholder */
              )}
              {person.company && (
                <span className="text-xs font-medium text-muted-foreground truncate">{person.company}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {emailToDisplay && (
                <button onClick={(e) => handleCopyEmail(e, emailToDisplay)} className="text-muted-foreground hover:text-primary transition-colors" title="Copy email address">
                  <Mail className="h-3.5 w-3.5" />
                </button>
              )}
              {phoneToDisplay && (
                <a href={`https://wa.me/${formatPhoneNumberForApi(phoneToDisplay)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                  <WhatsappIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {person.social_media?.instagram && (
                <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeopleKanbanCard;