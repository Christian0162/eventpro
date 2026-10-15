import { toast } from "@/components/ui/use-toast"
import { friendlyFirebaseError } from "./firebase-errors"

/** Single entry point for user-facing notifications. */
export const notify = {
  success: (message: string, description?: string) => toast({ title: message, description, variant: "success" }),
  error: (error: unknown, fallback?: string) =>
    toast({ title: friendlyFirebaseError(error, fallback), variant: "destructive" }),
  info: (message: string, description?: string) => toast({ title: message, description, variant: "info" }),
  warning: (message: string, description?: string) => toast({ title: message, description, variant: "warning" }),

  /** Shows loading, then success or error once the promise settles. */
  async promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error?: string },
  ): Promise<T> {
    const pending = toast({ title: messages.loading, variant: "info", duration: Infinity })
    try {
      const result = await promise
      pending.update({ title: messages.success, variant: "success", duration: 5000 })
      return result
    } catch (error) {
      pending.update({
        title: friendlyFirebaseError(error, messages.error),
        variant: "destructive",
        duration: 5000,
      })
      throw error
    }
  },
}
