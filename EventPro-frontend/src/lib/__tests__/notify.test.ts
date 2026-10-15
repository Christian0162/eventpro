import { toast } from "@/components/ui/use-toast"
import { friendlyFirebaseError } from "../firebase-errors"
import { notify } from "../notify"

jest.mock("@/components/ui/use-toast", () => ({ toast: jest.fn() }))

describe("friendlyFirebaseError", () => {
  it("maps known auth codes", () => {
    expect(friendlyFirebaseError({ code: "auth/email-already-in-use" })).toMatch(/already exists/)
  })

  it("never leaks raw error text for unknown errors", () => {
    expect(friendlyFirebaseError(new Error("internal stack details"))).toBe("Something went wrong. Try again.")
  })
})

describe("notify.promise", () => {
  const update = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(toast as jest.Mock).mockReturnValue({ id: "1", dismiss: jest.fn(), update })
  })

  it("shows loading, then updates it to success only after resolve", async () => {
    await notify.promise(Promise.resolve(1), { loading: "Saving…", success: "Saved" })
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Saving…" }))
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ title: "Saved", variant: "success" }))
  })

  it("shows a friendly error and rethrows on failure", async () => {
    await expect(
      notify.promise(Promise.reject({ code: "permission-denied" }), { loading: "Saving…", success: "Saved" }),
    ).rejects.toBeDefined()
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ title: "You don't have permission to do that.", variant: "destructive" }),
    )
  })
})
