import { useUIStore } from "../useUIStore"
import { useSessionStore } from "../useSessionStore"

describe("useUIStore", () => {
  it("updates mobile nav state", () => {
    useUIStore.getState().setMobileNavOpen(true)
    expect(useUIStore.getState().mobileNavOpen).toBe(true)
  })
})

describe("useSessionStore", () => {
  it("starts initializing and becomes ready", () => {
    expect(useSessionStore.getState().status).toBe("initializing")
    useSessionStore.getState().markReady()
    expect(useSessionStore.getState().status).toBe("ready")
  })

  it("reset clears user and profile but keeps readiness", () => {
    useSessionStore.getState().setUserData({ id: "u1", role: "Supplier" })
    useSessionStore.getState().reset()
    expect(useSessionStore.getState().userData).toBeNull()
    expect(useSessionStore.getState().status).toBe("ready")
  })
})
