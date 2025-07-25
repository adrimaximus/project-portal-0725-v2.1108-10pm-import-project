import PortalLayout from "@/components/PortalLayout";
import RequestCard from "@/components/RequestCard";
import { Button } from "@/components/ui/button";
import { dummyRequests } from "@/data/requests";
import { PlusCircle } from "lucide-react";

const RequestsPage = () => {
  return (
    <PortalLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
        {dummyRequests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </PortalLayout>
  );
};

export default RequestsPage;