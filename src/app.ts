import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { env } from './config/env'
import { healthRoutes } from './routes/health.routes'
import { productRoutes } from './routes/products.routes'
import { categoryRoutes } from './routes/categories.routes'
import { cartRoutes } from './routes/cart.routes'
import { authRoutes } from './routes/auth.routes'

export const app = new Hono()

app.use('*', logger())
app.use('*', secureHeaders())

app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key'],
    credentials: true
  })
)

app.route('/health', healthRoutes);
app.route('/categories', categoryRoutes);
app.route('/products', productRoutes);
app.route('/cart', cartRoutes);
app.route('/auth', authRoutes);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Route not found'
    },
    404
  )
})

app.onError((error, c) => {
  console.error(error)

  return c.json(
    {
      success: false,
      message: 'Internal server error'
    },
    500
  )
})