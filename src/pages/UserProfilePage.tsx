import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';

const findPersonSlugForUser = async (userId: string): Promise<{ personSlug: string | null }> => {
  const { data, error } = await supabase
    .from('people')
    .select('slug')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error finding person profile for user:', error);
    throw new Error(error.message);
  }
  
  return { personSlug: data?.slug || null };
};

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['personSlugForUser', id],
    queryFn: () => findPersonSlugForUser(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!isLoading) {
      if (isError) {
        toast.error("Could not look up user profile.");
        navigate('/people', { replace: true });
      } else if (data?.personSlug) {
        navigate(`/people/${data.personSlug}`, { replace: true });
      } else {
        toast.info("This user does not have a detailed contact profile.");
        navigate('/people', { replace: true });
      }
    }
  }, [isLoading, isError, data, navigate, id]);

  return <LoadingScreen />;
};

export default UserProfilePage;