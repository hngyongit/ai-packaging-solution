-- Migration: box_styles lookup table + seed
-- Kiểu dáng thùng (box style) với ảnh preview + mockup (Cloudinary).
-- Replace chuỗi option cũ trong UI: chỉ còn 3 kiểu, bỏ cod_shipping / branded.
-- Additive: bảng mới, không đụng consultation cũ.

CREATE TABLE IF NOT EXISTS public.box_styles (
  id TEXT PRIMARY KEY,             -- key: 'rsc_a1' | 'am_duong' | 'mailer'
  label TEXT NOT NULL,
  preview_url TEXT NOT NULL,       -- ảnh preview kiểu thùng (hover card)
  mockup_url TEXT NOT NULL,        -- ảnh mockup thành phẩm
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.box_styles ENABLE ROW LEVEL SECURITY;

-- Anyone can read active box styles (form + AI enrichment)
CREATE POLICY "box_styles_public_select"
  ON public.box_styles FOR SELECT
  USING (is_active = TRUE);

-- Admin manages box styles
CREATE POLICY "box_styles_admin_all"
  ON public.box_styles FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Narrow consultations.box_style CHECK to the 3 active styles (removes cod_shipping / branded)
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_box_style_check;
ALTER TABLE consultations
  ADD CONSTRAINT consultations_box_style_check
  CHECK (box_style IN ('rsc_a1', 'am_duong', 'mailer') OR box_style IS NULL);

-- Seed
INSERT INTO public.box_styles (id, label, preview_url, mockup_url, sort_order)
VALUES
  ('rsc_a1',    'Thùng carton đối khẩu - RSC / A1',
   'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309841/standard-preview.png',
   'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309903/standard-mockup.png', 1),
  ('am_duong',  'Thùng carton âm dương',
   'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309841/telescoping-preview.png',
   'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309902/telescoping-mockup.png', 2),
  ('mailer',    'Thùng carton nắp gài / Mailer Box',
   'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309841/mailler-preview.png',
   'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789309902/mailler-mockup.png', 3)
ON CONFLICT (id) DO NOTHING;