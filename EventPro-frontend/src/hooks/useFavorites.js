import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchFavorites = () => {
    const [favorites, setFavorites] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        try {
            const unsubscribe = onSnapshot(collection(db, "favorites"), (onsnapshot) => {
                setFavorites(onsnapshot.docs.map(favorite => ({ id: favorite.id, ...favorite.data() })))
                setIsLoading(false)

            })

            return () => unsubscribe()
        }

        catch (e) {
            console.error(e)
            setIsLoading(false)
        }

    }, [])

    return { favorites, isLoading }
}