-- Migration: add consultation spec fields
-- Dev A (AI consultation) — extra carton-spec input columns on consultations.
-- Additive: all columns nullable, no policy change needed (existing
-- "consultations_public_insert" WITH CHECK (true) already covers these).

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS preferred_layers INT,
  ADD COLUMN IF NOT EXISTS flute_type TEXT,
  ADD COLUMN IF NOT EXISTS print_faces TEXT
    CHECK (print_faces IN ('2_main', '4_sides') OR print_faces IS NULL),
  ADD COLUMN IF NOT EXISTS has_design_file BOOLEAN,
  ADD COLUMN IF NOT EXISTS purchase_frequency TEXT
    CHECK (purchase_frequency IN ('once', 'periodic', 'continuous') OR purchase_frequency IS NULL);