-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create search history table
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  train_no TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  journey_date DATE NOT NULL,
  class_type TEXT NOT NULL,
  quota TEXT NOT NULL,
  seat_changes INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  segments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Search history policies
CREATE POLICY "Users can view own history" ON public.search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();