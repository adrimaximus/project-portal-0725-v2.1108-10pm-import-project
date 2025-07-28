import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RequestPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Request</CardTitle>
          <CardDescription>Use this page to submit new requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Request form will be here. This page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestPage;