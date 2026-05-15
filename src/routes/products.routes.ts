import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { productQuerySchema } from '../schemas/product.schema.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const productRoutes = new Hono()

productRoutes.get('/', zValidator('query', productQuerySchema), async (c) => {
  const query = c.req.valid('query')

  let request = supabaseAdmin
    .from('products')
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .eq('is_active', true).limit(9)

  if (query.search) {
    request = request.ilike('title', `%${query.search}%`)
  }

  if (query.brand) {
    request = request.eq('brand', query.brand)
  }

  if (query.minPrice !== undefined) {
    request = request.gte('price', query.minPrice)
  }

  if (query.maxPrice !== undefined) {
    request = request.lte('price', query.maxPrice)
  }

  if (query.category) {
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', query.category)
      .single()

    if (category) {
      request = request.eq('category_id', category.id)
    }
  }

  if (query.sort === 'price-asc') {
    request = request.order('price', { ascending: true })
  } else if (query.sort === 'price-desc') {
    request = request.order('price', { ascending: false })
  } else if (query.sort === 'rating-desc') {
    request = request.order('rating', { ascending: false })
  } else {
    request = request.order('created_at', { ascending: false })
  }

  const { data, error } = await request

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Products fetched successfully',
    data
  })
})

productRoutes.get('/landing', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `
      *,
      category:categories(*)
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(9)

  if (error) {
    return c.json(
      {
        success: false,
        message: error.message
      },
      500
    )
  }

  return c.json({
    success: true,
    message: 'Landing page products fetched successfully',
    data
  })
})

productRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      images:product_images(*)
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return c.json(
      {
        success: false,
        message: 'Product not found'
      },
      404
    )
  }

  return c.json({
    success: true,
    message: 'Product fetched successfully',
    data
  })
})