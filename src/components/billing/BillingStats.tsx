import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, CircleDollarSign, FileText } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BillingStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['billing-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_billing_stats');
      if (error) throw error;
      return data[0];
    }
  });

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp{stats.total_revenue.toLocaleString('id-ID')}</div>
          <p className="text-xs text-muted-foreground">
            +Rp{stats.revenue_this_month.toLocaleString('id-ID')} this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp{stats.total_outstanding.toLocaleString('id-ID')}</div>
          <p className="text-xs text-muted-foreground">
            from {stats.unpaid_invoices} invoices
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp{stats.total_overdue.toLocaleString('id-ID')}</div>
          <p className="text-xs text-muted-foreground">
            from {stats.overdue_invoices} invoices
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Paying Client</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.top_client ? (
            <div className="flex items-center">
              <Avatar className="h-6 w-6">
                <AvatarImage src={getAvatarUrl(stats.top_client.avatar_url) || undefined} alt={stats.top_client.name} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(stats.top_client.id) }}>{stats.top_client.initials}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium ml-2">{stats.top_client.name}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No client data</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Rp{stats.top_client_revenue.toLocaleString('id-ID')} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingStats;