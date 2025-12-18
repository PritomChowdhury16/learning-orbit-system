/**
 * Results Component
 * 
 * Displays exam results differently based on user role:
 * - Students: View their own exam results with grades
 * - Teachers: Add new results and view all results they've added
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Result, Profile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Results = () => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';
  
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for adding results (teacher only)
  const [formData, setFormData] = useState({
    student_id: '',
    exam_type: '',
    subject: '',
    marks_obtained: '',
    total_marks: '',
    exam_date: '',
    remarks: '',
  });

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  // Fetch results based on role
  const fetchData = async () => {
    if (!profile) return;

    try {
      if (isTeacher) {
        // Teachers: fetch students list and results they added
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('full_name');

        const { data: resultsData } = await supabase
          .from('results')
          .select(`*, profiles!results_student_id_fkey(full_name, roll_number)`)
          .eq('teacher_id', profile.id)
          .order('exam_date', { ascending: false });

        setStudents(studentsData || []);
        setResults(resultsData || []);
      } else {
        // Students: fetch only their results
        const { data } = await supabase
          .from('results')
          .select('*')
          .eq('student_id', profile.id)
          .order('exam_date', { ascending: false });

        setResults(data || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // Add new result (teacher only)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase.from('results').insert({
        teacher_id: profile.id,
        student_id: formData.student_id,
        exam_type: formData.exam_type,
        subject: formData.subject,
        marks_obtained: parseFloat(formData.marks_obtained),
        total_marks: parseFloat(formData.total_marks),
        exam_date: formData.exam_date,
        remarks: formData.remarks || null,
      });

      if (error) throw error;

      toast.success('Result added successfully!');
      setDialogOpen(false);
      setFormData({ student_id: '', exam_type: '', subject: '', marks_obtained: '', total_marks: '', exam_date: '', remarks: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add result');
    }
  };

  // Helper functions
  const getPercentage = (obtained: number, total: number) => ((obtained / total) * 100).toFixed(2);
  
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-500' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  if (loading) return <div>Loading results...</div>;

  return (
    <div className="space-y-4">
      {/* Teacher: Add Result Button */}
      {isTeacher && (
        <div className="flex justify-between items-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Result</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Student Result</DialogTitle>
                <DialogDescription>Enter exam results for a student</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select value={formData.student_id} onValueChange={(value) => setFormData({ ...formData, student_id: value })} required>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name} {s.roll_number && `(${s.roll_number})`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Type *</Label>
                    <Input placeholder="CT, Midterm, Final" value={formData.exam_type} onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input placeholder="Mathematics" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Marks Obtained *</Label>
                    <Input type="number" step="0.01" value={formData.marks_obtained} onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Marks *</Label>
                    <Input type="number" step="0.01" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Date *</Label>
                    <Input type="date" value={formData.exam_date} onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={3} />
                </div>
                <Button type="submit" className="w-full">Add Result</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Student: Overall Performance Card */}
      {!isTeacher && results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Overall Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Exams</p>
                <p className="text-2xl font-bold">{results.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">
                  {(results.reduce((acc, r) => acc + (r.marks_obtained / r.total_marks) * 100, 0) / results.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      {results.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No results available yet.</p></CardContent></Card>
      ) : (
        results.map((result: any) => {
          const percentage = parseFloat(getPercentage(result.marks_obtained, result.total_marks));
          const { grade, color } = getGrade(percentage);
          
          return (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>{isTeacher ? result.profiles?.full_name : result.subject}</span>
                </CardTitle>
                {isTeacher && <p className="text-sm text-muted-foreground">Roll: {result.profiles?.roll_number}</p>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {!isTeacher && <div><p className="text-sm text-muted-foreground">Subject</p><p className="font-medium">{result.subject}</p></div>}
                  <div><p className="text-sm text-muted-foreground">Exam Type</p><p className="font-medium">{result.exam_type}</p></div>
                  <div><p className="text-sm text-muted-foreground">Marks</p><p className="font-medium">{result.marks_obtained}/{result.total_marks} ({percentage}%)</p></div>
                  <div><p className="text-sm text-muted-foreground">Grade</p><p className={`font-bold ${color}`}>{grade}</p></div>
                  <div><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{format(new Date(result.exam_date), 'PP')}</p></div>
                </div>
                {result.remarks && <div className="mt-2"><p className="text-sm text-muted-foreground">Remarks</p><p className="text-sm">{result.remarks}</p></div>}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default Results;
