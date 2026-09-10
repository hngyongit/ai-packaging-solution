-- Migration: add box_style for AI consultation
-- Kiểu dáng thùng khách chọn trong form tư vấn. Additive, nullable.

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS box_style TEXT
    CHECK (box_style IN ('rsc_a1', 'am_duong', 'mailer', 'cod_shipping', 'branded') OR box_style IS NULL);