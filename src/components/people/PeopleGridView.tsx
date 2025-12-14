import { Person } from '@/types';
import PersonCard from './PersonCard';
import { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";

interface PeopleGridViewProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PeopleGridView = ({ people, onEditPerson, onDeletePerson, onViewProfile }: PeopleGridViewProps) => {
  const groupedPeople = useMemo(() => {
    const groups = people.reduce((acc, person) => {
      const company = person.company || 'Uncategorized';
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

  if (people.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed animate-in fade-in zoom-in-95 duration-300">
        <p>No people found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {groupedPeople.map(([company, peopleInGroup], groupIndex) => (
        <div 
          key={company} 
          className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          style={{ animationDelay: `${groupIndex * 100}ms` }}
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground tracking-tight">{company}</h3>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] h-5 min-w-[20px] flex items-center justify-center">
                {peopleInGroup.length}
              </Badge>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
  );
};

export default PeopleGridView;