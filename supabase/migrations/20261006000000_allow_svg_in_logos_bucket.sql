-- ĐÃ ÁP DỤNG TRÊN REMOTE nhưng vô tác dụng: lúc đó bucket `logos` chưa tồn tại
-- nên UPDATE khớp 0 dòng (storage.buckets rỗng). Giữ file lại để lịch sử migration
-- khớp remote — bản vá thật nằm ở 20261006010000_create_storage_buckets.sql.
--
-- Đừng xoá file này: xoá đi thì `supabase db push` báo
-- LegacyDbPushMissingLocalError vì remote có version mà local không có.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/postscript',
  'application/illustrator',
  'application/vnd.adobe.illustrator',
  'image/svg+xml'
]
WHERE id = 'logos';
