import type { z } from "zod"
import type { forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validations/auth"

export type LoginValues = z.infer<typeof loginSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type RegisterValues = z.infer<typeof registerSchema>
