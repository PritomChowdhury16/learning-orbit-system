import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type UserRole = 'student' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  roll_number?: string;
  course?: string;
  department?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  due_date?: string;
  course?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  status: string;
  grade?: number;
  feedback?: string;
}

export interface Result {
  id: string;
  student_id: string;
  teacher_id: string;
  exam_type: string;
  subject: string;
  marks_obtained: number;
  total_marks: number;
  exam_date: string;
  remarks?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_type: string;
  status: string;
  due_date: string;
  paid_date?: string;
  semester?: string;
  created_at: string;
}
