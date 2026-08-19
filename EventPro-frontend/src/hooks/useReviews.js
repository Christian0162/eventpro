import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { db } from "../firebase/firebase"

export const useFetchReviews = () => {
    const [reviews, setReviews] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        try {

            const unsubscribe = onSnapshot(collection(db, "reviews"), (onsnapshot) => {
                setReviews(onsnapshot.docs.map(rev => ({ id: rev.id, ...rev.data() })))
                setIsLoading(false)
            })

            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(false)
        }

    }, [])

    return { reviews, isLoading }
}

export const useFetchReviewsById = (id) => {
    const [reviews, setReviews] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const q = query(collection(db, "reviews"),
        where('user_id', '===', id))

    useEffect(() => {
        if (!id) return
        try {
            const unsubscribe = onSnapshot(q, (onsnapshot) => {
                setReviews(onsnapshot.docs.map(review => ({ id: review.id, ...review.data() })))
            })

            setIsLoading(false)
            return () => unsubscribe()
        }

        catch (e) {
            console.error(e)
            setIsLoading(false)
        }

    }, [id, q])

    return { reviews, isLoading }
}