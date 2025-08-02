import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

const Request = () => {
  return (
    <PortalLayout>
      <div className="flex h-full flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
          <h1 className="text-lg font-semibold md:text-xl">Requests</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Request
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Placeholder Request</CardTitle>
              <CardDescription>This is a placeholder card to demonstrate the layout.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>The content area is now scrollable independently of the sidebar.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Request;