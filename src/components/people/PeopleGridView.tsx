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
  const sortedAndGroupedPeople = useMemo(() => {
    const groupedByCompany = people.reduce((acc, person) => {
      const companyName = person.company || 'Uncategorized';
      if (!acc[companyName]) {
        acc[companyName] = [];
      }
      acc[companyName].push(person);
      return acc;
    }, {} as Record<string, Person[]>);

    const sortedCompanies = Object.keys(groupedByCompany).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });

    return sortedCompanies.flatMap(companyName => 
      groupedByCompany[companyName].sort((a, b) => a.full_name.localeCompare(b.full_name))
    );
  }, [people]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {sortedAndGroupedPeople.map(person => (
        <PersonCard 
          key={person.id} 
          person={person} 
          onEdit={onEditPerson} 
          onDelete={onDeletePerson} 
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
};

export default PeopleGridView;