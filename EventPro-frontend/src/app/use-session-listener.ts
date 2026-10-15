import { useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore"
import { auth, db } from "@/firebase/firebase"
import { setupUserPresence } from "@/firebase/presence"
import { useSessionStore } from "@/stores/use-session-store"
import type { UserData } from "@/types/session"

/**
 * Subscribes to Firebase auth and the signed-in user's profile document.
 * The session is "ready" only once auth is resolved AND (when signed in) the
 * profile snapshot has arrived, so private pages never flash empty.
 */
export function useSessionListener() {
  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | null = null
    const { setUser, setUserData, markReady, reset } = useSessionStore.getState()

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.()
      unsubscribeProfile = null

      if (!firebaseUser) {
        reset()
        markReady()
        return
      }

      setUser(firebaseUser)
      setupUserPresence(firebaseUser.uid)

      unsubscribeProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snapshot) => {
          setUserData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as UserData) : null)
          markReady()
        },
        (error) => {
          console.error("Profile subscription failed:", error)
          setUserData(null)
          markReady()
        },
      )
    })

    return () => {
      unsubscribeProfile?.()
      unsubscribeAuth()
    }
  }, [])
}
