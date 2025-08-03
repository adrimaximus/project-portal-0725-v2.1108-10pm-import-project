import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const FeatureSettingsPage = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const { features } = useFeatures();

  const feature = features.find(f => f.id === featureId);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{feature ? feature.name : 'Feature'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {feature ? `${feature.name} Settings` : 'Feature Settings'}
          </h1>
          <p className="text-muted-foreground">
            {feature ? feature.description : 'Manage settings for this feature.'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Under Development</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <Construction className="h-12 w-12 mb-4" />
              <p className="text-lg font-semibold">This page is currently under development.</p>
              <p>Advanced settings for "{feature?.name}" will be available here soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default FeatureSettingsPage;