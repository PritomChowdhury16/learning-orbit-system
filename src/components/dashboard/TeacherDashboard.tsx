/**
 * Teacher Dashboard
 * 
 * Main dashboard for teachers showing:
 * - Stats overview (assignments, students, submissions, payments)
 * - Tabs for Assignments, Results, and Payments management
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Trophy, DollarSign } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import Assignments from '@/components/Assignments';
import Results from '@/components/Results';
import Payments from '@/components/Payments';
import { toast } from 'sonner';

const TeacherDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (profile) fetchStats();
  }, [profile]);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    if (!profile) return;

    try {
      const { count: totalAssignments } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('teacher_id', profile.id);
      const { count: totalStudents } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: totalSubmissions } = await supabase.from('assignment_submissions').select('*', { count: 'exact', head: true });
      const { count: pendingPayments } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      setStats({
        totalAssignments: totalAssignments || 0,
        totalStudents: totalStudents || 0,
        totalSubmissions: totalSubmissions || 0,
        pendingPayments: pendingPayments || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  return (
    <DashboardLayout title="Teacher Dashboard">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalAssignments}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalStudents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalSubmissions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.pendingPayments}</div></CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments"><Assignments /></TabsContent>
        <TabsContent value="results"><Results /></TabsContent>
        <TabsContent value="payments"><Payments /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
