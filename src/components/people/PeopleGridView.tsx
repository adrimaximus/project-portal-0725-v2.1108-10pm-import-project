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
  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [people]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {sortedPeople.map(person => (
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