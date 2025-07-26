import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dummyProjects, Project } from "@/data/projects"
import { DollarSign, ListChecks, Clock, TrendingUp } from "lucide-react"

const ProjectStats = () => {
  const projects = dummyProjects;
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed' || p.status === 'Done' || p.status === 'Billed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const totalProjectValue = projects.reduce((acc, p) => acc + p.projectValue, 0);

  const formattedValue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalProjectValue);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Project Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          <p className="text-xs text-muted-foreground">
            from {totalProjects} total projects
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedProjects}</div>
          <p className="text-xs text-muted-foreground">
            out of {totalProjects} projects
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressProjects}</div>
          <p className="text-xs text-muted-foreground">
            projects currently active
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalProjects > 0 ? `${Math.round((completedProjects / totalProjects) * 100)}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            of all projects are complete
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectStats