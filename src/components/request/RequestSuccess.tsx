import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

type RequestSuccessProps = {
  onReset: () => void;
};

export default function RequestSuccess({ onReset }: RequestSuccessProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Request Submitted</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-8">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-lg font-semibold">Thank you!</p>
        <p className="text-muted-foreground">Your request has been submitted successfully. We will get back to you shortly.</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onReset}>Submit Another Request</Button>
      </CardFooter>
    </>
  );
}