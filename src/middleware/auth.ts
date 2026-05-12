import { createMiddleware } from 'hono/factory'
import { supabaseAuthClient } from '../lib/supabase'

export type AuthUser = {
  id: string
  email?: string
}

export type AppEnv = {
  Variables: {
    user: AuthUser
  }
}

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        message: 'Missing authorization token'
      },
      401
    )
  }

  const token = authHeader.replace('Bearer ', '')

  const { data, error } = await supabaseAuthClient.auth.getUser(token)

  if (error || !data.user) {
    return c.json(
      {
        success: false,
        message: 'Invalid or expired token'
      },
      401
    )
  }

  const user: AuthUser = {
    id: data.user.id
  }

  if (data.user.email) {
    user.email = data.user.email
  }

  c.set('user', user)

  await next()
})

export const requireAdmin = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('x-admin-api-key')

  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return c.json(
      {
        success: false,
        message: 'Admin access denied'
      },
      403
    )
  }

  await next()
})