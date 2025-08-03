import { useParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GoalDetail = () => {
  const { id } = useParams();
  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>Goal Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details for goal ID: <strong>{id}</strong></p>
          <p className="mt-4 text-muted-foreground">This is a placeholder page. Full goal details would be displayed here.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default GoalDetail;