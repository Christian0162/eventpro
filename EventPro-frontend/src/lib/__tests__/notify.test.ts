import { toast } from "sonner"
import { friendlyFirebaseError } from "../firebase-errors"
import { notify } from "../notify"

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn(), loading: jest.fn(() => "toast-id") },
}))

describe("friendlyFirebaseError", () => {
  it("maps known auth codes", () => {
    expect(friendlyFirebaseError({ code: "auth/email-already-in-use" })).toMatch(/already exists/)
  })

  it("never leaks raw error text for unknown errors", () => {
    expect(friendlyFirebaseError(new Error("internal stack details"))).toBe("Something went wrong. Try again.")
  })
})

describe("notify.promise", () => {
  beforeEach(() => jest.clearAllMocks())

  it("replaces the loading toast with success only after resolve", async () => {
    await notify.promise(Promise.resolve(1), { loading: "Saving…", success: "Saved" })
    expect(toast.loading).toHaveBeenCalledWith("Saving…")
    expect(toast.success).toHaveBeenCalledWith("Saved", { id: "toast-id" })
  })

  it("shows a friendly error and rethrows on failure", async () => {
    await expect(
      notify.promise(Promise.reject({ code: "permission-denied" }), { loading: "Saving…", success: "Saved" }),
    ).rejects.toBeDefined()
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("You don't have permission to do that.", { id: "toast-id" })
  })
})
