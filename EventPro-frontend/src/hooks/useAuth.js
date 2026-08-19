import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useFetchUsers } from "./useUsers";
import { useFetchEvents } from "./useEvents";
import { useFetchSuppliers } from "./useSupplier";
import { db } from "../firebase/firebase";
import bcrypt from "bcryptjs";
import Swal from "sweetalert2";
import { useState } from "react";

export const useAuthLogin = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const { users } = useFetchUsers()
    const { events } = useFetchEvents()
    const { suppliers } = useFetchSuppliers()

    const login = async (auth, email, password) => {
        try {
            setIsLoading(true)

            const user = await signInWithEmailAndPassword(auth, email, password);


            if (user) {

                const userData = users.find(users => users.id === user.user.uid)
                const userEvents = events.filter(event => event.user_id === user.user.uid)

                Swal.fire({
                    icon: 'success',
                    title: 'Signed in',
                    text: 'Successfully Signed in',
                    timer: 1000,
                    showConfirmButton: false
                })

                if (userData?.status === "deactivated" && userData?.role === "Event Planner") {
                    for (const event of userEvents) {
                        await updateDoc(doc(db, "events", event.id), { status: 'active' });
                    }

                    await updateDoc(doc(db, "users", userData?.id), {
                        status: 'active'
                    })
                }
                else if (userData?.status === "deactivated" && userData?.role === "Supplier") {
                    await updateDoc(doc(db, "shops", user.user.uid), {
                        status: 'active'
                    })

                    await updateDoc(doc(db, "users", userData?.id), {
                        status: 'active'
                    })
                }
            }
            else {
                console.log('no user found')
                setIsLoading(true)

            }
        }
        catch (e) {
            if (
                e.code === 'auth/invalid-credential' ||
                e.code === 'auth/invalid-credentials' ||
                e.code === 'auth/user-not-found' ||
                e.code === 'auth/wrong-password'
            ) {
                setError("Invalid email or password");
            }
            else if (e.code === 'auth/too-many-requests') {
                setError("Too many attempts. Please try again later.");
            }
            else if (e.code === 'auth/user-disabled') {
                setError("Account temporarily disabled due to suspicious activity. Please try again later or contact support.");
            }
            else {
                setError("Something went wrong. Please try again.");
            }

            console.error(e)
        }

        finally {
            setIsLoading(false)
        }
    }

    return { login, isLoading, error }

}

export const useAuthLogout = () => {

    const logout = async (auth) => {

        const userDocRef = doc(db, "users", auth?.currentUser?.uid);

        updateDoc(userDocRef, {
            is_online: false,
            last_active: serverTimestamp(),
        });

        Swal.fire({
            icon: 'success',
            title: 'Sign out',
            text: 'Successfully logout',
            timer: 1000,
            showConfirmButton: false

        })

        await signOut(auth)
    }

    return { logout }
}

export const useAuthRegister = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const register = async (auth, email, password, userData) => {
        try {
            setIsLoading(true)

            const user = await createUserWithEmailAndPassword(auth, email, password)

            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            console.log(userData)

            if (user) {
                Swal.fire({
                    icon: 'success',
                    title: 'Signed in',
                    text: 'Successfully registered',
                    timer: 1000,
                    showConfirmButton: false
                })

                await setDoc(doc(db, "users", user.user.uid), {
                    first_name: userData?.first_name,
                    last_name: userData?.last_name,
                    email_address: email,
                    password: hashedPassword,
                    role: userData?.role,
                    status: 'active',
                    verification_status: 'unverified',
                    deactivated_at: null,
                    deactivation_reason: null,
                    reported_total: null,
                    reported_history: null,
                    balance: userData?.role === "Supplier" ? 0 : null,
                    deactivation_history: [],
                    created_at: serverTimestamp()
                })

                await setDoc(doc(db, "userProfiles", user.user.uid), {
                    first_name: userData?.first_name,
                    last_name: userData?.last_name,
                    email_address: email,
                    description: '',
                    profile_pic: '',
                    contact_number: '',
                    created_at: serverTimestamp()
                })
            }

        }

        catch (e) {
            if (e.code === "auth/email-already-in-use") {
                setError("The email is already exist.");
                setIsLoading(false)
                return
            }
            else { setError('') }

            console.error(e``)
        }

        finally {
            setIsLoading(false)
        }
    }

    return { register, isLoading, error }
}

