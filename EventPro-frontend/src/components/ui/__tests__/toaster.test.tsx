import { act, render, screen } from "@testing-library/react"
import { Toaster } from "../toaster"
import { notify } from "@/lib/notify"

describe("Toaster", () => {
  it("renders a notification triggered through notify", async () => {
    render(<Toaster />)
    act(() => {
      notify.success("Saved", "All changes stored")
    })
    expect(await screen.findByText("Saved")).toBeInTheDocument()
    expect(screen.getByText("All changes stored")).toBeInTheDocument()
  })
})
