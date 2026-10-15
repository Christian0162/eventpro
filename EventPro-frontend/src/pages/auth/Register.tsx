import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Title } from "react-head"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { auth } from "@/firebase/firebase"
import { useAuthRegister } from "@/hooks/useAuth"
import { registerSchema, type RegisterValues } from "@/lib/validations/auth"
import { AuthCard } from "@/features/auth/AuthCard"
import { RoleStep } from "@/features/auth/RoleStep"
import { PasswordInput } from "@/components/forms/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export default function Register({ user }: { user: unknown }) {
  const [step, setStep] = useState<1 | 2>(1)
  const { register, error: registerError, isLoading } = useAuthRegister()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  })

  if (user) return <Navigate to="/dashboard" />

  const role = form.watch("role")

  const goToDetails = async () => {
    if (await form.trigger("role")) setStep(2)
  }

  const onSubmit = (v: RegisterValues) =>
    register(auth, v.email, v.password, { first_name: v.first_name, last_name: v.last_name, role: v.role })

  return (
    <AuthCard
      title="Create your account"
      description={step === 1 ? "First, tell us how you'll use EventPro." : "Just a few details to get you started."}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Title>Register | EventPro</Title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {step === 1 ? (
            <>
              <RoleStep
                value={role}
                error={form.formState.errors.role?.message}
                onChange={(r) => form.setValue("role", r, { shouldValidate: true })}
              />
              <Button type="button" className="w-full" onClick={goToDetails}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                <span>
                  Account type: <strong>{role}</strong>
                </span>
                <button type="button" onClick={() => setStep(1)} className="font-medium text-primary hover:underline">
                  Change
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {registerError && (
                <p role="alert" className="text-sm text-destructive">
                  {registerError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account…" : "Create account"}
              </Button>
            </>
          )}
        </form>
      </Form>
    </AuthCard>
  )
}
