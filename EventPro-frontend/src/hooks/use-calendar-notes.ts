import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from "firebase/firestore"
import { useCallback, useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export type CalendarNote = { id: string; user_id: string; date: string; text: string }

/** Personal notes pinned to calendar days (`date` is `yyyy-MM-dd`). */
export const useCalendarNotes = (userId?: string) => {
    const [notes, setNotes] = useState<CalendarNote[]>([])

    useEffect(() => {
        if (!userId) return
        const q = query(collection(db, "calendar_notes"), where("user_id", "==", userId))
        return onSnapshot(q, snap => {
            setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }) as CalendarNote))
        })
    }, [userId])

    const addNote = useCallback(
        (date: string, text: string) =>
            addDoc(collection(db, "calendar_notes"), { user_id: userId, date, text, created_at: serverTimestamp() }),
        [userId]
    )

    const deleteNote = useCallback((id: string) => deleteDoc(doc(db, "calendar_notes", id)), [])

    return { notes, addNote, deleteNote }
}
