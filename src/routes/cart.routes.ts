import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { addToCartSchema, updateCartItemSchema } from '../schemas/cart.schema'

export const cartRoutes = new Hono<AppEnv>()

cartRoutes.use('*', requireAuth)

async function getOrCreateCart(userId: string) {
  const existing = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing.data) return existing.data

  const created = await supabaseAdmin
    .from('carts')
    .insert({ user_id: userId })
    .select('*')
    .single()

  if (created.error) throw created.error

  return created.data
}

cartRoutes.get('/', async (c) => {
  const user = c.get('user')
  const cart = await getOrCreateCart(user.id)

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select(
      `
      *,
      product:products(
        *,
        images:product_images(*)
      )
    `
    )
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Cart fetched successfully',
    data
  })
})

cartRoutes.post('/', zValidator('json', addToCartSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const cart = await getOrCreateCart(user.id)

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, stock, is_active')
    .eq('id', body.product_id)
    .single()

  if (!product || !product.is_active) {
    return c.json({ success: false, message: 'Product not available' }, 404)
  }

  if (product.stock < body.quantity) {
    return c.json({ success: false, message: 'Not enough stock' }, 400)
  }

  const { data: existingItem } = await supabaseAdmin
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', body.product_id)
    .single()

  if (existingItem) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({
        quantity: existingItem.quantity + body.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingItem.id)
      .select('*')
      .single()

    if (error) return c.json({ success: false, message: error.message }, 500)

    return c.json({
      success: true,
      message: 'Cart item updated',
      data
    })
  }

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert({
      cart_id: cart.id,
      product_id: body.product_id,
      quantity: body.quantity
    })
    .select('*')
    .single()

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Product added to cart',
    data
  })
})

cartRoutes.patch('/:itemId', zValidator('json', updateCartItemSchema), async (c) => {
  const user = c.get('user')
  const itemId = c.req.param('itemId')
  const body = c.req.valid('json')
  const cart = await getOrCreateCart(user.id)

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({
      quantity: body.quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .eq('cart_id', cart.id)
    .select('*')
    .single()

  if (error || !data) {
    return c.json({ success: false, message: 'Cart item not found' }, 404)
  }

  return c.json({
    success: true,
    message: 'Cart item updated',
    data
  })
})

cartRoutes.delete('/:itemId', async (c) => {
  const user = c.get('user')
  const itemId = c.req.param('itemId')
  const cart = await getOrCreateCart(user.id)

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cart.id)

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Cart item removed'
  })
})