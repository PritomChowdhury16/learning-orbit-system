/**
 * Student List Component (Teachers Only)
 * 
 * What this does:
 * - Shows a list of all students
 * - Displays their name, email, roll number, and course
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

// Type for student data
interface Student {
  id: string;
  full_name: string;
  email: string;
  roll_number: string | null;
  course: string | null;
}

const StudentList = () => {
  // State for students list
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Load students when component loads
  useEffect(() => {
    loadStudents();
  }, []);

  // Function to get students from database
  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, roll_number, course')
        .eq('role', 'student')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          All Students ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No students registered yet
          </p>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div 
                key={student.id} 
                className="p-4 border rounded-lg bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <h4 className="font-semibold">{student.full_name}</h4>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Roll: <span className="font-medium text-foreground">{student.roll_number || 'N/A'}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Course: <span className="font-medium text-foreground">{student.course || 'N/A'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentList;
