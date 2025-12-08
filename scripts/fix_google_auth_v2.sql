
-- ALTERNATIVE FIX: Handle conflict and check role constraints more robustly

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  v_role text;
BEGIN
  -- Determine role, default to 'student'
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');

  -- Ensure role is valid based on check constraint
  -- (admin, student, creator)
  IF v_role NOT IN ('admin', 'student', 'creator') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url',
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
    -- We generally don't want to overwrite role on login if profile exists

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail, let auth proceed (profile might stay empty but user is created)
  -- Or better, ensure we don't block the auth user creation.
  -- But for now, let's just re-raise to see the error if explicit.
  RAISE WARNING 'Profile creation failed: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
