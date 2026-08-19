import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase/firebase"
import { useEffect, useState } from "react"

export const useFetchAllContact = () => {
    const [contacts, setContacts] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        try {
            const unsubscribe = onSnapshot(collection(db, "contacts"), (onsnapshot) => {
                setContacts(onsnapshot.docs.map(contracts => ({ id: contracts.id, ...contracts.data() })))
                setIsLoading(false)
            })

            return () => unsubscribe()
        }

        catch (e) {
            console.error(e)
            setIsLoading(false)
        }


    }, [])

    return { contacts, isLoading }
}
