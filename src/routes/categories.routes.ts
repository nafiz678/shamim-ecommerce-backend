import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase'

export const categoryRoutes = new Hono()

categoryRoutes.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({
    success: true,
    message: 'Categories fetched successfully',
    data
  })
})