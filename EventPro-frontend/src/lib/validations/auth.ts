import { z } from "zod"

export const ROLES = ["Event Planner", "Supplier"] as const

const email = z.string().trim().min(1, "Enter your email.").email("Enter a valid email address.")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
})
export type LoginValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({ email })
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const registerRoleSchema = z.object({
  role: z.enum(ROLES, { message: "Choose an account type to continue." }),
})

export const registerSchema = registerRoleSchema.extend({
  first_name: z.string().trim().min(1, "Enter your first name.").max(50, "First name is too long."),
  last_name: z.string().trim().min(1, "Enter your last name.").max(50, "Last name is too long."),
  email,
  password: z.string().min(6, "Password must be at least 6 characters."),
})
export type RegisterValues = z.infer<typeof registerSchema>
