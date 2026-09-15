-- Migration: print mockup assets on consultations
-- Ảnh mockup AI + khuôn bế có hình in lưu trên Cloudinary, cộng hạn mức gen
-- để chặn chi phí API chạy vòng lặp. Additive, idempotent.

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS mockup_url TEXT,
  ADD COLUMN IF NOT EXISTS dieline_url TEXT,
  ADD COLUMN IF NOT EXISTS mockup_requests INT NOT NULL DEFAULT 0;

-- Thùng âm dương / nắp gài chỉ in được 1 mặt trên → thêm '1_top' vào CHECK.
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_print_faces_check;
ALTER TABLE consultations
  ADD CONSTRAINT consultations_print_faces_check
  CHECK (print_faces IN ('2_main', '4_sides', '1_top') OR print_faces IS NULL);
