import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/data/services";
import { Button } from "../ui/button";

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This form is under construction.</p>
        <p>Selected Services: {selectedServices.map(s => s.title).join(', ')}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">Back</Button>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsForm;