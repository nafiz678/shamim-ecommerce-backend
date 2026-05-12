import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { supabaseAdmin } from '../lib/supabase.js';

export const authRoutes = new Hono();

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const body = c.req.valid('json');

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email.trim().toLowerCase(),
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.fullName.trim(),
    },
  });

  if (error) {
    return c.json(
      {
        success: false,
        message: error.message,
      },
      400,
    );
  }

  return c.json(
    {
      success: true,
      message: 'Account created successfully',
      data: {
        id: data.user.id,
        email: data.user.email,
      },
    },
    201,
  );
});