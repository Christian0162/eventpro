import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchAllApplication = () => {
    const [applications, setApplications] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        setIsLoading(true)
        try {
            const unsubscribe = onSnapshot(collection(db, "applications"), (onsnapshot) => {
                setApplications(onsnapshot.docs.map(app => ({ id: app.id, ...app.data() })))
                setIsLoading(false)
            })

            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(false)
        }
    }, [])


    return {
        applications,
        isLoading
    }
}