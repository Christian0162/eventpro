import { Link, useNavigate } from "react-router-dom"
import { Title } from "react-head"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import type { ForgotPasswordValues } from "@/types/auth"
import { friendlyFirebaseError } from "@/lib/firebase-errors"
import { notify } from "@/lib/notify"
import { AuthSplit } from "@/components/organisms/auth-split"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const labelClass = "text-xs font-medium uppercase tracking-wider text-muted-foreground"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    try {
      await sendPasswordResetEmail(getAuth(), email)
      notify.success("Reset email sent", "Check your inbox for the link to reset your password.")
      navigate("/login")
    } catch (error) {
      form.setError("email", { message: friendlyFirebaseError(error, "We couldn't send the reset email. Try again.") })
    }
  }

  return (
    <AuthSplit
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
      footer={
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to login
        </Link>
      }
    >
      <Title>Forgot password | EventPro</Title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="Email address" className="h-11 rounded-full px-4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="h-11 w-full rounded-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending…" : "Send reset email"}
          </Button>
        </form>
      </Form>
    </AuthSplit>
  )
}
