-- Fix infinite recursion in profiles RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Teachers can view all profiles" ON profiles;

-- Create a security definer function to check if user is a teacher
-- This bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_teacher(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'teacher'::user_role
  );
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Teachers can view all profiles"
ON profiles
FOR SELECT
USING (is_teacher(auth.uid()));