import { collection, doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase/firebase"
import { useEffect, useState } from "react"

export const useFetchSuppliers = () => {

    const [suppliers, setSuppliers] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const unsubscribe = onSnapshot(collection(db, "shops"), (onsnapshot) => {
                setSuppliers(onsnapshot.docs.map(suppliers => ({ id: suppliers.id, ...suppliers.data() })))
                setIsLoading(false)

            })
            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
            setIsLoading(false)
        }

    }, [])

    return { suppliers, isLoading }

}

export const useFetchSupplierById = (supplier_id) => {
    const [supplier, setSupplier] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        try {
            setIsLoading(true)

            const fetchSupplier = async () => {
                const onSnapShotSupplier = await getDoc(doc(db, "shops", supplier_id))
                setSupplier({ id: onSnapShotSupplier.id, ...onSnapShotSupplier.data() })
            }

            fetchSupplier()
        }

        catch (e) {
            console.error(e)
        }

        finally {
            setIsLoading(false)
        }

    }, [supplier_id])

    return { supplier, isLoading }
}

export const useFetchSupplierServices = () => {
    const [services, setServices] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        try {
            const unsubscribe = onSnapshot(collection(db, "services"), (onsnapshot) => {
                setServices(onsnapshot.docs.map(serv => ({ id: serv.id, ...serv.data() })))
                setIsLoading(false)
            })

            return () => unsubscribe()
        }
        catch (e) {
            console.error(e)
        }
    }, [])

    return { services, isLoading }
}


