import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.routes.js'
import { productRoutes } from './routes/products.routes.js'
import { categoryRoutes } from './routes/categories.routes.js'
import { cartRoutes } from './routes/cart.routes.js'
import { authRoutes } from './routes/auth.routes.js'

const app = new Hono()

app.use('*', logger())
app.use('*', secureHeaders())

const allowedOrigins = [
  'http://localhost:5173',
  env.FRONTEND_URL
]

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return origin
      }

      return ''
    },

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

export default app