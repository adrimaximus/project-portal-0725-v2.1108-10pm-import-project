import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Mail, LogIn, UserPlus, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import MasterAdminGuard from '@/components/MasterAdminGuard';

interface AuthLog {
  id: string;
  event_type: string;
  email: string;
  success: boolean;
  error_message?: string;
  user_agent?: string;
  ip_address?: string;
  timestamp: string;
  additional_data?: any;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'login_attempt':
      return <LogIn className="h-4 w-4" />;
    case 'signup_attempt':
      return <UserPlus className="h-4 w-4" />;
    case 'magic_link_sent':
      return <Mail className="h-4 w-4" />;
    case 'logout':
      return <LogOut className="h-4 w-4" />;
    default:
      return <LogIn className="h-4 w-4" />;
  }
};

const AuthLogsPage = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auth_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as AuthLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const successfulLogins = logs.filter(log => log.event_type === 'login_attempt' && log.success).length;
  const failedLogins = logs.filter(log => log.event_type === 'login_attempt' && !log.success).length;
  const signups = logs.filter(log => log.event_type === 'signup_attempt').length;

  return (
    <MasterAdminGuard>
      <PortalLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Authentication Logs</h1>
            <p className="text-muted-foreground">
              Monitor login attempts, signups, and authentication events.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Logins</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{successfulLogins}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{failedLogins}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signups</CardTitle>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{signups}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Authentication Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading logs...</TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No authentication logs found.</TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(log.event_type)}
                            <span className="capitalize">{log.event_type.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.success ? "default" : "destructive"}
                            className={cn(
                              log.success 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {log.ip_address || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                          {log.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </MasterAdminGuard>
  );
};

export default AuthLogsPage;