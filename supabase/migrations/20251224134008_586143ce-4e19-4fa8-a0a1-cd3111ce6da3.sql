-- Create announcements table for teachers to post messages
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read announcements
CREATE POLICY "Everyone can view announcements"
ON public.announcements
FOR SELECT
USING (true);

-- Only teachers can create announcements
CREATE POLICY "Teachers can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'::user_role
));

-- Teachers can delete their own announcements
CREATE POLICY "Teachers can delete their announcements"
ON public.announcements
FOR DELETE
USING (teacher_id = auth.uid());