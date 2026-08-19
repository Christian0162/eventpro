import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase/firebase"
import { useEffect, useState } from "react"

export const useFetchContract = () => {
    const [contracts, setContracts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const unsubscribe = onSnapshot(collection(db, "contracts"), (onsnapshot) => {
                const contracts = onsnapshot.docs.map(contracts => ({ id: contracts.id, ...contracts.data() }))
                setContracts(contracts)
            })

            return () => unsubscribe()
        }

        catch (e) {
            console.error(e)
            setIsLoading(false)
        }


    }, [])

    return { contracts, isLoading }
}
