/**
 * Auth Page - Simple login and signup
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate('/dashboard');
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { toast.error(error.message); }
      else if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, email, full_name: name, role });
        toast.success('Account created!');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded-lg shadow-lg w-80 space-y-4">
        <h1 className="text-2xl font-bold text-center">{isLogin ? 'Login' : 'Sign Up'}</h1>
        
        {!isLogin && (
          <>
            <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
            <select className="w-full p-2 border rounded" value={role} onChange={e => setRole(e.target.value as 'student' | 'teacher')}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </>
        )}
        
        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
        </Button>
        
        <p className="text-center text-sm">
          {isLogin ? "Don't have account? " : "Have account? "}
          <button type="button" className="text-primary underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Auth;
