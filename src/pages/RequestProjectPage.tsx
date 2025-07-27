import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

const RequestProjectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-3xl p-4 pt-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Request a New Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Project Name</label>
            <Input id="name" placeholder="e.g., New Marketing Website" className="mt-1" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">Description</label>
            <Textarea id="description" placeholder="Briefly describe the project goals and requirements." className="mt-1" />
          </div>
           <div>
            <label htmlFor="budget" className="block text-sm font-medium text-muted-foreground">Budget (IDR)</label>
            <Input id="budget" type="number" placeholder="e.g., 50000000" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
            <Button onClick={() => navigate('/')}>Submit Request</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestProjectPage;