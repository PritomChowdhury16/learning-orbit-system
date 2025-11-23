import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Payment, Profile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TeacherPayments = () => {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_type: '',
    due_date: '',
    semester: '',
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      if (studentsError) throw studentsError;

      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          profiles!payments_student_id_fkey(full_name, roll_number)
        `)
        .order('due_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      setStudents(studentsData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('payments')
        .insert({
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
      setFormData({
        student_id: '',
        amount: '',
        payment_type: '',
        due_date: '',
        semester: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast.error(error.message || 'Failed to add payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Record</DialogTitle>
              <DialogDescription>Create a new payment record for a student</DialogDescription>
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
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Payment Type *</Label>
                  <Input
                    id="payment_type"
                    placeholder="Tuition, Lab, etc."
                    value={formData.payment_type}
                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    placeholder="Spring 2024"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Add Payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No payment records yet.</p>
          </CardContent>
        </Card>
      ) : (
        payments.map((payment) => (
          <Card key={payment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>{payment.profiles.full_name}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Roll: {payment.profiles.roll_number}
                  </p>
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Type</p>
                  <p className="font-medium">{payment.payment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-primary">${payment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(payment.due_date), 'PP')}</p>
                </div>
                {payment.semester && (
                  <div>
                    <p className="text-sm text-muted-foreground">Semester</p>
                    <p className="font-medium">{payment.semester}</p>
                  </div>
                )}
                {payment.paid_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid On</p>
                    <p className="font-medium">{format(new Date(payment.paid_date), 'PP')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default TeacherPayments;
