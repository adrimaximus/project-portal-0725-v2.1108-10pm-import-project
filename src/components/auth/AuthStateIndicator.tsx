import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const AuthStateIndicator = () => {
  const { session, user, loading, isImpersonating } = useAuth();

  if (loading) {
    return (
      <Badge variant="secondary" className="fixed top-4 left-4 z-50">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (isImpersonating) {
    return (
      <Badge variant="destructive" className="fixed top-4 left-4 z-50">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Impersonating
      </Badge>
    );
  }

  if (session && user) {
    return (
      <Badge variant="default" className="fixed top-4 left-4 z-50 bg-green-600">
        <CheckCircle className="mr-1 h-3 w-3" />
        Authenticated
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="fixed top-4 left-4 z-50">
      <XCircle className="mr-1 h-3 w-3" />
      Not Authenticated
    </Badge>
  );
};

export default AuthStateIndicator;