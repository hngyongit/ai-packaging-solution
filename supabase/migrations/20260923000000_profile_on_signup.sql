-- Tạo row profiles tự động khi có auth user mới.
-- Lý do: bật "Confirm email" → client không còn session lúc đăng ký, không upsert
-- profiles được (RLS không có INSERT policy). Nếu không có trigger thì sau khi xác
-- thực, getAuthenticatedProfile() trả null → /dashboard đá về /login mãi.
-- Trigger chạy ở privilege chủ bảng ( bypass RLS) nên tạo được row.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
        phone     = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: user đã tồn tại (đăng ký trước khi có trigger) mà thiếu profile.
INSERT INTO public.profiles (id, full_name, phone)
SELECT
  u.id,
  NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
  NULLIF(u.raw_user_meta_data ->> 'phone', '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
