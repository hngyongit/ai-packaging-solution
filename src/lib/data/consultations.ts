import { z } from 'zod'

import { BOX_STYLES, type AIRecommendation } from '@/lib/ai/types'
import { createAdminClient } from '@/lib/supabase/server'

// Local row type — intentionally not in src/types/database.ts (owned by Dev D).
export type ConsultationRow = {
  id: string
  customer_id: string | null
  status: string
  product_type: string
  box_style: string | null
  product_length: number | null
  product_width: number | null
  product_height: number | null
  product_weight: number | null
  desired_quantity: number | null
  has_printing: boolean | null
  preferred_layers: number | null
  flute_type: string | null
  purchase_frequency: string | null
  ai_recommendation: AIRecommendation | null
  ai_suggested_product_id: string | null
  ai_suggested_dimensions: { length: number; width: number; height: number } | null
  ai_suggested_layers: number | null
  ai_confidence: number | null
  ai_processed_at: string | null
  created_at: string
  updated_at: string
}

export const consultationInputSchema = z.object({
  productType: z.string().trim().min(1, 'Vui lòng nhập sản phẩm cần đóng gói').max(200),
  boxStyle: z.enum(BOX_STYLES).optional(),
  lengthCm: z.coerce.number().positive('Nhập chiều dài (cm)').max(9999),
  widthCm: z.coerce.number().positive('Nhập chiều rộng (cm)').max(9999),
  heightCm: z.coerce.number().positive('Nhập chiều cao (cm)').max(9999),
  weightGrams: z.coerce.number().positive('Nhập trọng lượng (g)').max(999999),
  desiredQuantity: z.coerce.number().int().positive('Nhập số lượng thùng').max(1000000),
  // AI decides layers/flute/purchase cadence — dispatch-side only,
  // ignored downstream (mock/OpenAI/inference). Keep for old clients.
  preferredLayers: z.enum(['3', '5']).optional(),
  fluteType: z.string().trim().max(100).optional(),
  hasPrinting: z.boolean(),
  printFaces: z.enum(['2_main', '4_sides']).optional(),
  hasDesignFile: z.boolean().optional(),
  notes: z
    .string()
    .trim()
    .refine((v) => v === '' || v.trim().split(/\s+/).length <= 100)
    .optional(),
})

export type ConsultationInput = z.infer<typeof consultationInputSchema>

export async function createConsultation(input: ConsultationInput): Promise<{ id: string }> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('consultations')
    .insert({
      status: 'pending',
      product_type: input.productType,
      box_style: input.boxStyle ?? null,
      product_length: input.lengthCm,
      product_width: input.widthCm,
      product_height: input.heightCm,
      product_weight: input.weightGrams,
      desired_quantity: input.desiredQuantity,
      preferred_layers: input.preferredLayers ? Number(input.preferredLayers) : null,
      flute_type: input.fluteType ?? null,
      has_printing: input.hasPrinting,
      print_faces: input.hasPrinting ? (input.printFaces ?? null) : null,
      has_design_file: input.hasPrinting ? (input.hasDesignFile ?? null) : null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()
  if (error) throw new Error(`Failed to create consultation: ${error.message}`)
  return { id: data.id }
}

export async function updateAIRecommendation(id: string, recommendation: AIRecommendation): Promise<void> {
  const admin = await createAdminClient()
  const { error } = await admin
    .from('consultations')
    .update({
      status: 'ai_processed',
      ai_recommendation: recommendation,
      ai_suggested_product_id: recommendation.suggestedProductId ?? null,
      ai_suggested_dimensions: recommendation.outerDimensions ?? null,
      ai_suggested_layers: recommendation.layers ?? null,
      ai_confidence: recommendation.confidence ?? null,
      ai_processed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(`Failed to update consultation: ${error.message}`)
}

export async function getConsultation(id: string): Promise<ConsultationRow | null> {
  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('consultations')
    .select('*')
    .eq('id', id)
    .maybeSingle<ConsultationRow>()
  if (error) throw new Error(`Failed to fetch consultation: ${error.message}`)
  return data
}