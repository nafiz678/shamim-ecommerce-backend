import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { AppEnv, requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

export const orderRoutes = new Hono<AppEnv>()

orderRoutes.use('*', requireAuth)

const createOrderSchema = z.object({
  customer_name: z.string().min(2),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  shipping_address: z.string().min(10)
})

orderRoutes.get('/', async (c) => {
  const user = c.get('user')

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(
      `
      *,
      items:order_items(*)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Orders fetched successfully',
    data
  })
})

orderRoutes.post('/', zValidator('json', createOrderSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  const { data: cart } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!cart) {
    return c.json({ success: false, message: 'Cart is empty' }, 400)
  }

  const { data: cartItems, error: cartError } = await supabaseAdmin
    .from('cart_items')
    .select(
      `
      *,
      product:products(*)
    `
    )
    .eq('cart_id', cart.id)

  if (cartError) {
    return c.json({ success: false, message: cartError.message }, 500)
  }

  if (!cartItems || cartItems.length === 0) {
    return c.json({ success: false, message: 'Cart is empty' }, 400)
  }

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity
  }, 0)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      shipping_address: body.shipping_address,
      status: 'pending'
    })
    .select('*')
    .single()

  if (orderError || !order) {
    return c.json(
      {
        success: false,
        message: orderError?.message ?? 'Failed to create order'
      },
      500
    )
  }

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_title: item.product.title,
    price: item.product.price,
    quantity: item.quantity
  }))

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    return c.json({ success: false, message: itemsError.message }, 500)
  }

  await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id)

  return c.json({
    success: true,
    message: 'Order created successfully',
    data: order
  })
})