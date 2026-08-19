import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchUsers = () => {
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        try {
            const unsubscribe = onSnapshot(collection(db, "users"), (onsnapshot) => {
                setUsers(onsnapshot.docs.map(users => ({ id: users.id, ...users.data() })))
            })
            setIsLoading(false)
            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(false)
        }
    }, [])

    return { users, isLoading }
}