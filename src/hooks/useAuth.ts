import { useSession } from '@/contexts/SessionContext';

export const useAuth = () => {
  const { session } = useSession();
  return { user: session?.user || null };
};