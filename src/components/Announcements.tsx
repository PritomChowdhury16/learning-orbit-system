/**
 * Announcements Component
 * 
 * What this does:
 * - Shows list of announcements from teachers
 * - Teachers can post new announcements
 * - Students can only read announcements
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Type for announcement data
interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  teacher_id: string;
}

const Announcements = () => {
  // Get current user info
  const { profile } = useAuth();
  
  // State for announcements list
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for new announcement form (teachers only)
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [posting, setPosting] = useState(false);

  // Check if user is a teacher
  const isTeacher = profile?.role === 'teacher';

  // Load announcements when component loads
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Function to get announcements from database
  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function for teachers to post new announcement
  const handlePost = async () => {
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setPosting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newTitle.trim(),
          message: newMessage.trim(),
          teacher_id: profile?.id
        });

      if (error) throw error;

      // Clear form and reload
      setNewTitle('');
      setNewMessage('');
      toast.success('Announcement posted!');
      loadAnnouncements();
    } catch (error) {
      console.error('Error posting:', error);
      toast.error('Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  // Function for teachers to delete their announcement
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Announcement deleted');
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post Form - Only for Teachers */}
        {isTeacher && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <Input
              placeholder="Announcement title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Input
              placeholder="Write your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button 
              onClick={handlePost} 
              disabled={posting}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post Announcement'}
            </Button>
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No announcements yet
          </p>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div 
                key={item.id} 
                className="p-4 border rounded-lg bg-background"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-muted-foreground mt-1">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  {/* Delete button - only for teacher who posted */}
                  {isTeacher && item.teacher_id === profile?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Announcements;
