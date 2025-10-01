import { useMemo } from 'react';
import { Person } from '@/types';
import PersonCard from './PersonCard';
import { format } from 'date-fns';

interface PeopleGridViewProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PeopleGridView = ({ people, onEditPerson, onDeletePerson, onViewProfile }: PeopleGridViewProps) => {
  const groupedPeople = useMemo(() => {
    return people.reduce((acc, person) => {
      const monthKey = format(new Date(person.created_at), 'MMMM yyyy');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(person);
      return acc;
    }, {} as Record<string, Person[]>);
  }, [people]);

  const sortedMonths = useMemo(() => {
    return Object.keys(groupedPeople).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedPeople]);

  if (people.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No people found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedMonths.map(month => (
        <div key={month}>
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">{month}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {groupedPeople[month].map(person => (
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