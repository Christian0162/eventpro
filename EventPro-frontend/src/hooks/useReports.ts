import type { Doc } from "../types/firestore";
import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchAllReports = () => {
    const [reports, setReports] = useState<Doc[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)

        try {
            const unsubscribe = onSnapshot(collection(db, "reports"), (onsnapshot) => {
                setReports(onsnapshot.docs.map(r => ({ id: r.id, ...r.data() })))
                setIsLoading(true)
            })

            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(false)
        }
    }, [])

    return { reports, isLoading }
}