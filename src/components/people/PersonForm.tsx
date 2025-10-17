import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import { Person } from '@/types';

interface PersonFormProps {
  person?: Person;
  onSave: (data: Partial<Person>) => void;
  isSaving: boolean;
}

const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    job_title: '',
    company: '',
    contact: { emails: [''], phones: [''] },
    notes: '',
  });

  useEffect(() => {
    if (person) {
      setFormData({
        full_name: person.full_name || '',
        job_title: person.job_title || '',
        company: person.company || '',
        contact: {
          emails: person.contact?.emails?.length ? person.contact.emails : [''],
          phones: person.contact?.phones?.length ? person.contact.phones : [''],
        },
        notes: person.notes || '',
      });
    }
  }, [person]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, emails: [value] },
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, phones: [value] },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" name="job_title" value={formData.job_title} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" value={formData.company} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.contact.emails[0]} onChange={handleEmailChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneNumberInput
              value={formData.contact.phones[0]}
              onChange={handlePhoneChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default PersonForm;