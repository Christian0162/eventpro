import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Send } from 'lucide-react';
import { getDocs, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useFetchUsers } from "../../hooks/useUsers";
import { useFetchUserProfiles } from "../../hooks/useProfile";
import { useFetchSuppliers } from "../../hooks/useSupplier";
import { useFetchAllContact } from "../../hooks/useContact";
import PageLoading from "../../components/PageLoading";
import { Title } from "react-head";


export default function ChatWindow({ userData }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const [selectedContact, setSelectedContact] = useState(null);
    const [message, setMessage] = useState('');
    const [contacts, setContacts] = useState([]);
    const [messages, setMessages] = useState([])
    const [isSending, setIsSending] = useState(false)
    const [contractUserStatus, setContactUserStatus] = useState([])
    const [shop, setShop] = useState([])
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);
    const { users, isLoading: isUserLoading } = useFetchUsers()
    const { userProfiles, isLoading: isUserProfileLoading } = useFetchUserProfiles()
    const { suppliers, isLoading: isSupplierLoading } = useFetchSuppliers()
    const { contacts: allContacts, isLoading: isContactLoading } = useFetchAllContact()
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);

    const isAllLoading = isSupplierLoading || isUserProfileLoading || isUserLoading || isContactLoading

    const selectedUser = users?.find(u => u.id === selectedContact?.contact_id)

    const bothContacts = allContacts.find(c => c.user_id === selectedContact?.contact_id && c.contact_id === userData.id)

    let selecteData = []

    if (selectedUser?.role === "Event Planner") {
        const userProfile = userProfiles?.find(u => u.id === selectedUser?.id)
        selecteData = userProfile
    }
    else {
        const supplierProfile = suppliers?.find(s => s.id === selectedUser?.id)
        selecteData = supplierProfile
    }


    // console.log(selectedContact)
    useEffect(() => {
        if (!selectedContact) return;

        const fetchContactStatus = async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", selectedContact.contact_id));
                if (userDoc.exists()) {
                    setContactUserStatus({ id: userDoc.id, ...userDoc.data() }); // or whatever field indicates status
                    await updateDoc(doc(db, "contacts", selectedContact.id), {
                        unread: false
                    })
                }
            } catch (error) {
                console.error("Error fetching contact status:", error);
            }
        };

        fetchContactStatus();
    }, [selectedContact]);

    const isContactDeactivated = contractUserStatus.id === selectedContact?.contact_id && contractUserStatus?.status === "deactivated";

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const fetchData = async () => {
            const onSnapShop = await getDocs(collection(db, "shops"))
            const shop = onSnapShop.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            const filteredShop = shop.filter(shop => shop.id === userData.id)

            setShop(filteredShop[0] || null)
        }
        fetchData()
    }, [])

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "contacts"), (snapshot) => {
            const fetchedContacts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const filteredContacts = fetchedContacts.filter(c => c.user_id === userData.id)

            if (!id && filteredContacts.length > 0) {
                navigate(`/chats/${filteredContacts[0].id}`, { replace: true });
            }

            if (id) {
                const selected = filteredContacts.find(c => c.id === id);
                if (selected) {
                    setSelectedContact(selected);
                }
            }
            setContacts(filteredContacts);

        });

        return () => unsubscribe()
    }, [id, navigate]);

    useEffect(() => {
        if (!selectedContact) return
        setIsMessagesLoading(true)
        const messageQuery = query(collection(db, "messages"),
            where("sender_id", "in", [userData.id, selectedContact.contact_id]),
            where("recipient_id", "in", [userData.id, selectedContact.contact_id]),
            orderBy("timestamp", "asc"))

        const unsubscribe = onSnapshot(messageQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            const filterMsgs = msgs.filter(msg => (msg.sender_id === userData.id && msg.recipient_id === selectedContact.contact_id) ||
                (msg.sender_id === selectedContact.contact_id && msg.recipient_id === userData.id))

            setMessages(filterMsgs)
            setIsMessagesLoading(false)
        }, (error) => {
            console.error("Error fetching messages:", error);
            setIsMessagesLoading(false);
        });

        return () => unsubscribe()
    }, [selectedContact, userData])

    const enterTrigger = (e) => {
        if (e.key === "Enter") {
            if (!isSending && !isContactDeactivated) {
                handleSendMessage()
            }
        }
    }

    const filteredContacts = contacts.filter((contact) =>
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedContact || isContactDeactivated) return;

        setIsSending(true)

        const contactsRef = collection(db, "contacts");

        const q = query(contactsRef,
            where("user_id", "==", selectedContact.contact_id),
            where("contact_id", "==", userData.id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            const contact = await setDoc(doc(contactsRef), {
                user_id: selectedContact.contact_id,
                contact_id: userData.id,
                name: userData?.role === "Event Planner" ? userData.first_name : shop.supplier_name,
                last_message: message,
                unread: true,
                created_at: serverTimestamp()
            });

        };

        if (bothContacts?.id) {
            await updateDoc(doc(db, "contacts", bothContacts.id), {
                last_message: message,
                unread: true
            });
        }

        await addDoc(collection(db, "messages"), {
            sender_id: userData.id,
            recipient_id: selectedContact.contact_id,
            text: message,
            timestamp: serverTimestamp()
        });
        setMessage('');

        setIsSending(false)
    }


    return (
        <>
            {isAllLoading && (
                <PageLoading />
            )}

            {!isAllLoading && (
                <>
                    <Title>Chats</Title>
                    <h1 className="mb-5 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chat</h1>
                    <div className="flex h-[90vh] shadow-xl bg-white border border-gray-200 rounded-2xl overflow-hidden">

                        {/* Sidebar */}
                        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
                            {/* Search */}
                            <div className="p-4 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search contacts..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Contacts List */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredContacts.length === 0 ? (
                                    <div className="text-gray-500 flex justify-center mt-56">
                                        {contacts.length === 0 ? "No contacts" : "No matches"}
                                    </div>
                                ) : (
                                    filteredContacts.map((contact) => {
                                        const selectedUser = users?.find(u => u.id === contact.contact_id)

                                        let contactData = []

                                        if (selectedUser?.role === "Event Planner") {
                                            const userProfile = userProfiles?.find(u => u.id === selectedUser?.id)
                                            contactData = userProfile
                                        }
                                        else {
                                            const supplierProfile = suppliers?.find(s => s.id === selectedUser?.id)
                                            contactData = supplierProfile
                                        }

                                        return (
                                            <div
                                                key={contact.id}
                                                onClick={() => navigate(`/chats/${contact.id}`)}
                                                className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 
        ${selectedContact?.id === contact.id
                                                        ? 'bg-blue-50 border-l-4 border-blue-600'
                                                        : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-full relative flex items-center justify-center text-white font-semibold
        ${selectedContact?.id === contact.id ? 'bg-blue-600' : 'bg-gray-400'}`}>

                                                    {contactData?.profile_pic || contactData?.supplier_background_image ? (
                                                        <img src={contactData?.profile_pic || contactData?.supplier_background_image} alt="" className='h-full w-full rounded-full object-cover' />
                                                    ) : (
                                                        contact.avatar?.toUpperCase() || contact.name?.[0]?.toUpperCase()
                                                    )}

                                                    <span
                                                        className={`absolute bottom-0 right-0 left-6 top-7 inline-block w-4 h-4 rounded-full ${selectedUser?.is_online ? "bg-green-500" : "bg-gray-400"
                                                            }`}
                                                    ></span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate">
                                                        <div className="flex items-baseline gap-2">
                                                            {/* Name */}
                                                            <span className="truncate">{contact.name}</span>

                                                            {/* Online/offline dot + label */}
                                                            <div className="flex items-center gap-1">
                                                                <span
                                                                    className={`text-xs font-medium ${selectedUser?.is_online ? "text-green-600" : "text-gray-500"
                                                                        }`}
                                                                >
                                                                    {selectedUser?.is_online ? "Active now" : "Offline"}
                                                                </span>
                                                            </div>

                                                            {/* Deactivated badge */}
                                                            {selectedUser?.status === "deactivated" && (
                                                                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                                                    Deactivated
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Last message */}
                                                    <div className={`text-sm  ${contact.unread ? 'font-semibold' : 'text-gray-500'} truncate`}>
                                                        {contact?.last_message || "No message yet"}
                                                    </div>
                                                </div>

                                            </div>
                                        )
                                    })
                                )}

                            </div>
                        </div>

                        {isMessagesLoading ? (
                            <div className="w-full h-full flex justify-center items-center">
                                <PageLoading />
                            </div>
                        ) : (
                            <>
                                {/* Chat Area */}
                                <div className="flex-1 flex flex-col">
                                    {/* Chat Header */}
                                    <div className="p-4 bg-white border-b border-gray-200">
                                        {selectedContact ? (
                                            <div className="flex justify-between items-center gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {selecteData?.profile_pic || selecteData?.supplier_background_image ? (
                                                            <img src={selecteData?.profile_pic || selecteData?.supplier_background_image} alt="" className='h-full w-full rounded-full object-cover' />
                                                        ) : (
                                                            selectedContact.name?.[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h2 className="font-semibold text-gray-900 text-lg">{selectedContact.name}</h2>
                                                        {isContactDeactivated && (
                                                            <p className="text-sm text-red-600">This user is deactivated</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 italic">Select a contact and start chatting</div>
                                        )}
                                    </div>

                                    {/* Messages */}
                                    <div ref={messagesEndRef} className="flex-1 p-6 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300">
                                        <div className="space-y-4">
                                            {selectedContact && messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.sender_id === userData.id ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className="flex flex-col space-y-1 max-w-xs lg:max-w-md">
                                                        <span className="text-xs text-gray-500">
                                                            {msg.sender_id === userData.id ? 'You' : selectedContact.name}
                                                        </span>
                                                        <div
                                                            className={`px-4 py-2 rounded-2xl text-sm shadow
                                            ${msg.sender_id === userData.id
                                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                                                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                                                                }`}
                                                        >
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <div className="p-4 bg-white border-t border-gray-200">
                                        {isContactDeactivated ? (
                                            <div className="text-center p-3 bg-gray-100 text-gray-500 rounded-lg">
                                                Cannot send messages to deactivated users
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={message}
                                                    onKeyDown={enterTrigger}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Type your message..."
                                                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    disabled={isContactDeactivated}
                                                />
                                                <button
                                                    disabled={isSending || isContactDeactivated}
                                                    onClick={handleSendMessage}
                                                    className={`p-3 rounded-full transition ${isSending || isContactDeactivated
                                                        ? 'bg-gray-200 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </>
    );
}