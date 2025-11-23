import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Payment } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const StudentPayments = () => {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [profile]);

  const fetchPayments = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', profile.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast.success('Payment processed successfully!');
      fetchPayments();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTotalPending = () => {
    return payments
      .filter((p) => p.status === 'pending')
      .reduce((acc, p) => acc + p.amount, 0);
  };

  const getTotalPaid = () => {
    return payments
      .filter((p) => p.status === 'paid')
      .reduce((acc, p) => acc + p.amount, 0);
  };

  if (loading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">${getTotalPending().toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">${getTotalPaid().toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(getTotalPending() + getTotalPaid()).toFixed(2)}</p>
          </CardContent>
        </Card>
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
                    <span>{payment.payment_type}</span>
                  </CardTitle>
                  {payment.semester && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Semester: {payment.semester}
                    </p>
                  )}
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-primary">${payment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(payment.due_date), 'PPP')}</p>
                </div>
              </div>
              {payment.paid_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid On</p>
                  <p className="font-medium">{format(new Date(payment.paid_date), 'PPP')}</p>
                </div>
              )}
              {payment.status === 'pending' && (
                <Button onClick={() => handlePayment(payment.id)} className="w-full">
                  Pay Now (Demo)
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default StudentPayments;
