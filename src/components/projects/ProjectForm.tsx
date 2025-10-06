import { useState, useEffect } from 'react';
import { Project, PAYMENT_STATUS_OPTIONS } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectFormData = Omit<Partial<Project>, 'start_date' | 'due_date'> & {
  start_date?: Date;
  due_date?: Date;
};

interface ProjectFormProps {
  onSave: (project: Partial<Project>) => void;
  onCancel: () => void;
  initialData?: Partial<Project> | null;
}

const getInitialFormData = (initialData?: Partial<Project> | null): ProjectFormData => {
  return {
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    status: initialData?.status || 'On Track',
    budget: initialData?.budget || 0,
    payment_status: initialData?.payment_status || 'Unpaid',
    start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
    due_date: initialData?.due_date ? new Date(initialData.due_date) : undefined,
  };
};

const ProjectForm = ({ onSave, onCancel, initialData }: ProjectFormProps) => {
  const [formData, setFormData] = useState<ProjectFormData>(getInitialFormData(initialData));

  useEffect(() => {
    setFormData(getInitialFormData(initialData));
  }, [initialData]);

  const handleChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      start_date: formData.start_date?.toISOString(),
      due_date: formData.due_date?.toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Website Redesign"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Briefly describe the project"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g., Marketing"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'On Track'}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="On Track">On Track</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Off Track">Off Track</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budget">Budget (Rp)</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget || ''}
            onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 50000000"
          />
        </div>
        <div>
          <Label htmlFor="payment_status">Payment Status</Label>
          <Select
            value={formData.payment_status || 'Unpaid'}
            onValueChange={(value) => handleChange('payment_status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment status" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <DatePicker
            date={formData.start_date}
            onDateChange={(date) => handleChange('start_date', date)}
          />
        </div>
        <div>
          <Label>Due Date</Label>
          <DatePicker
            date={formData.due_date}
            onDateChange={(date) => handleChange('due_date', date)}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Project</Button>
      </div>
    </form>
  );
};

export default ProjectForm;