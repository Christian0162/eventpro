// src/firebase/presence.js
import { ref, onDisconnect, set, serverTimestamp, onValue, } from "firebase/database";
import { doc, updateDoc, serverTimestamp as firestoreTimestamp, } from "firebase/firestore";
import { db, rtdb } from "./firebase"; // Firestore instance from firebase.js

export const setupUserPresence = (userId) => {

    const userStatusRef = ref(rtdb, `/status/${userId}`);
    const userDocRef = doc(db, "users", userId);

    const connectedRef = ref(rtdb, ".info/connected");

    onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) return;

        onDisconnect(userStatusRef)
            .set({
                state: "offline",
                last_changed: serverTimestamp(),
            })
        updateDoc(userDocRef, {
            is_online: true,
            last_active: firestoreTimestamp(),

        })
            .then(() => {
                set(userStatusRef, {
                    state: "online",
                    last_changed: serverTimestamp(),
                });
                updateDoc(userDocRef, {
                    is_online: true,
                    last_active: firestoreTimestamp(),
                });
            });
    });

    window.addEventListener("beforeunload", async () => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
            is_online: false,
            last_active: firestoreTimestamp(),
        });
    });
};
