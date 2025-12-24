/**
 * Teacher Dashboard - Simple welcome page for teachers
 * 
 * Shows:
 * - Welcome message with teacher name
 * - Basic info cards (department, email)
 */
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Mail } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

const TeacherDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout title="Teacher Dashboard">
      {/* Welcome Message */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold">
            Welcome, {profile?.full_name}! 👋
          </h2>
          <p className="text-muted-foreground mt-2">
            This is your teacher dashboard. Here you can see your basic information.
          </p>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Building className="h-8 w-8 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {profile?.department || 'Not Set'}
            </p>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Mail className="h-8 w-8 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium truncate">
              {profile?.email}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
