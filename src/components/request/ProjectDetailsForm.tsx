import { useState } from 'react';
import { Project, dummyProjects } from '@/data/projects';
import { Service } from '@/data/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProjectDetailsFormProps {
    selectedServices: Service[];
    onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleSubmit = () => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
      services: selectedServices.map(s => s.title),
      status: 'Requested',
      paymentStatus: 'proposed',
      progress: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      paymentDueDate: '',
      startDate: new Date().toISOString().split('T')[0],
      budget: 0,
      createdBy: { id: 'user-new', name: 'New Client', email: 'new@client.com' }, // placeholder
      assignedTo: [],
      tasks: [],
      comments: [],
    };
    dummyProjects.push(newProject);
    alert('Project request submitted!');
    // Here you would typically navigate away or show a success state
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Project Details</h2>
        <p className="text-muted-foreground">Provide more details for your project request.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="projectName">Project Name</Label>
          <Input 
            id="projectName" 
            placeholder="e.g., New Marketing Website"
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
          />
        </div>
        <div>
          <Label htmlFor="projectDescription">Project Description</Label>
          <Textarea 
            id="projectDescription" 
            placeholder="Describe your project goals, target audience, and key features."
            value={projectDescription} 
            onChange={(e) => setProjectDescription(e.target.value)} 
          />
        </div>
        <div>
            <p className="text-sm font-medium">Selected Services</p>
            <p className="text-sm text-muted-foreground">{selectedServices.map(s => s.title).join(', ')}</p>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit} disabled={!projectName || !projectDescription}>Submit Request</Button>
      </div>
    </div>
  );
};

export default ProjectDetailsForm;