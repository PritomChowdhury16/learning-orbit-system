/**
 * Assignments Component
 * 
 * Handles assignments based on user role:
 * - Students: View assignments and submit their work
 * - Teachers: Create, view, and delete assignments
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Assignment, AssignmentSubmission } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Upload, Check, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Assignments = () => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  // Form state for creating assignments (teacher only)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    due_date: '',
  });

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  // Fetch data based on role
  const fetchData = async () => {
    if (!profile) return;

    try {
      if (isTeacher) {
        // Teachers: fetch only their assignments
        const { data } = await supabase
          .from('assignments')
          .select('*')
          .eq('teacher_id', profile.id)
          .order('created_at', { ascending: false });

        setAssignments(data || []);
      } else {
        // Students: fetch all assignments and their submissions
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: submissionsData } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', profile.id);

        setAssignments(assignmentsData || []);
        setSubmissions(submissionsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  // Create assignment (teacher only)
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUploading(true);
    try {
      let fileUrl = null, fileName = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${profile.id}/assignments/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('assignments').upload(filePath, selectedFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(filePath);
        fileUrl = publicUrl;
        fileName = selectedFile.name;
      }

      const { error } = await supabase.from('assignments').insert({
        teacher_id: profile.id,
        title: formData.title,
        description: formData.description,
        course: formData.course,
        due_date: formData.due_date || null,
        file_url: fileUrl,
        file_name: fileName,
      });

      if (error) throw error;

      toast.success('Assignment created successfully!');
      setDialogOpen(false);
      setFormData({ title: '', description: '', course: '', due_date: '' });
      setSelectedFile(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment');
    } finally {
      setUploading(false);
    }
  };

  // Submit assignment (student only)
  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!selectedFile || !profile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${profile.id}/${assignmentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('assignments').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(fileName);

      const { error } = await supabase.from('assignment_submissions').insert({
        assignment_id: assignmentId,
        student_id: profile.id,
        file_url: publicUrl,
        file_name: selectedFile.name,
      });

      if (error) throw error;

      toast.success('Assignment submitted successfully!');
      setSelectedFile(null);
      setSelectedAssignment(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  };

  // Delete assignment (teacher only)
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;

      toast.success('Assignment deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  // Helper to get submission for an assignment (student only)
  const getSubmission = (assignmentId: string) => submissions.find(s => s.assignment_id === assignmentId);

  if (loading) return <div>Loading assignments...</div>;

  return (
    <div className="space-y-4">
      {/* Teacher: Create Assignment Button */}
      {isTeacher && (
        <div className="flex justify-between items-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Create Assignment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>Add a new assignment for students</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Input value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Attachment (PDF, DOC, DOCX)</Label>
                  <Input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                </div>
                <Button type="submit" disabled={uploading} className="w-full">{uploading ? 'Creating...' : 'Create Assignment'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No assignments {isTeacher ? 'created' : 'available'} yet.</p></CardContent></Card>
      ) : (
        assignments.map((assignment) => {
          const submission = !isTeacher ? getSubmission(assignment.id) : null;
          
          return (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{assignment.title}</span>
                    </CardTitle>
                    {assignment.course && <CardDescription className="mt-1">{assignment.course}</CardDescription>}
                  </div>
                  {isTeacher ? (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(assignment.id)}><Trash2 className="h-4 w-4" /></Button>
                  ) : submission ? (
                    <div className="flex items-center space-x-2 text-success"><Check className="h-4 w-4" /><span className="text-sm font-medium">Submitted</span></div>
                  ) : (
                    <div className="flex items-center space-x-2 text-warning"><Clock className="h-4 w-4" /><span className="text-sm font-medium">Pending</span></div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.description && <p className="text-sm text-muted-foreground">{assignment.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="text-sm space-y-1">
                    {assignment.due_date && <p className="text-muted-foreground">Due: {format(new Date(assignment.due_date), 'PPP')}</p>}
                    {assignment.file_url && (
                      <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                        View Assignment File <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </div>
                  
                  {/* Student: Submit or View Submission */}
                  {!isTeacher && (
                    !submission ? (
                      <Dialog open={selectedAssignment === assignment.id} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedAssignment(assignment.id)}><Upload className="mr-2 h-4 w-4" />Submit</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Assignment</DialogTitle>
                            <DialogDescription>Upload your assignment file</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Select File</Label>
                              <Input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
                            </div>
                            <Button onClick={() => handleSubmitAssignment(assignment.id)} disabled={!selectedFile || uploading} className="w-full">
                              {uploading ? 'Uploading...' : 'Submit Assignment'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="space-y-2">
                        {submission.grade && <p className="text-sm font-medium">Grade: <span className="text-primary">{submission.grade}</span></p>}
                        {submission.file_url && (
                          <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center">
                            View Submission <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default Assignments;
