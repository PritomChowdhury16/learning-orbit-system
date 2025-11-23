import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Trophy, DollarSign, User, BookOpen } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import AssignmentsList from '@/components/assignments/AssignmentsList';
import StudentResults from '@/components/results/StudentResults';
import StudentPayments from '@/components/payments/StudentPayments';
import StudentProfile from '@/components/profile/StudentProfile';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    submittedAssignments: 0,
    averageGrade: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // Fetch assignments count
      const { count: totalAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true });

      // Fetch submissions count
      const { count: submittedAssignments } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id);

      // Fetch average grade
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('grade')
        .eq('student_id', profile.id)
        .not('grade', 'is', null);

      const avgGrade = submissions && submissions.length > 0
        ? submissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / submissions.length
        : 0;

      // Fetch pending payments
      const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id)
        .eq('status', 'pending');

      setStats({
        totalAssignments: totalAssignments || 0,
        submittedAssignments: submittedAssignments || 0,
        averageGrade: Math.round(avgGrade * 100) / 100,
        pendingPayments: pendingPayments || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGrade || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <AssignmentsList />
        </TabsContent>

        <TabsContent value="results">
          <StudentResults />
        </TabsContent>

        <TabsContent value="payments">
          <StudentPayments />
        </TabsContent>

        <TabsContent value="profile">
          <StudentProfile />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentDashboard;
