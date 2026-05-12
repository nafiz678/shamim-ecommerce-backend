import { z } from 'zod'

export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z
    .enum(['newest', 'price-asc', 'price-desc', 'rating-desc'])
    .optional()
})

export const createProductSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  old_price: z.number().nonnegative().optional(),
  brand: z.string().optional(),
  category_id: z.string().uuid().optional(),
  stock: z.number().int().nonnegative().default(0),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  rating: z.number().min(0).max(5).default(0),
  images: z.array(z.string().url()).default([])
})