
-- AI Settings table
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ai_settings" ON public.ai_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ai_settings" ON public.ai_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert defaults
INSERT INTO public.ai_settings (setting_key, setting_value) VALUES
  ('system_prompt', 'You are a helpful IT support assistant.'),
  ('tone', 'friendly'),
  ('max_length', '500');

-- Message feedback table
CREATE TABLE public.message_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feedback TEXT CHECK (feedback IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feedback" ON public.message_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can submit feedback" ON public.message_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.message_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
