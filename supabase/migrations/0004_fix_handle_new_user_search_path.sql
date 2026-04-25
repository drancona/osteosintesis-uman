-- ============================================================
-- FIX: handle_new_user falla porque el trigger lo invoca el rol
-- supabase_auth_admin cuyo search_path es solo `auth`. La función
-- usa el enum sin qualificar (`user_role`) que vive en `public`,
-- así que el cast `(NEW.raw_user_meta_data->>'role')::user_role`
-- explota con "type user_role does not exist" y aborta el signUp
-- con "Database error saving new user".
--
-- Solución: recrear la función fijando search_path = public, auth
-- para que tanto los tipos como las tablas resuelvan correctamente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, matricula_imss, nombre_completo, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'matricula_imss',
    NEW.raw_user_meta_data->>'nombre_completo',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'medico')
  );
  RETURN NEW;
END;
$$;
