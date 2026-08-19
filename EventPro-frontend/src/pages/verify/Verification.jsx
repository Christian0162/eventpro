import Select from "react-select"
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import AddressAutocomplete from "../../components/AddressAutoComplete";
import { FileText, IdCard } from "lucide-react";
import VerificationCheckbox from "../../components/VerificationCheckBox";
import { auth, db } from "../../firebase/firebase";
import { setDoc, doc, getDoc, updateDoc, query, where, serverTimestamp, addDoc, collection } from "firebase/firestore";
import UploadWidget from "../../components/UploadWidgen";
import { SupplierOptions, idOptions, documentOptions, exampleIds, exampleDocuments } from "../../constants/categories";
import Swal from "sweetalert2";
import LoadingOverlay from "../../components/LoadingOverlay";
import PageLoading from "../../components/PageLoading";
import { useFetchSuppliers } from "../../hooks/useSupplier";

export default function Verification({ userData }) {

    const [errorId, setErrorId] = useState('')
    const [errorDoc, setErrorDoc] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [supplierType, setSupplierType] = useState(null)
    const [location, setLocation] = useState('')
    const [supplier_id, setSupplier_Id] = useState(null)
    const [business_name, setBusiness_name] = useState('')
    const [contact_number, setContact_number] = useState('')
    const [additional_information, setAdditional_information] = useState('')
    const [coords, setCoords] = useState([])
    const [first_name, setFirst_Name] = useState('')
    const [last_name, setLast_Name] = useState('')
    const [email_address, setEmail_Address] = useState('')
    const [validId, setValidId] = useState([]);
    const [agree, setAgree] = useState(false)
    const [redirect, setRedirect] = useState(false)
    const [documents, setDocuments] = useState(null)
    const [uploadDocs, setUploadDocs] = useState([])
    const [exampleId, setExampleId] = useState([])
    const [exampleDocument, setExampleDocument] = useState([])
    const { suppliers } = useFetchSuppliers()
    const idSectionRef = useRef(null);
    const docSectionRef = useRef(null);

    useEffect(() => {
        if (supplier_id && exampleIds) {
            const exampleId = exampleIds[supplier_id.value] || []

            setExampleId(exampleId)
        }

        if (documents && exampleDocuments) {
            const exampleDoc = exampleDocuments[documents.value] || []

            setExampleDocument(exampleDoc)
        }
    }, [supplier_id, documents])

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {

                if (userData.role === 'Supplier') {
                    const snapShotShop = await getDoc(doc(db, "shops", auth.currentUser.uid));
                    const data = snapShotShop.data()

                    setBusiness_name(data?.supplier_name)
                    setContact_number(data?.supplier_number)
                    setLocation(data?.supplier_location)
                    setSupplierType(data?.supplier_type)

                }

                else {
                    const snapShotShop = await getDoc(doc(db, "userProfile", auth.currentUser.uid));
                    const data = snapShotShop.data()
                    setFirst_Name(userData.first_name)
                    setLast_Name(userData.last_name)
                    setEmail_Address(userData.email_address)
                    setContact_number(data.contact_number || '')

                }
            }
            catch (e) {
                console.error(e)
            }

            finally {
                setIsLoading(false)
            }

        }
        fetchData()
    }, [userData])

    useEffect(() => {

        try {
            const fetchVerification = async () => {

                const onSnapShotShop = await getDoc(doc(db, "shops", userData.id));

                if (userData?.role === "Supplier" && !onSnapShotShop.exists()) {
                    setRedirect(true)
                }

                const q = query(doc(db, "verification", userData.id),
                    where("status", "in", ["pending", "rejected"]))
                const onSnapShotVerification = await getDoc(q);


                if (onSnapShotVerification.exists()) {
                    setRedirect(true)
                }



            }

            fetchVerification()
        }
        catch (e) {
            console.error(e)
        }
    }, [userData, suppliers])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorDoc('')
        setErrorId('')

        if (validId?.length < 2 || !supplier_id) {
            setErrorId('At least 2 ID images required');
            idSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

            setIsSubmitting(false)
            return
        }

        if (!documents || uploadDocs.length === 0) {
            setErrorDoc('Must upload At least 1 document');
            docSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            setIsSubmitting(false)
            return
        }

        try {

            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                verification_status: 'pending'
            })

            if (userData.role === 'Supplier') {
                const verification = await setDoc(doc(db, "verification", auth.currentUser.uid), {
                    supplier_name: business_name,
                    supplier_number: contact_number,
                    supplier_location: location,
                    supplier_id: supplier_id,
                    supplier_type: supplierType,
                    valid_id: validId,
                    documents_information: uploadDocs,
                    additional_information: additional_information,
                    is_verified: false,
                    created_at: serverTimestamp(),
                })

                await addDoc(collection(db, "notifications"), {
                    avatar: "A",
                    message: `Supplier has sent a verification request for his shop.`,
                    created_at: serverTimestamp(),
                    title: "Verification Request",
                    referenced_type: 'verification',
                    referenced_id: userData.id,
                    unread: true,
                    receiver_id: "hgV2ZGqRWOOdgKqnSBPWkaZPlss1",
                });
            }

            else {
                await setDoc(doc(db, "verification", auth.currentUser.uid), {
                    first_name: first_name,
                    last_name: last_name,
                    email_address: email_address,
                    location: location,
                    contact_number: contact_number,
                    valid_id: validId,
                    documents_information: uploadDocs,
                    additional_information: additional_information,
                    created_at: serverTimestamp(),
                    is_verified: false
                })

                await addDoc(collection(db, "notifications"), {
                    avatar: "A",
                    message: `The Event Planner has sent a verification request for his account.`,
                    created_at: serverTimestamp(),
                    title: "Verification Request",
                    referenced_type: 'verification',
                    referenced_id: userData.id,
                    unread: true,
                    receiver_id: "hgV2ZGqRWOOdgKqnSBPWkaZPlss1",
                });

            }

            Swal.fire({
                title: "Request Submitted",
                text: "We'll review your request and get back to you shortly.",
                icon: "success",
                confirmButtonText: "OK"
            });

            setIsSubmitting(false)
            setRedirect(true)
        }
        catch (e) {
            console.error(e)
        }
        finally {
            setIsSubmitting(false)
        }
    }

    if (redirect) {
        return <Navigate to={'/dashboard'} />
    }

    return (
        <>

            {isLoading && (
                <PageLoading />
            )}

            {isSubmitting && (
                <LoadingOverlay isLoading={isSubmitting} message="Processing.." />
            )}

            {!isLoading && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-6">
                        <IdCard size={40} strokeWidth={1.5} className="text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold">
                                {userData.role === "Supplier" ? "Supplier Verification" : "Planner Verification"}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Submit your information for verification to get verified.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Business Name */}
                        {userData.role === "Supplier" && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Business Name</label>
                                <input
                                    value={business_name}
                                    onChange={(e) => setBusiness_name(e.target.value)}
                                    type="text"
                                    placeholder="e.g. Floral Design"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 
                                        focus:border-blue-500 shadow-sm"
                                />
                            </div>
                        )}

                        {/* First/Last Name + Email for Event Planner */}
                        {userData.role === "Event Planner" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">First Name</label>
                                    <input
                                        value={first_name}
                                        onChange={(e) => setFirst_Name(e.target.value)}
                                        type="text"
                                        placeholder="e.g. Juan"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                                            focus:border-blue-500 shadow-sm"                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Last Name</label>
                                    <input
                                        value={last_name}
                                        onChange={(e) => setLast_Name(e.target.value)}
                                        type="text"
                                        placeholder="e.g. Cruz"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                                            focus:border-blue-500 shadow-sm"                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email Address</label>
                                    <input
                                        value={email_address}
                                        onChange={(e) => setEmail_Address(e.target.value)}
                                        type="email"
                                        placeholder="e.g. test@gmail.com"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                                            focus:border-blue-500 shadow-sm"                                    />
                                </div>
                            </>
                        )}

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Address</label>
                            <AddressAutocomplete
                                setLocation={setLocation}
                                default_location={location}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                                            focus:border-blue-500 shadow-sm"
                                setCoords={setCoords}
                            />
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Contact Number</label>
                            <input
                                required
                                value={contact_number}
                                onChange={(e) => setContact_number(e.target.value)}
                                type="tel"
                                maxLength={11}
                                placeholder="e.g. 09123456789"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 
                                            focus:border-blue-500 shadow-sm"                            />
                        </div>

                        {/* Supplier Type */}
                        {userData.role === "Supplier" && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Supplier Type</label>
                                <Select
                                    onChange={setSupplierType}
                                    options={SupplierOptions}
                                    value={supplierType}
                                    isClearable
                                    isDisabled
                                />
                            </div>
                        )}

                        {/* Additional Info */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Additional Information (Optional)</label>
                            <textarea
                                onChange={(e) => setAdditional_information(e.target.value)}
                                placeholder="Any extra details..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 h-24  
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                                    focus:border-blue-500 shadow-sm"                            />
                        </div>

                        {/* Valid ID Section */}
                        <div ref={idSectionRef} className="border-t pt-6">
                            <div className="flex items-center space-x-2 mb-3">
                                <IdCard className="text-blue-600" size={20} />
                                <span className="font-semibold">Upload Your Valid ID</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                                Please upload at least 2 clear images of a government-issued ID.
                            </p>
                            <Select
                                onChange={(e) => {
                                    setSupplier_Id(e);
                                    setErrorId("");
                                }}
                                options={idOptions}
                                value={supplier_id}
                                placeholder="Select ID type"
                                isClearable
                            />
                            {supplier_id && (
                                <div className="mt-4">
                                    <div className="flex gap-3 justify-center">
                                        {exampleId?.map((id, index) => (
                                            <img
                                                key={index}
                                                src={id}
                                                alt={`Example ${index + 1}`}
                                                className="w-72 rounded-lg border"
                                            />
                                        ))}
                                    </div>
                                    <UploadWidget className="w-80 mt-4" type="id" setId={setValidId} setError={setErrorId} />
                                </div>
                            )}
                            {errorId && (
                                <p className="mt-2 text-sm bg-red-100 border border-red-400 text-red-600 rounded px-3 py-1">
                                    {errorId}
                                </p>
                            )}
                        </div>

                        {/* Document Upload Section */}
                        <div ref={docSectionRef} className="border-t pt-6">
                            <div className="flex items-center space-x-2 mb-3">
                                <FileText className="text-blue-600" size={20} />
                                <span className="font-semibold">Upload Business Document</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                                Upload at least 1 supporting business document.
                            </p>
                            <Select
                                onChange={(e) => {
                                    setDocuments(e);
                                    setErrorDoc("");
                                }}
                                options={documentOptions}
                                value={documents}
                                placeholder="Select document type"
                                isClearable
                            />
                            {documents && (
                                <div className="mt-4">
                                    <div className="flex gap-3 justify-center">
                                        {exampleDocument?.map((doc, index) => (
                                            <img
                                                key={index}
                                                src={doc}
                                                alt={`Example ${index + 1}`}
                                                className="w-72 rounded-lg border"
                                            />
                                        ))}
                                    </div>
                                    <UploadWidget className="w-80 mt-4" type="doc" setDoc={setUploadDocs} setError={setErrorDoc} />
                                </div>
                            )}
                            {errorDoc && (
                                <p className="mt-2 text-sm bg-red-100 border border-red-400 text-red-600 rounded px-3 py-1">
                                    {errorDoc}
                                </p>
                            )}
                        </div>

                        {/* Checkbox */}
                        <VerificationCheckbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />

                        {/* Buttons */}
                        <div className="flex justify-center gap-4 pt-4">
                            <a
                                href="/dashboard"
                                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                            >
                                Cancel
                            </a>
                            <button
                                disabled={isSubmitting}
                                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition 
          ${isSubmitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                            >
                                {isSubmitting ? (
                                    <div className="h-5 w-5 border-2 border-t-white border-blue-200 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <IdCard size={18} /> Submit
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

            )}
        </>
    )
}