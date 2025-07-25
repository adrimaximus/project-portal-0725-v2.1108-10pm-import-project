import React from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <PortalLayout>
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to your Portal</h1>
            <p className="text-muted-foreground">
                Manage your projects and requests from here.
            </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Project</CardTitle>
                    <CardDescription>Start a new project request by selecting the services you need.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/request">
                            New Request <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>View Existing Project</CardTitle>
                    <CardDescription>Check the details and status of an ongoing project.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline">
                        <Link to="/project-detail">
                            View Project <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;