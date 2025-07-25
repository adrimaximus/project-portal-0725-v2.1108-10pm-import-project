import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const checklistItems = [
  { id: "1", label: "Check for signs of pest infestation or damage caused by pests.", checked: true },
  { id: "2", label: "Verify compliance with safety regulations and recommend any necessary improvements.", checked: true },
  { id: "3", label: "Inspect structural integrity of the building.", checked: false },
  { id: "4", label: "Test electrical systems and lighting.", checked: false },
];

const ProjectChecklist = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Checklist</CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checklistItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3">
              <Checkbox id={`checklist-${item.id}`} checked={item.checked} className="mt-1" />
              <Label htmlFor={`checklist-${item.id}`} className="text-sm font-normal leading-snug">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectChecklist;