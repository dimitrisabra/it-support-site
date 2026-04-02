
CREATE POLICY "Users can update own role" ON public.user_roles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
