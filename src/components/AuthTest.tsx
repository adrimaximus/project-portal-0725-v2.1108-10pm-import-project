import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const AuthTest = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runAuthTest = async () => {
    setIsLoading(true);
    setTestResult('Testing authentication...\n');
    
    try {
      // Test 1: Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      setTestResult(prev => prev + `Session check: ${sessionData.session ? 'SUCCESS' : 'NO SESSION'}\n`);
      
      if (sessionError) {
        setTestResult(prev => prev + `Session error: ${sessionError.message}\n`);
      }
      
      if (sessionData.session) {
        // Test 2: Check user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        setTestResult(prev => prev + `User check: ${userData.user ? 'SUCCESS' : 'NO USER'}\n`);
        
        if (userError) {
          setTestResult(prev => prev + `User error: ${userError.message}\n`);
        }
        
        if (userData.user) {
          // Test 3: Check profile access
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, role')
            .eq('id', userData.user.id)
            .single();
          
          setTestResult(prev => prev + `Profile check: ${profileData ? 'SUCCESS' : 'NO PROFILE'}\n`);
          
          if (profileError) {
            setTestResult(prev => prev + `Profile error: ${profileError.message}\n`);
          } else if (profileData) {
            setTestResult(prev => prev + `Profile data: ${JSON.stringify(profileData, null, 2)}\n`);
          }
        }
      }
      
      setTestResult(prev => prev + '\nTest completed!');
    } catch (error: any) {
      setTestResult(prev => prev + `Unexpected error: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAuthTest} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Run Auth Test'}
        </Button>
        
        {testResult && (
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthTest;