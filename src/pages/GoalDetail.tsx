import PortalLayout from "@/components/PortalLayout";
import { useParams } from 'react-router-dom';

const GoalDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  return (
    <PortalLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Goal Detail: {slug}</h1>
        <p>Detail untuk goal spesifik akan ada di sini.</p>
      </div>
    </PortalLayout>
  );
};

export default GoalDetailPage;