"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { AssignedUser, Project } from "@/data/projects";
import UserMultiSelect from "@/components/UserMultiSelect";
import FileUploader from "@/components/FileUploader";

interface ProjectDetailsFormProps {
  formData: Partial<Project>;
  handleInputChange: (field: keyof Project, value: any) => void;
  allUsers: AssignedUser[];
}

const ProjectDetailsForm = ({ formData, handleInputChange, allUsers }: ProjectDetailsFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            placeholder="Enter project name"
            value={formData.name || ""}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDescription">Description</Label>
          <Textarea
            id="projectDescription"
            placeholder="Enter a brief description of the project"
            value={formData.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <DatePicker
              date={formData.startDate ? new Date(formData.startDate) : undefined}
              onDateChange={(date) => handleInputChange("startDate", date?.toISOString())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <DatePicker
              date={formData.deadline ? new Date(formData.deadline) : undefined}
              onDateChange={(date) => handleInputChange("deadline", date?.toISOString())}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Assign Team</Label>
          <UserMultiSelect
            allUsers={allUsers}
            selectedUsers={formData.assignedTo || []}
            onSelectedUsersChange={(users) => handleInputChange("assignedTo", users)}
          />
        </div>

        <div className="space-y-2">
          <Label>Attachments</Label>
          <FileUploader
            onFilesChange={(files) => handleInputChange("briefFiles", files)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsForm;