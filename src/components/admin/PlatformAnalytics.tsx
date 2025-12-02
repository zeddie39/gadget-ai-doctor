import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Camera, MessageCircle, Battery, Package, AlertTriangle, Users } from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  totalDiagnoses: number;
  totalChats: number;
  totalBatteryReports: number;
  totalSpareParts: number;
  totalIssues: number;
  totalFeedback: number;
}

export default function PlatformAnalytics() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalDiagnoses: 0,
    totalChats: 0,
    totalBatteryReports: 0,
    totalSpareParts: 0,
    totalIssues: 0,
    totalFeedback: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch counts from all tables
      const [
        { count: usersCount },
        { count: diagnosesCount },
        { count: chatsCount },
        { count: batteryCount },
        { count: partsCount },
        { count: issuesCount },
        { count: feedbackCount },
        { data: recentIssues }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('image_diagnostics').select('*', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('battery_reports').select('*', { count: 'exact', head: true }),
        supabase.from('spare_parts_inventory').select('*', { count: 'exact', head: true }),
        supabase.from('issue_history').select('*', { count: 'exact', head: true }),
        supabase.from('ai_feedback').select('*', { count: 'exact', head: true }),
        supabase.from('issue_history').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalDiagnoses: diagnosesCount || 0,
        totalChats: chatsCount || 0,
        totalBatteryReports: batteryCount || 0,
        totalSpareParts: partsCount || 0,
        totalIssues: issuesCount || 0,
        totalFeedback: feedbackCount || 0,
      });

      setRecentActivity(recentIssues || []);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Unable to load platform analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Photo Diagnoses',
      value: stats.totalDiagnoses,
      icon: Camera,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'AI Chat Messages',
      value: stats.totalChats,
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Battery Reports',
      value: stats.totalBatteryReports,
      icon: Battery,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Spare Parts',
      value: stats.totalSpareParts,
      icon: Package,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      title: 'Total Issues',
      value: stats.totalIssues,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Platform Analytics
        </CardTitle>
        <CardDescription>
          Monitor platform usage, activity trends, and key metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statCards.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`${stat.bgColor} p-3 rounded-lg`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">AI Feedback Submissions</span>
                    <Badge variant="secondary">{stats.totalFeedback}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Diagnoses per User</span>
                    <Badge variant="secondary">
                      {stats.totalUsers > 0 ? (stats.totalDiagnoses / stats.totalUsers).toFixed(1) : '0'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Issues per User</span>
                    <Badge variant="secondary">
                      {stats.totalUsers > 0 ? (stats.totalIssues / stats.totalUsers).toFixed(1) : '0'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Issues</CardTitle>
                <CardDescription>Latest device issues reported by users</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((issue) => (
                      <div key={issue.id} className="flex items-start justify-between p-3 rounded-lg border">
                        <div className="space-y-1">
                          <p className="font-medium">{issue.issue_type}</p>
                          {issue.issue_description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {issue.issue_description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={issue.resolved ? 'default' : 'secondary'}>
                            {issue.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                          {issue.severity_level && (
                            <Badge variant={
                              issue.severity_level === 'critical' ? 'destructive' :
                              issue.severity_level === 'high' ? 'default' :
                              'outline'
                            }>
                              {issue.severity_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}
