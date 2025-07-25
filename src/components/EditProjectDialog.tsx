import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProjectRequestForm from "./ProjectRequestForm";
import { Edit } from "lucide-react";

// Dummy data for demonstration purposes
const dummyProjectData = {
  projectName: "Existing Website Redesign",
  projectDescription: "We need to refresh our existing corporate website with a new look and feel, focusing on mobile-first design and faster load times.",
  budget: 75000000,
  startDate: new Date("2024-08-01"),
  endDate: new Date("2024-10-31"),
};

const EditProjectDialog = () => {
  const handleSaveChanges = (data: any) => {
    console.log("Saving changes:", data);
    // In a real application, you would call an API to update the project data.
    alert("Project changes saved! (Check console for data)");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>
            Make changes to your project below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ProjectRequestForm
            initialData={dummyProjectData}
            onSubmit={handleSaveChanges}
            isDialog={true}
          >
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </ProjectRequestForm>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;