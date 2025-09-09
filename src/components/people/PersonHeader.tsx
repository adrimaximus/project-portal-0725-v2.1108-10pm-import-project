import { useState, useEffect } from 'react';
import { Person } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, MoreVertical, Trash2, User as UserIcon, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generatePastelColor } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from 'sonner';

interface PersonHeaderProps {
  person: Person;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const PersonHeader = ({ person, onEdit, onDelete, isAdmin }: PersonHeaderProps) => {
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyAddress, setCompanyAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (person.company) {
        const companyName = person.company.trim();
        if (!companyName) {
          setCompanyLogoUrl(null);
          setCompanyAddress(null);
          return;
        }
        
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, address')
          .ilike('name', companyName)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching company details:', error.message);
          toast.error("Could not fetch company logo.");
        } else if (data) {
          setCompanyLogoUrl(data.logo_url);
          setCompanyAddress(data.address);
        } else {
          setCompanyLogoUrl(null);
          setCompanyAddress(null);
        }
      } else {
        setCompanyLogoUrl(null);
        setCompanyAddress(null);
      }
    };

    fetchCompanyDetails();
  }, [person.company]);

  const googleMapsUrl = companyAddress 
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(companyAddress)}`
    : '#';

  return (
    <Card className="overflow-hidden">
      {/* Banner */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-sky-400 via-rose-400 to-lime-400">
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="absolute top-4 right-4 h-8 w-8 bg-black/20 text-white border-white/50 hover:bg-black/40">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-12 sm:-mt-16">
          {/* Avatar */}
          <div className="relative flex-shrink-0 self-center sm:self-end">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background bg-background">
              <AvatarImage src={person.avatar_url} alt={person.full_name} />
              <AvatarFallback style={generatePastelColor(person.id)} className="text-4xl">
                <UserIcon className="h-12 w-12 text-white" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info and Actions */}
          <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-end w-full mt-4 sm:mt-0">
            {/* Left side: Name, Title, Location, Buttons */}
            <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold">{person.full_name}</h2>
                {companyLogoUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-background p-0.5 rounded-md shadow-sm flex items-center justify-center">
                          <img src={companyLogoUrl} alt={`${person.company} logo`} className="h-8 w-8 object-contain rounded-sm" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View {person.company} on map</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-muted-foreground">{person.job_title || 'No title specified'}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">
                <MapPin className="h-3 w-3" />
                {person.address?.formatted_address || 'No location specified'}
              </p>
              <div className="pt-2 flex gap-2 justify-center sm:justify-start">
                <Button onClick={onEdit}>Edit Profile</Button>
              </div>
            </div>

            {/* Right side: Role & Skills */}
            <div className="space-y-4 text-left sm:text-right mt-4 sm:mt-0 w-full sm:w-auto">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Role</h4>
                <p className="text-sm font-medium">{person.company || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</h4>
                <div className="flex flex-wrap gap-1 justify-start sm:justify-end pt-1">
                  {person.tags && person.tags.length > 0 ? (
                    person.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                    ))
                  ) : <p className="text-xs text-muted-foreground">No skills listed.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonHeader;