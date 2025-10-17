import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('people').select('*').order('full_name');
      if (error) {
        console.error('Error fetching people:', error);
      } else {
        setPeople(data || []);
      }
      setLoading(false);
    };

    fetchPeople();
  }, []);

  if (loading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          {people.length === 0 ? (
            <p>No contacts found.</p>
          ) : (
            <ul className="space-y-4">
              {people.map((person) => (
                <li key={person.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{person.full_name}</h3>
                    <p className="text-sm text-gray-500">{person.job_title || 'No job title'}</p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/people/${person.id}`}>View Details</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PeoplePage;