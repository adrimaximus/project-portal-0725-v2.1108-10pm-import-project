import { useState, useEffect, useMemo } from 'react';
import { Person as BasePerson } from '@/types';
import { Card } from '@/components/ui/card';
import { User as UserIcon, Instagram, Briefcase, Mail } from 'lucide-react';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import WhatsappIcon from '../icons/WhatsappIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

type Person = BasePerson & { company_id?: string | null };

interface PersonCardProps {
  person: Person;
  onViewProfile: (person: Person) => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

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

const PersonCard = ({ person, onViewProfile }: PersonCardProps) => {
  const [imageError, setImageError] = useState(false);

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
    queryKey: ['company_details_for_person_card', person.id],
    queryFn: async () => {
      const companyId = person.company_id;
      const companyNameFromField = person.company?.trim();
      const companyNameFromJob = person.job_title?.includes(' at ') ? person.job_title.split(' at ')[1].trim() : null;
      const companyToSearch = companyNameFromField || companyNameFromJob;

      if (!companyId && !companyToSearch) {
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

      if (!companyData && companyToSearch) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, address, custom_properties')
          .ilike('name', `%${companyToSearch}%`)
          .limit(1)
          .maybeSingle();
        
        if (error) {
            console.warn(`Could not fetch company by name for person ${person.id}:`, error.message);
        } else if (data) {
            companyData = data;
        }
      }
      return companyData;
    },
    enabled: !!person,
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

  useEffect(() => {
    setImageError(false);
  }, [person.avatar_url]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (email) {
      navigator.clipboard.writeText(email);
      toast.success('Email address copied!');
    }
  };

  const googleMapsUrl = companyAddress 
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(companyAddress)}`
    : '#';

  const emailToDisplay = person.contact?.emails?.[0] || person.email;
  const phoneToDisplay = (person.contact as any)?.phones?.[0] || person.phone;

  return (
    <Card 
      className="group h-full flex flex-col transition-shadow hover-shadow-lg cursor-pointer rounded-2xl" 
      onClick={() => onViewProfile(person)}
    >
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          {!imageError ? (
            <img
              src={getAvatarUrl(person.avatar_url, person.id)}
              alt={person.full_name}
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={generatePastelColor(person.id)}>
              <UserIcon className="h-16 w-16 text-white/50" />
            </div>
          )}
        </div>
        {companyLogoUrl && (
          companyAddress ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute -bottom-6 left-4 bg-background p-0.5 rounded-lg shadow-md flex items-center justify-center"
              title={`Get directions to ${person.company}`}
            >
              <img
                src={companyLogoUrl}
                alt={`${person.company} logo`}
                className="h-10 w-10 object-contain rounded-md"
              />
            </a>
          ) : (
            <div className="absolute -bottom-6 left-4 bg-background p-0.5 rounded-lg shadow-md flex items-center justify-center">
              <img
                src={companyLogoUrl}
                alt={`${person.company} logo`}
                className="h-10 w-10 object-contain rounded-md"
              />
            </div>
          )
        )}
      </div>
      <div className="p-3 border-t bg-background flex-grow flex flex-col rounded-b-2xl">
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-3">
            {person.social_media?.instagram && (
              <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {emailToDisplay && (
              <button
                onClick={(e) => handleCopyEmail(e, emailToDisplay)}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Copy email address"
              >
                <Mail className="h-4 w-4" />
              </button>
            )}
            {phoneToDisplay && (
              <a href={`https://wa.me/${formatPhoneNumberForWhatsApp(phoneToDisplay)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
                <WhatsappIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        
        <div className={`min-w-0 ${companyLogoUrl ? 'pt-2' : ''}`}>
          <h3 className="font-bold text-sm truncate">{person.full_name}</h3>
        </div>
        
        {(person.company || person.job_title) && (
          <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <p>
              {person.job_title}
              {person.job_title && person.company && ' at '}
              {!person.job_title && person.company && 'at '}
              {person.company}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PersonCard;