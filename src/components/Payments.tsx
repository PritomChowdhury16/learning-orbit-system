/**
 * Payments Component
 * 
 * Handles payment display and management based on user role:
 * - Students: View their payments and make demo payments
 * - Teachers: Add payment records and view all student payments
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Payment, Profile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Payments = () => {
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'teacher';
  
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for adding payments (teacher only)
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_type: '',
    due_date: '',
    semester: '',
  });

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  // Fetch payments based on role
  const fetchData = async () => {
    if (!profile) return;

    try {
      if (isTeacher) {
        // Teachers: fetch students and all payments
        const { data: studentsData } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name');
        const { data: paymentsData } = await supabase
          .from('payments')
          .select(`*, profiles!payments_student_id_fkey(full_name, roll_number)`)
          .order('due_date', { ascending: false });

        setStudents(studentsData || []);
        setPayments(paymentsData || []);
      } else {
        // Students: fetch only their payments
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', profile.id)
          .order('due_date', { ascending: true });

        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  // Add payment record (teacher only)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('payments').insert({
        student_id: formData.student_id,
        amount: parseFloat(formData.amount),
        payment_type: formData.payment_type,
        due_date: formData.due_date,
        semester: formData.semester || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Payment added successfully!');
      setDialogOpen(false);
      setFormData({ student_id: '', amount: '', payment_type: '', due_date: '', semester: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add payment');
    }
  };

  // Process payment (student only - demo)
  const handlePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
        .eq('id', paymentId);

      if (error) throw error;

      toast.success('Payment processed successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending': return <Badge className="bg-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'overdue': return <Badge className="bg-destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  // Calculate totals (student only)
  const getTotalPending = () => payments.filter((p) => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const getTotalPaid = () => payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);

  if (loading) return <div>Loading payments...</div>;

  return (
    <div className="space-y-4">
      {/* Teacher: Add Payment Button */}
      {isTeacher && (
        <div className="flex justify-between items-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Record</DialogTitle>
                <DialogDescription>Create a new payment record for a student</DialogDescription>
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
                    <Label>Amount *</Label>
                    <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Type *</Label>
                    <Input placeholder="Tuition, Lab, etc." value={formData.payment_type} onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Input placeholder="Spring 2024" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add Payment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Student: Summary Cards */}
      {!isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-warning">${getTotalPending().toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-success">${getTotalPaid().toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${(getTotalPending() + getTotalPaid()).toFixed(2)}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No payment records yet.</p></CardContent></Card>
      ) : (
        payments.map((payment) => (
          <Card key={payment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>{isTeacher ? payment.profiles?.full_name : payment.payment_type}</span>
                  </CardTitle>
                  {isTeacher && <p className="text-sm text-muted-foreground mt-1">Roll: {payment.profiles?.roll_number}</p>}
                  {!isTeacher && payment.semester && <p className="text-sm text-muted-foreground mt-1">Semester: {payment.semester}</p>}
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {isTeacher && <div><p className="text-sm text-muted-foreground">Payment Type</p><p className="font-medium">{payment.payment_type}</p></div>}
                <div><p className="text-sm text-muted-foreground">Amount</p><p className="text-2xl font-bold text-primary">${payment.amount.toFixed(2)}</p></div>
                <div><p className="text-sm text-muted-foreground">Due Date</p><p className="font-medium">{format(new Date(payment.due_date), 'PPP')}</p></div>
                {isTeacher && payment.semester && <div><p className="text-sm text-muted-foreground">Semester</p><p className="font-medium">{payment.semester}</p></div>}
              </div>
              {payment.paid_date && <div><p className="text-sm text-muted-foreground">Paid On</p><p className="font-medium">{format(new Date(payment.paid_date), 'PPP')}</p></div>}
              {!isTeacher && payment.status === 'pending' && (
                <Button onClick={() => handlePayment(payment.id)} className="w-full">Pay Now (Demo)</Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default Payments;
