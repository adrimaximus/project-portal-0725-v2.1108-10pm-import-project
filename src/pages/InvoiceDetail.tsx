import { useParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvoiceDetail = () => {
  const { id } = useParams();
  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details for invoice ID: <strong>{id}</strong></p>
          <p className="mt-4 text-muted-foreground">This is a placeholder page. Full invoice details would be displayed here.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default InvoiceDetail;