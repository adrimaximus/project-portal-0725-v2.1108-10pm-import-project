import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <PortalLayout>
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl mb-4">
          Welcome to Your Goals App
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          This is your main dashboard. Click the button below to start managing your goals and track your progress.
        </p>
        <Button asChild size="lg">
          <Link to="/goals">View My Goals</Link>
        </Button>
      </div>
    </PortalLayout>
  );
};

export default Index;