import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchAllVerification = () => {
    const [verifications, setVerifications] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        try {
            const unsubscribe = onSnapshot(collection(db, 'verification'), (onsnapshot) => {
                setVerifications(onsnapshot.docs.map(v => ({ id: v.id, ...v.data() })))
                setIsLoading(false)
            })

            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(true)
        }
    }, [])

    return {
        verifications, isLoading
    }
}