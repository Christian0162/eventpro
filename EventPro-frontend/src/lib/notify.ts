import { toast } from "sonner"
import { friendlyFirebaseError } from "./firebase-errors"

/**
 * Single entry point for user-facing notifications.
 * Pass a stable `id` per operation so repeated triggers replace rather than stack.
 */
export const notify = {
  success: (message: string, description?: string) => toast.success(message, { description }),
  error: (error: unknown, fallback?: string) => toast.error(friendlyFirebaseError(error, fallback)),
  info: (message: string, description?: string) => toast.info(message, { description }),
  warning: (message: string, description?: string) => toast.warning(message, { description }),

  /** Shows loading, then success or error once the promise settles. */
  async promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error?: string },
  ): Promise<T> {
    const id = toast.loading(messages.loading)
    try {
      const result = await promise
      toast.success(messages.success, { id })
      return result
    } catch (error) {
      toast.error(friendlyFirebaseError(error, messages.error), { id })
      throw error
    }
  },
}
