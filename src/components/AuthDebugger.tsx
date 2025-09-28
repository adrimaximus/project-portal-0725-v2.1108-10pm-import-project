import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const AuthDebugger = () => {
  const [debugData, setDebugData] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const results: any = {};

    try {
      // 1. Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        exists: !!sessionData.session,
        error: sessionError?.message,
        userEmail: sessionData.session?.user?.email,
        userId: sessionData.session?.user?.id,
      };

      // 2. Check current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      results.user = {
        exists: !!userData.user,
        error: userError?.message,
        email: userData.user?.email,
        id: userData.user?.id,
      };

      // 3. Try to fetch profile if user exists
      if (userData.user) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .single();
          
          results.profile = {
            exists: !!profileData,
            error: profileError?.message,
            data: profileData,
          };
        } catch (e: any) {
          results.profile = {
            exists: false,
            error: e.message,
          };
        }

        // 4. Try the RPC function
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_user_profile_with_permissions', { p_user_id: userData.user.id })
            .single();
          
          results.rpcFunction = {
            works: !!rpcData,
            error: rpcError?.message,
            data: rpcData,
          };
        } catch (e: any) {
          results.rpcFunction = {
            works: false,
            error: e.message,
          };
        }

        // 5. Test navigation items access
        try {
          const { data: navData, error: navError } = await supabase
            .from('user_navigation_items')
            .select('id, name')
            .eq('user_id', userData.user.id)
            .limit(1);
          
          results.navigationAccess = {
            works: !navError,
            error: navError?.message,
            count: navData?.length || 0,
          };
        } catch (e: any) {
          results.navigationAccess = {
            works: false,
            error: e.message,
          };
        }
      }

      setDebugData(results);
    } catch (error: any) {
      results.generalError = error.message;
      setDebugData(results);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isChecking}>
          {isChecking ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
        
        <div className="bg-gray-100 p-4 rounded-md">
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;