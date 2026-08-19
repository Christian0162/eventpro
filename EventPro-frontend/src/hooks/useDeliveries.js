import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchDeliveries = () => {
    const [deliveries, setDeliveries] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const unsubscribe = onSnapshot(collection(db, "deliveries"), (onsnapshot) => {
                setDeliveries(onsnapshot.docs.map(deliveries => ({ id: deliveries.id, ...deliveries.data() })))
            })
            setIsLoading(false)
            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(false)
        }
    }, [])

    return { deliveries, isLoading }
}