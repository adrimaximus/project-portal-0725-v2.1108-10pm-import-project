import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';
import PersonForm from '@/components/people/PersonForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const PeopleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching person:', error);
        toast.error('Failed to load contact details.');
        setPerson(null);
      } else {
        setPerson(data);
      }
      setLoading(false);
    };

    fetchPerson();
  }, [id]);

  const handleSave = async (data: Partial<Person>) => {
    if (!id) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving contact...');

    const { error } = await supabase
      .from('people')
      .update({
        full_name: data.full_name,
        job_title: data.job_title,
        company: data.company,
        contact: data.contact,
        notes: data.notes,
      })
      .eq('id', id);

    setIsSaving(false);
    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Contact saved successfully!', { id: toastId });
      setPerson(prev => ({ ...prev!, ...data }));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!person) {
    return <div>Contact not found.</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/people')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to People
      </Button>
      <PersonForm person={person} onSave={handleSave} isSaving={isSaving} />
    </div>
  );
};

export default PeopleDetailPage;