import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Result } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const StudentResults = () => {
  const { profile } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [profile]);

  const fetchResults = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', profile.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (obtained: number, total: number) => {
    return ((obtained / total) * 100).toFixed(2);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'bg-success' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-success' };
    if (percentage >= 70) return { grade: 'B', color: 'bg-primary' };
    if (percentage >= 60) return { grade: 'C', color: 'bg-warning' };
    if (percentage >= 50) return { grade: 'D', color: 'bg-warning' };
    return { grade: 'F', color: 'bg-destructive' };
  };

  if (loading) {
    return <div>Loading results...</div>;
  }

  return (
    <div className="space-y-4">
      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No results available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Overall Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{results.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {results.length > 0
                      ? getPercentage(
                          results.reduce((acc, r) => acc + r.marks_obtained, 0),
                          results.reduce((acc, r) => acc + r.total_marks, 0)
                        )
                      : '0'}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.map((result) => {
            const percentage = parseFloat(getPercentage(result.marks_obtained, result.total_marks));
            const { grade, color } = getGrade(percentage);

            return (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5" />
                        <span>{result.subject}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.exam_type} • {format(new Date(result.exam_date), 'PPP')}
                      </p>
                    </div>
                    <Badge className={color}>{grade}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">
                        {result.marks_obtained}/{result.total_marks}
                      </p>
                      <p className="text-sm text-muted-foreground">Marks Obtained</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{percentage}%</p>
                      <p className="text-sm text-muted-foreground">Percentage</p>
                    </div>
                  </div>
                  {result.remarks && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Remarks:</p>
                      <p className="text-sm text-muted-foreground">{result.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

export default StudentResults;
