import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const AuthTest = () => {
  const [testResults, setTestResults] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runAuthTest = async () => {
    setIsRunning(true);
    let results = 'Running authentication tests...\n\n';

    try {
      // Test 1: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      results += `1. Session Check: ${session ? 'PASS' : 'FAIL'}\n`;
      if (sessionError) results += `   Error: ${sessionError.message}\n`;
      
      // Test 2: Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      results += `2. User Check: ${user ? 'PASS' : 'FAIL'}\n`;
      if (userError) results += `   Error: ${userError.message}\n`;
      
      // Test 3: Test database access
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        results += `3. Database Access: ${profileData ? 'PASS' : 'FAIL'}\n`;
        if (profileError) results += `   Error: ${profileError.message}\n`;
      } else {
        results += `3. Database Access: SKIPPED (no user)\n`;
      }

      setTestResults(results);
    } catch (error: any) {
      setTestResults(results + `\nUnexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAuthTest} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run Auth Test'}
        </Button>
        
        {testResults && (
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-xs whitespace-pre-wrap">{testResults}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthTest;