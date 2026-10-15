import { resolveTheme, useUIStore } from "../useUIStore"
import { useSessionStore } from "../useSessionStore"

describe("useUIStore", () => {
  it("updates theme and mobile nav state", () => {
    useUIStore.getState().setTheme("dark")
    useUIStore.getState().setMobileNavOpen(true)
    expect(useUIStore.getState().theme).toBe("dark")
    expect(useUIStore.getState().mobileNavOpen).toBe(true)
  })

  it("persists only the theme", () => {
    useUIStore.getState().setTheme("light")
    useUIStore.getState().setMobileNavOpen(true)
    const stored = JSON.parse(localStorage.getItem("eventpro-ui") ?? "{}")
    expect(stored.state).toEqual({ theme: "light" })
  })

  it("resolves explicit themes without consulting the OS", () => {
    expect(resolveTheme("dark")).toBe("dark")
    expect(resolveTheme("light")).toBe("light")
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
