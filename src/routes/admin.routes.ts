import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createProductSchema } from '../schemas/product.schema.js'
import { requireAdmin } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const adminRoutes = new Hono()

adminRoutes.use('*', requireAdmin)

adminRoutes.post('/products', zValidator('json', createProductSchema), async (c) => {
  const body = c.req.valid('json')
  const { images, ...productPayload } = body

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert(productPayload)
    .select('*')
    .single()

  if (error || !product) {
    return c.json(
      {
        success: false,
        message: error?.message ?? 'Failed to create product'
      },
      500
    )
  }

  if (images.length > 0) {
    const imageRows = images.map((imageUrl, index) => ({
      product_id: product.id,
      image_url: imageUrl,
      alt_text: product.title,
      sort_order: index + 1
    }))

    const { error: imageError } = await supabaseAdmin
      .from('product_images')
      .insert(imageRows)

    if (imageError) {
      return c.json({ success: false, message: imageError.message }, 500)
    }
  }

  return c.json({
    success: true,
    message: 'Product created successfully',
    data: product
  })
})

adminRoutes.patch('/products/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return c.json({ success: false, message: 'Product not found' }, 404)
  }

  return c.json({
    success: true,
    message: 'Product updated successfully',
    data
  })
})

adminRoutes.delete('/products/:id', async (c) => {
  const id = c.req.param('id')

  const { error } = await supabaseAdmin
    .from('products')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Product disabled successfully'
  })
})