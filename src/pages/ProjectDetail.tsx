import PortalLayout from "@/components/PortalLayout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProjectDetail = () => {
    const { id } = useParams();
    return (
        <PortalLayout>
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Project Detail</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Details for project ID: {id}</p>
                        <p className="mt-4 text-muted-foreground">This is a placeholder page for project details. Content will be added later.</p>
                    </CardContent>
                </Card>
            </div>
        </PortalLayout>
    )
}

export default ProjectDetail;