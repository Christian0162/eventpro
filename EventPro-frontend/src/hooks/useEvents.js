import Swal from "sweetalert2";
import { addDoc, collection, updateDoc, doc, deleteDoc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useFetchEvents = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true)
        try {
            const unsubscribe = onSnapshot(collection(db, "events"), (onsnapshot) => {
                setEvents(
                    onsnapshot.docs.map((events) => ({ id: events.id, ...events.data() }))
                );
                setIsLoading(false)
            });

            return () => unsubscribe();
        }

        catch (e) {
            console.error(e);
            setIsLoading(false);
        }

    }, []);

    return { events, isLoading };
};

export const useFetchEventsById = (id) => {
    const [events, setEvent] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!id) return

        setIsLoading(true);

        try {
            const q = query(collection(db, "events"),
                where('user_id', '==', id))

            const unsubscribe = onSnapshot(q, (onsnapshot) => {
                setEvent(onsnapshot.docs.map(event => ({ id: event.id, ...event.data() })))
                setIsLoading(false);

            })

            return () => unsubscribe()
        } catch (e) {
            console.error(e);
        }
    }, [id]);

    return { events, isLoading };
};

export const useAddEvent = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate()

    const addEvent = async (id, data) => {
        setIsLoading(true);
        try {
            const event = await addDoc(collection(db, "events"), {
                user_id: id,
                event_name: data.event_name,
                event_location: data.event_location,
                event_date: data.event_date,
                event_time: data.event_time,
                event_type: data.event_type,
                event_budget: data.event_budget,
                event_description: data.event_description,
                event_categories: data.event_categories,
                event_background: data.event_background || "",
                status: "active",
                created_at: serverTimestamp(),
            });

            Swal.fire({
                icon: "success",
                title: "Added",
                text: `${data.event_name}'s data has been added`,
                showConfirmButton: false,
                timer: 1000,
            });
            navigate('/events')
        } catch (e) {
            console.error(e);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    return { addEvent, isLoading };
};


export const useUpdateEvent = () => {
    const [isLoading, setIsLoading] = useState(false)

    const updateEvent = async (id, data) => {
        setIsLoading(true)

        try {
            await updateDoc(doc(db, 'events', id), {
                event_name: data.event_name,
                event_location: data.event_location,
                event_date: data.event_date,
                event_time: data.event_time,
                event_type: data.event_type,
                event_budget: data.event_budget,
                event_description: data.event_description,
                event_categories: data.event_categories,
                updated_at: serverTimestamp()

            })
            Swal.fire({
                icon: 'success',
                title: 'Update',
                text: `${data.event_name} has been updated successfully.`,
                showConfirmButton: false,
                timer: 1000
            })
        }
        catch (error) {
            setIsLoading(false)
            console.error(error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update',
                confirmButtonText: 'Continue',
                timer: 1000
            })
        }

        finally {
            setIsLoading(false)
        }
    }

    return { updateEvent, isLoading }
}

export const useDeleteEvent = () => {
    const [isLoading, setIsLoading] = useState(false)

    const deleteEvent = (id) => {
        setIsLoading(true)

        try {
            Swal.fire({
                icon: 'warning',
                title: 'are you sure?',
                text: "You won't be able to revert this!",
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete it',
                cancelButtonText: 'No, Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteDoc(doc(db, "events", id))
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: `Event has been deleted.`,
                        showConfirmButton: false,
                        timer: 1000,
                    })
                }
            })
        }

        catch (e) {
            console.error(e)
            setIsLoading(false)
        }

        finally {
            setIsLoading(false)
        }
    }

    return { deleteEvent, isLoading }
}

