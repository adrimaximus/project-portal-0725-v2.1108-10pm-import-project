import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const RecentProjectsWidget = ({ projects }: { projects: any[] }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Recent Projects
        </CardTitle>
        <Button asChild variant="link" className="text-sm">
          <Link to="/projects">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent projects found.</p>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between">
                <div>
                  <Link to={`/projects/${project.slug}`} className="font-medium hover:underline">
                    {project.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{project.category}</p>
                </div>
                <div className="text-sm font-medium">{project.status}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentProjectsWidget;