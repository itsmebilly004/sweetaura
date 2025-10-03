-- ============================================================================
--          CREATE A SECURE FUNCTION TO FETCH A USER'S ROLE
-- This function runs with the privileges of the user who defined it,
-- allowing it to bypass RLS safely for the specific task of getting a role.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This query runs with elevated privileges, bypassing RLS
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;