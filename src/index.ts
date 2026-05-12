import { serve } from '@hono/node-server'
import { env } from './config/env.js'
import app from './app.js'

serve(
  {
    fetch: app.fetch,
    port: env.PORT || 3000
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`)
  }
)