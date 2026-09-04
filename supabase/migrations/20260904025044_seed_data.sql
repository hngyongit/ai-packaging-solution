-- Seed data (non-auth — safe via SQL)
-- Products, consultations, orders only

-- Products
INSERT INTO public.products (code, name, category, box_type, description,
  min_dimensions, max_dimensions, available_layers, base_price, unit, is_active)
VALUES
  ('CTN-3L-SM', 'Carton 3 lớp — Nhỏ',    'carton-3-layer', 'regular-slotted',
   '20x15x10cm, phù hợp mỹ phẩm, phụ kiện',
   '{"length":10,"width":8,"height":5}',   '{"length":20,"width":15,"height":10}',
   ARRAY[3], 3000, 'unit', TRUE),
  ('CTN-3L-MD', 'Carton 3 lớp — Vừa',    'carton-3-layer', 'regular-slotted',
   '35x25x20cm, phù hợp thực phẩm, quà tặng',
   '{"length":20,"width":15,"height":10}', '{"length":35,"width":25,"height":20}',
   ARRAY[3], 5000, 'unit', TRUE),
  ('CTN-3L-LG', 'Carton 3 lớp — Lớn',    'carton-3-layer', 'regular-slotted',
   '50x40x30cm, phù hợp giày dép, quần áo',
   '{"length":35,"width":25,"height":20}', '{"length":50,"width":40,"height":30}',
   ARRAY[3], 8000, 'unit', TRUE),
  ('CTN-5L-MD', 'Carton 5 lớp — Vừa',    'carton-5-layer', 'regular-slotted',
   '40x30x25cm, phù hợp hàng nặng, điện tử',
   '{"length":25,"width":20,"height":15}', '{"length":40,"width":30,"height":25}',
   ARRAY[5], 12000, 'unit', TRUE),
  ('CTN-5L-LG', 'Carton 5 lớp — Lớn',    'carton-5-layer', 'regular-slotted',
   '60x40x40cm, phù hợp hàng cồng kềnh',
   '{"length":40,"width":30,"height":25}', '{"length":60,"width":40,"height":40}',
   ARRAY[5], 18000, 'unit', TRUE),
  ('CTN-5L-XL', 'Carton 5 lớp — Cỡ lớn', 'carton-5-layer', 'full-overlap',
   '80x60x50cm, phù hợp hàng xuất khẩu',
   '{"length":60,"width":40,"height":40}', '{"length":80,"width":60,"height":50}',
   ARRAY[5], 25000, 'unit', TRUE)
ON CONFLICT (code) DO NOTHING;