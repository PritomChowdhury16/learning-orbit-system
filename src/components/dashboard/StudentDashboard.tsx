/**
 * Student Dashboard - Simple welcome page for students
 * 
 * Shows:
 * - Welcome message with student name
 * - Basic info cards (roll number, course, email)
 * - Announcements from teachers
 */
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, BookOpen, Mail } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import Announcements from '@/components/Announcements';

const StudentDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardLayout title="Student Dashboard">
      {/* Welcome Message */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold">
            Welcome, {profile?.full_name}! 👋
          </h2>
          <p className="text-muted-foreground mt-2">
            This is your student dashboard. Here you can see your info and announcements.
          </p>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Roll Number */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <User className="h-8 w-8 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Roll Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {profile?.roll_number || 'Not Set'}
            </p>
          </CardContent>
        </Card>

        {/* Course */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {profile?.course || 'Not Set'}
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

      {/* Announcements Section */}
      <Announcements />
    </DashboardLayout>
  );
};

export default StudentDashboard;
