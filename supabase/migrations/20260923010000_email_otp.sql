-- OTP xác minh email tự quản lý (Supabase autoconfirm BẬT → GoTrue không gửi mail;
-- app tự gửi OTP qua Gmail SMTP và verify qua /api/auth/verify/*).
-- Chỉ service_role chạm được: không policy nào cho anon/authenticated.

CREATE TABLE public.email_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
-- RLS bật mà không có policy → mọi truy vấn anon/authenticated trả 0 row.
-- Đường duy nhất tới bảng là createAdminClient (service_role) ở server routes.

-- User cũ (seed + đã kích hoạt trước đây) coi như đã xác minh, tránh bị gate chặn.
INSERT INTO public.email_verifications (user_id, code_hash, expires_at, verified_at)
SELECT u.id, 'legacy', NOW() - INTERVAL '1 day', NOW()
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
