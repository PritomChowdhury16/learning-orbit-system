/**
 * Dashboard - Shows content based on user role
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; message: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    // Load announcements
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setAnnouncements(data);
    });
    // Load students (for teachers)
    supabase.from('profiles').select('*').eq('role', 'student').then(({ data }) => {
      if (data) setStudents(data);
    });
  }, []);

  const postAnnouncement = async () => {
    if (!title || !message || !user) return;
    const { error } = await supabase.from('announcements').insert({ teacher_id: user.id, title, message });
    if (error) toast.error(error.message);
    else {
      toast.success('Posted!');
      setTitle(''); setMessage('');
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) setAnnouncements(data);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {profile?.full_name}</h1>
        <Button variant="outline" onClick={() => { signOut(); navigate('/'); }}>Logout</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-card p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Announcements</h2>
          
          {profile?.role === 'teacher' && (
            <div className="space-y-2 mb-4 p-3 bg-muted rounded">
              <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
              <Input placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
              <Button size="sm" onClick={postAnnouncement}>Post</Button>
            </div>
          )}
          
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="p-3 bg-muted rounded">
                <h3 className="font-medium">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.message}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-muted-foreground">No announcements</p>}
          </div>
        </div>

        {/* Student List (Teacher only) */}
        {profile?.role === 'teacher' && (
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Students</h2>
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="p-3 bg-muted rounded">
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-sm text-muted-foreground">{s.email}</p>
                </div>
              ))}
              {students.length === 0 && <p className="text-muted-foreground">No students</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
