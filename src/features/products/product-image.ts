const STOCK_IMAGE_BY_CATEGORY: Record<string, string> = {
  'carton-3-layer': 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789317936/3_layer.png',
  'carton-5-layer': 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789317934/5_layer.png',
  corrugated: 'https://res.cloudinary.com/dbq76uhcf/image/upload/v1789317935/e_flute.png',
}

export function getStockProductImageUrl(product?: {
  imageUrl?: string | null
  image_url?: string | null
  category?: string | null
} | null) {
  if (!product) return null
  return product.imageUrl ?? product.image_url ?? STOCK_IMAGE_BY_CATEGORY[product.category ?? ''] ?? null
}
