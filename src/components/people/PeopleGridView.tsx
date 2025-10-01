import { useState, useEffect } from 'react';
import { Person } from '@/types';
import PersonCard from './PersonCard';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface PeopleGridViewProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const ITEMS_PER_PAGE = 10;

const PeopleGridView = ({ people, onEditPerson, onDeletePerson, onViewProfile }: PeopleGridViewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(people.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && people.length > 0) {
      setCurrentPage(1);
    }
  }, [people, currentPage, totalPages]);

  const currentPeople = people.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= half + 1) {
        for (let i = 1; i <= maxPagesToShow - 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - half) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers.map((num, index) => (
      <PaginationItem key={index}>
        {typeof num === 'number' ? (
          <PaginationLink href="#" isActive={currentPage === num} onClick={(e) => { e.preventDefault(); handlePageChange(num); }}>
            {num}
          </PaginationLink>
        ) : (
          <PaginationEllipsis />
        )}
      </PaginationItem>
    ));
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {currentPeople.map(person => (
          <PersonCard 
            key={person.id} 
            person={person} 
            onEdit={onEditPerson} 
            onDelete={onDeletePerson} 
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default PeopleGridView;