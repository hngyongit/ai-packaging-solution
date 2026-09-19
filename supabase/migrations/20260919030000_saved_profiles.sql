-- Mẫu thùng đã lưu (profile) — bổ sung nguồn gốc cho bảng saved_products có sẵn.
-- box_style_id: kiểu thùng AI đã chọn (rsc_a1 | am_duong | mailer) để tái hiện
--   lại specs khi import vào đơn.
-- source_consultation_id: phiên tư vấn sinh ra mẫu — provenance cho bộ phận bán.

ALTER TABLE saved_products
  ADD COLUMN IF NOT EXISTS box_style_id TEXT,
  ADD COLUMN IF NOT EXISTS source_consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;

COMMENT ON COLUMN saved_products.box_style_id IS 'Kiểu thùng đã lưu (khớp BOX_STYLES ở app)';
COMMENT ON COLUMN saved_products.source_consultation_id IS 'Phiên tư vấn tạo ra mẫu này';
