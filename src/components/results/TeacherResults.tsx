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

const TeacherResults = () => {
  const { profile } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      if (studentsError) throw studentsError;

      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select(`
          *,
          profiles!results_student_id_fkey(full_name, roll_number)
        `)
        .eq('teacher_id', profile.id)
        .order('exam_date', { ascending: false });

      if (resultsError) throw resultsError;

      setStudents(studentsData || []);
      setResults(resultsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('results')
        .insert({
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
      setFormData({
        student_id: '',
        exam_type: '',
        subject: '',
        marks_obtained: '',
        total_marks: '',
        exam_date: '',
        remarks: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error adding result:', error);
      toast.error(error.message || 'Failed to add result');
    }
  };

  if (loading) {
    return <div>Loading results...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Student Result</DialogTitle>
              <DialogDescription>Enter exam results for a student</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} {student.roll_number && `(${student.roll_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exam_type">Exam Type *</Label>
                  <Input
                    id="exam_type"
                    placeholder="CT, Midterm, Final"
                    value={formData.exam_type}
                    onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marks_obtained">Marks Obtained *</Label>
                  <Input
                    id="marks_obtained"
                    type="number"
                    step="0.01"
                    value={formData.marks_obtained}
                    onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_marks">Total Marks *</Label>
                  <Input
                    id="total_marks"
                    type="number"
                    step="0.01"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam_date">Exam Date *</Label>
                  <Input
                    id="exam_date"
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Add Result
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No results added yet.</p>
          </CardContent>
        </Card>
      ) : (
        results.map((result: any) => (
          <Card key={result.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>{result.profiles.full_name}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Roll: {result.profiles.roll_number}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{result.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exam Type</p>
                  <p className="font-medium">{result.exam_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marks</p>
                  <p className="font-medium">
                    {result.marks_obtained}/{result.total_marks} (
                    {((result.marks_obtained / result.total_marks) * 100).toFixed(2)}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(result.exam_date), 'PP')}</p>
                </div>
              </div>
              {result.remarks && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-sm">{result.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default TeacherResults;
