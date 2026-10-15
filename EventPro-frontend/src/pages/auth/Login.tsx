import { Link, Navigate } from "react-router-dom"
import { Title } from "react-head"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { auth } from "@/firebase/firebase"
import { useAuthLogin } from "@/hooks/useAuth"
import { loginSchema, type LoginValues } from "@/lib/validations/auth"
import { AuthCard } from "@/features/auth/AuthCard"
import { PasswordInput } from "@/components/molecules/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export default function Login({ user }: { user: unknown }) {
  const { login, error: loginError, isLoading } = useAuthLogin()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  if (user) return <Navigate to="/dashboard" />

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to manage your events and bookings."
      footer={
        <>
          New to EventPro?{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Title>Login | EventPro</Title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => login(auth, v.email, v.password))} className="space-y-4" noValidate>
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
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {loginError && (
            <p role="alert" className="text-sm text-destructive">
              {loginError}
            </p>
          )}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in…" : "Login"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
