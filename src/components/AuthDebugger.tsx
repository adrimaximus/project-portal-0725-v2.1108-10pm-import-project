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
      // Environment info
      results.environment = {
        hostname: window.location.hostname,
        origin: window.location.origin,
        isLocalhost: window.location.hostname === 'localhost',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      // 1. Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        exists: !!sessionData.session,
        error: sessionError?.message,
        userEmail: sessionData.session?.user?.email,
        userId: sessionData.session?.user?.id,
        accessToken: sessionData.session?.access_token ? 'present' : 'missing',
      };

      // 2. Check current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      results.user = {
        exists: !!userData.user,
        error: userError?.message,
        email: userData.user?.email,
        id: userData.user?.id,
        emailConfirmed: userData.user?.email_confirmed_at ? 'yes' : 'no',
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
            errorCode: profileError?.code,
            data: profileData,
          };
        } catch (e: any) {
          results.profile = {
            exists: false,
            error: e.message,
          };
        }

        // 4. Test basic table access
        try {
          const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
          
          results.tableAccess = {
            works: !testError,
            error: testError?.message,
            errorCode: testError?.code,
          };
        } catch (e: any) {
          results.tableAccess = {
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
        
        {debugData.environment && (
          <div className="text-sm space-y-2">
            <p><strong>Quick Fix:</strong></p>
            <p>Add this URL to your Supabase Auth settings:</p>
            <code className="bg-gray-200 p-2 rounded block">
              {debugData.environment.origin}/auth/callback
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;