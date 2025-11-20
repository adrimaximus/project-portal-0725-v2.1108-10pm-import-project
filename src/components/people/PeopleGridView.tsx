import { Person } from '@/types';
import PersonCard from './PersonCard';
import { useMemo } from 'react';

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
      <div className="text-center py-12 text-muted-foreground">
        <p>No people found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedPeople.map(([company, peopleInGroup]) => (
        <div key={company}>
          <h3 className="text-lg font-semibold mb-4 px-2">{company}</h3>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
            {peopleInGroup.map(person => (
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