import { z } from 'zod'

export const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1)
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive()
})