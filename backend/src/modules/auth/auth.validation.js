const { z } = require('zod');
const { ALL_ROLES } = require('../../constants/roles.constant');

const registerSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .trim(),
    lastName: z
      .string()
      .max(50, 'Last name cannot exceed 50 characters')
      .trim()
      .optional(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    phone: z.string().trim().optional(),
    role: z.enum(ALL_ROLES).optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),
    password: z.string({ required_error: 'Password is required' })
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema
};

