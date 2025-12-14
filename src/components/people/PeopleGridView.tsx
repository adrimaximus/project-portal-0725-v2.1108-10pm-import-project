import { Person } from '@/types';
import PersonCard from './PersonCard';
import { useMemo, useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PeopleGridViewProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
  isSearching?: boolean;
}

const PeopleGridView = ({ people, onEditPerson, onDeletePerson, onViewProfile, isSearching = false }: PeopleGridViewProps) => {
  const [activeRange, setActiveRange] = useState("All");

  // Automatically reset to "All" when searching to ensure results from all ranges are visible
  useEffect(() => {
    if (isSearching) {
      setActiveRange("All");
    }
  }, [isSearching]);

  const groupedPeople = useMemo(() => {
    const groups = people.reduce((acc, person) => {
      // Normalize company name by trimming whitespace
      const companyRaw = person.company || 'Uncategorized';
      const company = companyRaw.trim();
      
      if (!acc[company]) {
        acc[company] = [];
      }
      acc[company].push(person);
      return acc;
    }, {} as Record<string, Person[]>);

    // Sort people within each group
    for (const company in groups) {
      groups[company].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    // Sort groups by company name, with 'Uncategorized' last
    return Object.entries(groups).sort(([companyA], [companyB]) => {
      if (companyA === 'Uncategorized') return 1;
      if (companyB === 'Uncategorized') return -1;
      return companyA.localeCompare(companyB);
    });
  }, [people]);

  const ranges = ["All", "A-E", "F-J", "K-O", "P-T", "U-Z", "#"];

  const filteredGroups = useMemo(() => {
    if (activeRange === "All") return groupedPeople;

    return groupedPeople.filter(([company]) => {
      const normalizedCompany = company === 'Uncategorized' ? '#' : company;
      const firstChar = normalizedCompany.charAt(0).toUpperCase();
      
      if (activeRange === "#") {
        return !/^[A-Z]/.test(firstChar);
      }

      const [start, end] = activeRange.split("-");
      return firstChar >= start && firstChar <= end;
    });
  }, [groupedPeople, activeRange]);

  if (people.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed animate-in fade-in zoom-in-95 duration-300">
        <p>No people found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mx-4 px-4 border-b">
        <ToggleGroup 
          type="single" 
          value={activeRange} 
          onValueChange={(value) => value && setActiveRange(value)}
          className="justify-start sm:justify-center overflow-x-auto w-full"
        >
          {ranges.map((range) => (
            <ToggleGroupItem key={range} value={range} className="px-3 h-8 text-xs sm:text-sm whitespace-nowrap">
              {range}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed animate-in fade-in zoom-in-95 duration-300">
          <p>No companies found in range {activeRange}.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredGroups.map(([company, peopleInGroup], groupIndex) => (
            <div 
              key={company} 
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              style={{ animationDelay: `${groupIndex * 50}ms` }}
            >
              <div className="flex items-center gap-3 text-muted-foreground px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">{company}</h3>
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] h-5 min-w-[20px] flex items-center justify-center bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20">
                    {peopleInGroup.length}
                  </Badge>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
                {peopleInGroup.map((person) => (
                  <PersonCard 
                    key={person.id} 
                    person={person} 
                    onEdit={onEditPerson} 
                    onDelete={onDeletePerson} 
                    onViewProfile={onViewProfile}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleGridView;