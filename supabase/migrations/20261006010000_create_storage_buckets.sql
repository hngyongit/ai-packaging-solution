-- Hai bucket mà /api/upload dựa vào chưa từng tồn tại trên project thật
-- (storage.buckets rỗng) → mọi lần upload đều 500 "Bucket not found".
-- Tạo bằng SQL thay vì bấm tay trên dashboard để còn tái lập được.
--
-- Idempotent: ON CONFLICT DO NOTHING → chạy lại vẫn an toàn và không ghi đè nếu
-- bucket đã được tạo tay với cấu hình khác.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  TRUE,                                  -- public read: logo/ảnh in phải xem được bằng <img> không cần chữ ký
  10485760,                              -- 10MB, khớp maxSize của purpose logo/reference/dieline
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/postscript',
    'application/illustrator',
    'application/vnd.adobe.illustrator',
    'image/svg+xml'                      -- logo vector + file khuôn bế khách tự dựng
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  FALSE,                                 -- đọc qua signed URL 1h do service_role ký
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/postscript',
    'application/illustrator',
    'application/vnd.adobe.illustrator',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Không thêm policy cho storage.objects: ghi luôn qua service_role (bỏ qua RLS),
-- đọc công khai đi qua endpoint /object/public/ (không kiểm RLS khi bucket public),
-- còn order-files đọc bằng signed URL cũng do service_role ký. Thêm policy ở đây
-- chỉ mở rộng bề mặt mà không có đường code nào cần.
