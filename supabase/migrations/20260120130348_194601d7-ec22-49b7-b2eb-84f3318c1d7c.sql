-- Add UPDATE policy for habit_completions table
CREATE POLICY "Users can update their own completions"
  ON public.habit_completions
  FOR UPDATE
  USING (auth.uid() = user_id);