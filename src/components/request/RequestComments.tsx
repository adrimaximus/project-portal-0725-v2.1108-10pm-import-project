import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RequestComments = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Comments will be displayed here.</p>
      </CardContent>
    </Card>
  );
};

export default RequestComments;