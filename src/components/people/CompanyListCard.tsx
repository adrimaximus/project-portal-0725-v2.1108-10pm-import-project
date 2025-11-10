import React from 'react';
import { Company } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Building, MapPin } from 'lucide-react';

interface CompanyListCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onViewProfile: (company: Company) => void;
}

const CompanyListCard: React.FC<CompanyListCardProps> = ({ company, onEdit, onDelete, onViewProfile }) => {
  const logoUrl = company.logo_url || (company.custom_properties as any)?.logo_image;

  return (
    <Card onClick={() => onViewProfile(company)} className="cursor-pointer">
      <CardHeader className="flex flex-row items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={logoUrl || ''} alt={company.name} />
            <AvatarFallback className="rounded-md"><Building className="h-5 w-5" /></AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{company.name}</p>
            <p className="text-sm text-muted-foreground">{company.legal_name}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onEdit(company); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onDelete(company); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {company.address && (
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{company.address}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CompanyListCard;