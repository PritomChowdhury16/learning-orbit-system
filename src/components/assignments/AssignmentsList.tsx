import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Assignment, AssignmentSubmission } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Upload, Check, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AssignmentsList = () => {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    try {
      // Fetch all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch user's submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', profile.id);

      if (submissionsError) throw submissionsError;

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!selectedFile || !profile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${profile.id}/${assignmentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName);

      // Create submission record
      const { error: submissionError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: profile.id,
          file_url: publicUrl,
          file_name: selectedFile.name,
        });

      if (submissionError) throw submissionError;

      toast.success('Assignment submitted successfully!');
      setSelectedFile(null);
      setSelectedAssignment(null);
      fetchData();
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  if (loading) {
    return <div>Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No assignments available yet.</p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => {
          const submission = getSubmissionForAssignment(assignment.id);
          return (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{assignment.title}</span>
                    </CardTitle>
                    {assignment.course && (
                      <CardDescription className="mt-1">{assignment.course}</CardDescription>
                    )}
                  </div>
                  {submission ? (
                    <div className="flex items-center space-x-2 text-success">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-warning">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.description && (
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm space-y-1">
                    {assignment.due_date && (
                      <p className="text-muted-foreground">
                        Due: {format(new Date(assignment.due_date), 'PPP')}
                      </p>
                    )}
                    {assignment.file_url && (
                      <a
                        href={assignment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center"
                      >
                        View Assignment File <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {!submission ? (
                    <Dialog open={selectedAssignment === assignment.id} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedAssignment(assignment.id)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submit Assignment</DialogTitle>
                          <DialogDescription>Upload your assignment file</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="file">Select File</Label>
                            <Input
                              id="file"
                              type="file"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.txt"
                            />
                          </div>
                          <Button
                            onClick={() => handleSubmit(assignment.id)}
                            disabled={!selectedFile || uploading}
                            className="w-full"
                          >
                            {uploading ? 'Uploading...' : 'Submit Assignment'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="space-y-2">
                      {submission.grade && (
                        <p className="text-sm font-medium">
                          Grade: <span className="text-primary">{submission.grade}</span>
                        </p>
                      )}
                      {submission.file_url && (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center"
                        >
                          View Submission <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
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

export default AssignmentsList;
