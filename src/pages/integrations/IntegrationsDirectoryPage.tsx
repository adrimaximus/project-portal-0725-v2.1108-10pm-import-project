import PortalLayout from "@/components/PortalLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const IntegrationsDirectoryPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Connect your tools to enhance your workflow.</p>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/settings/integrations/openai" className="block">
            <Card className="hover:border-primary/80 transition-colors h-full">
              <CardHeader>
                <CardTitle>OpenAI</CardTitle>
                <CardDescription>Leverage AI models for coaching and content generation.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-primary">
                  Configure <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};

export default IntegrationsDirectoryPage;