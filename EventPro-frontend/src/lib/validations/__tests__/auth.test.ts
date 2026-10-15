import { forgotPasswordSchema, loginSchema, registerSchema } from "../auth"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true)
  })

  it("rejects an invalid email with a friendly message", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "x" })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe("Enter a valid email address.")
  })

  it("requires a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false)
  })
})

describe("registerSchema", () => {
  const valid = { role: "Supplier", first_name: "Ana", last_name: "Cruz", email: "ana@x.com", password: "secret1" }

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects unknown roles, including Admin", () => {
    expect(registerSchema.safeParse({ ...valid, role: "Admin" }).success).toBe(false)
  })

  it("rejects short passwords", () => {
    expect(registerSchema.safeParse({ ...valid, password: "12345" }).success).toBe(false)
  })

  it("trims names and requires them", () => {
    expect(registerSchema.safeParse({ ...valid, first_name: "   " }).success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("validates email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false)
    expect(forgotPasswordSchema.safeParse({ email: "ok@x.com" }).success).toBe(true)
  })
})
