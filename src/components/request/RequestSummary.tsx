import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type RequestSummaryProps = {
  formData: any;
  onBack: () => void;
  onSubmit: () => void;
};

export default function RequestSummary({ formData, onBack, onSubmit }: RequestSummaryProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Confirm Your Request</CardTitle>
        <CardDescription>Please review the information below before submitting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold">Subject</h3>
          <p className="text-muted-foreground">{formData.subject}</p>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">Description</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </CardFooter>
    </>
  );
}