import { useEffect, useRef, useState } from 'react';
import { Check, User, Pencil, Shield, Wallet, Lock, PhilippinePeso, UserRound } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import Swal from 'sweetalert2';
import bcrypt from 'bcryptjs';
import DeactivateModal from '../components/DeactivateModal';
import EmailVerificationModal from '../components/EmailVerificationModal';
import { paymentMethods } from '../constants/categories';
import { useCreatePayout } from '../hooks/usePayout';
import { CircleAlert } from 'lucide-react';
import { useFetchTransactionById } from '../hooks/useTransaction';
import { formatDistanceToNow } from 'date-fns';
import LoadingOverlay from '../components/LoadingOverlay';
import { UpdateProfile } from '../components/UpdateModal';
import { useFetchUserProfileById } from '../hooks/useProfile';
import PageLoading from '../components/PageLoading';
import { Title } from 'react-head';

export default function Settings({ userData, user }) {

    const [activeTab, setActiveTab] = useState('privacy');
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [contactNumber, setContactNumber] = useState('')
    const [emailAddress, setEmailAddress] = useState('')
    const [isFirstNameEditing, setIsFirstNameEditing] = useState(false)
    const [isLastNameEditing, setIsLastNameEditing] = useState(false)
    const [isContactNumberEditing, setIsContactNumberEditing] = useState(false)
    const [isSavingFirstName, setIsSavingFirstName] = useState(false);
    const [isSavingLastName, setIsSavingLastName] = useState(false);
    const [isSavingContact, setIsSavingContact] = useState(false);

    const [balanceError, setBalanceError] = useState('')
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    })
    const [errors, setErrors] = useState({});
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState([])
    const { userProfile, isLoading: isUserProfileLoading } = useFetchUserProfileById(userData?.id)

    useEffect(() => {
        setFirstName(userData?.first_name ?? '');
        setLastName(userData?.last_name ?? '');
        setEmailAddress(userData?.email_address ?? '');
        setContactNumber(userProfile?.contact_number ?? '');
    }, [userData, userProfile])

    const [credentials, setCredentials] = useState({
        user_id: userData?.id,
        amount: '',
        account_holder_name: '',
        account_number: '',
        channel_code: '',
        user_email: emailAddress
    })

    const [paymentError, setPaymentError] = useState(false)
    const { createPayout, isLoading: isCreatePayoutLoading } = useCreatePayout()
    const { transactions, isLoading: isTransactionLoading } = useFetchTransactionById(userData.id)
    const paymentSectionRef = useRef()
    const balanceSectionRef = useRef()

    const isAllLoading = isTransactionLoading || isUserProfileLoading

    const earnings = transactions.filter(transaction => transaction.type === "CREDIT")

    const payoutPaymentMethod = paymentMethods.filter(payment => payment.name !== "Credit Card")

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyEarnings = earnings.filter(earning => {
        if (!earning.created_at) return false
        const date = earning.created_at.toDate ? earning.created_at.toDate() : new Date(earning.created_at)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const totalEarningsThisMonth = monthlyEarnings.reduce(
        (sum, earning) => sum + Number(earning.amount || 0),
        0
    )

    const handleFirstName = async () => {
        if (!firstName.trim()) {
            Swal.fire("Warning", "First name cannot be empty.", "warning");
            return;
        }

        try {
            setIsSavingFirstName(true);
            await updateDoc(doc(db, "userProfiles", userData.id), { first_name: firstName });
            await updateDoc(doc(db, "users", userData.id), { first_name: firstName });
            Swal.fire("Success", "First name updated successfully.", "success");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingFirstName(false);
            setIsFirstNameEditing(false);
        }
    };


    const handleLastName = async () => {
        if (!lastName.trim()) {
            Swal.fire("Warning", "Last name cannot be empty.", "warning");
            return;
        }

        try {
            setIsSavingLastName(true);
            await updateDoc(doc(db, "userProfiles", userData.id), { last_name: lastName });
            await updateDoc(doc(db, "users", userData.id), { last_name: lastName });
            Swal.fire("Success", "Last name updated successfully.", "success");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingLastName(false);
            setIsLastNameEditing(false);
        }
    };


    const handleContactNumber = async () => {
        if (!contactNumber.trim()) {
            Swal.fire("Warning", "Contact number cannot be empty.", "warning");
            return;
        }

        try {
            setIsSavingContact(true);
            await updateDoc(doc(db, "userProfiles", userData.id), { contact_number: contactNumber });
            Swal.fire("Success", "Contact number updated successfully.", "success");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingContact(false);
            setIsContactNumberEditing(false);
        }
    };



    const handleForm = async (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!form.current_password.trim()) {
            newErrors.current_password = "Please enter your current password.";
        }

        if (form.new_password === form.current_password && form.new_password !== "") {
            newErrors.new_password = "Your new password must be different from your current one.";
        }

        if (!form.new_password.trim()) {
            newErrors.new_password = "Please enter a new password.";
        } else if (form.new_password.length < 6) {
            newErrors.new_password = "Password must be at least 6 characters long.";
        }

        if (!form.confirm_password.trim()) {
            newErrors.confirm_password = "Please confirm your new password.";
        } else if (form.new_password !== form.confirm_password) {
            newErrors.confirm_password = "Passwords do not match.";
        }

        // stop here if errors exist
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setIsPasswordSubmitting(true);
            setErrors({});

            const credentials = EmailAuthProvider.credential(user.email, form.current_password);
            await reauthenticateWithCredential(user, credentials).then(async () => {

                const salt = bcrypt.genSaltSync(10);
                const hashedPassword = bcrypt.hashSync(form.new_password, salt);
                await updateDoc(doc(db, "users", userData.id), { password: hashedPassword });

                Swal.fire("Success!", "Your password has been changed successfully.", "success");

                await updatePassword(user, form.new_password);

                setForm({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                });

            }).catch((e) => {
                console.error(e)
                if (e.code === "auth/invalid-credential" || e.code === 'auth/wrong-password') {
                    setErrors({ current_password: "The current password you entered is incorrect." });
                }
                else {
                    Swal.fire("Error", "An unexpected error occurred. Try again later.", "error");
                }
            })

        } catch (e) {
            console.error(e);

        } finally {
            setIsPasswordSubmitting(false);
        }
    };


    const handlePayout = async () => {
        setBalanceError('');
        setPaymentError('');

        try {
            // 🧾 Check balance before withdrawal
            if (userData?.balance <= 0) {
                balanceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                setBalanceError("You have no available balance to withdraw.");
                return;
            }

            // 🧾 Check withdrawal amount
            if (!credentials.amount || credentials.amount <= 0) {
                setBalanceError("Please enter a valid withdrawal amount.");
                return;
            }

            // 🧾 Check withdrawal amount
            if (credentials.amount > 10000) {
                setBalanceError("You can withdraw only amounts below 10,000.");
                return;
            }


            // 🧾 Check if withdrawal exceeds balance
            if (credentials.amount > userData?.balance) {
                setBalanceError("Withdrawal amount cannot exceed your available balance.");
                return;
            }

            // 🧾 Check payment method
            if (selectedPayment.length === 0) {
                setPaymentError("Select Payment Method");
                return;
            }

            // 🧾 Account info validation
            if (!credentials.account_number) {
                paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                setPaymentError("Account number is required");
                return;
            }

            if (credentials.account_number.length !== 11) {
                paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                setPaymentError("Account number must be 11 digits");
                return;
            }

            if (!credentials.account_holder_name.trim()) {
                paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                setPaymentError("Account holder name is required");
                return;
            }

            // ✅ Proceed with payout
            await createPayout(credentials, userData);

        } catch (e) {
            console.error(e);
        } finally {
            setSelectedPayment([])
            setCredentials({
                user_id: userData?.id,
                amount: '',
                account_holder_name: '',
                account_number: '',
                channel_code: '',
                user_email: emailAddress
            })
        }
    };



    const handlePaymentMethod = (method) => {
        if (method !== selectedPayment) {
            setSelectedPayment(method)
            setCredentials({ ...credentials, channel_code: "PH_" + method.method })
        }
        else {
            setSelectedPayment([])
        }
    }
    return (
        <>
            <Title>Settings</Title>
            <LoadingOverlay
                isLoading={isCreatePayoutLoading}
                message="Do not refresh until it’s done..."
            />

            {isAllLoading && (
                <PageLoading />
            )}

            {!isAllLoading && (
                <>
                    {/* Header */}
                    < div className="flex items-center mb-5" >
                        <h1 className="text-black text-2xl font-semibold ml-4">Account Settings</h1>
                    </div >

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left Side - Profile Info */}
                        <div className="space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white backdrop-blur-md border border-gray-200 rounded-3xl shadow-lg p-8">
                                <div className="text-center mb-8">
                                    <div className="relative inline-block mb-6">

                                        {userProfile.profile_pic ? (
                                            <img src={userProfile.profile_pic} alt="" className='h-24 w-24 rounded-full object-cover' />
                                        ) : (
                                            <div className='text-5xl h-24 w-24 rounded-full bg-gradient-to-r from-blue-600 to-pink-600 text-white flex items-center justify-center'><span>{userData.first_name.charAt(0).toUpperCase()}</span></div>
                                        )}
                                        <UpdateProfile userData={userData} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-black mb-2">{userData.first_name} {userData.last_name}</h2>
                                    <p className="text-gray-800 text-lg mb-1">{userData.role}</p>
                                </div>

                                {/* Basic Info */}
                                <div className="space-y-4">

                                    {/* First Name */}
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                disabled={!isFirstNameEditing}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                value={firstName}
                                                className={`w-full bg-transparent text-lg font-medium text-gray-800 focus:outline-none ${isFirstNameEditing ? 'border-b border-blue-500' : ''}`}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {!isFirstNameEditing ? (
                                                <button
                                                    onClick={() => setIsFirstNameEditing(true)}
                                                    className="text-sm px-3 py-1 rounded-lg bg-gray-600 text-white hover:bg-blue-600"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleFirstName}
                                                        disabled={isSavingFirstName}
                                                        className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                                                    >
                                                        {isSavingFirstName ? (
                                                            <>
                                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span>Saving...</span>
                                                            </>
                                                        ) : (
                                                            "Save"
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setFirstName(userData.first_name)
                                                            setIsFirstNameEditing(false)
                                                        }}
                                                        className="text-sm px-3 py-1 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Last Name */}
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                disabled={!isLastNameEditing}
                                                onChange={(e) => setLastName(e.target.value)}
                                                value={lastName}
                                                className={`w-full bg-transparent text-lg font-medium text-gray-800 focus:outline-none ${isLastNameEditing ? 'border-b border-blue-500' : ''}`}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {!isLastNameEditing ? (
                                                <button
                                                    onClick={() => setIsLastNameEditing(true)}
                                                    className="text-sm px-3 py-1 rounded-lg bg-gray-600 text-white hover:bg-blue-600"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleLastName}
                                                        disabled={isSavingLastName}
                                                        className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                                                    >
                                                        {isSavingLastName ? (
                                                            <>
                                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span>Saving...</span>
                                                            </>
                                                        ) : (
                                                            "Save"
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setLastName(userData.last_name)
                                                            setIsLastNameEditing(false)
                                                        }}
                                                        className="text-sm px-3 py-1 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contract Number*/}
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">Contact Number</label>
                                            <input
                                                type="tel"
                                                disabled={!isContactNumberEditing}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    setContactNumber(value);
                                                }}
                                                value={contactNumber}
                                                placeholder="No contact number"
                                                className={`w-full bg-transparent text-lg font-medium text-gray-800 focus:outline-none ${isContactNumberEditing ? "border-b border-blue-500" : ""
                                                    }`}
                                                inputMode="numeric"
                                                maxLength={11}
                                                pattern="[0-9]*"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {!isContactNumberEditing ? (
                                                <button
                                                    onClick={() => setIsContactNumberEditing(true)}
                                                    className="text-sm px-3 py-1 rounded-lg bg-gray-600 text-white hover:bg-blue-600"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleContactNumber}
                                                        disabled={isSavingContact}
                                                        className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                                                    >
                                                        {isSavingContact ? (
                                                            <>
                                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span>Saving...</span>
                                                            </>
                                                        ) : (
                                                            "Save"
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setContactNumber(userProfile.contract_number || '')
                                                            setIsContactNumberEditing(false)
                                                        }}
                                                        className="text-sm px-3 py-1 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* email address */}
                                    <div className='relative'>
                                        <label className='absolute top-3 left-4 text-black/70 text-sm'>Email Address</label>
                                        <input type="email" disabled value={emailAddress} className={`h-20 w-full font-medium text-gray-700 bg-gray-100 'border-1 border-gray-100 rounded-2xl pt-4 pl-4 text-lg`} />
                                        <EmailVerificationModal user={user} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Settings */}
                        <div className="space-y-3">
                            {/* Tab Navigation */}
                            <div className="flex bg-white backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-2">
                                <button
                                    onClick={() => setActiveTab('privacy')}
                                    className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl transition-all ${activeTab === 'privacy'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-black/70 hover:text-black hover:bg-gray-100'
                                        }`}
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Privacy & Security
                                </button>
                                {userData.role === "Supplier" && (
                                    <button
                                        onClick={() => setActiveTab('withdrawal')}
                                        className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl transition-all ${activeTab === 'withdrawal'
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : 'text-black/70 hover:text-black hover:bg-gray-100'
                                            }`}
                                    >
                                        <Wallet className="w-4 h-4 mr-2" />
                                        Balance & Withdrawal
                                    </button>
                                )}
                            </div>

                            {/* Privacy & Security Tab */}
                            {activeTab === 'privacy' && (
                                <div className="bg-white backdrop-blur-md border border-gray-200 shadow-lg rounded-3xl p-8">
                                    <div className="flex items-center mb-6">
                                        <div className="p-3 bg-blue-600 rounded-2xl">
                                            <Lock className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-xl font-bold text-black">Privacy & Security</h3>
                                            <p className="text-black/70">Manage your account security settings</p>
                                        </div>
                                    </div>

                                    {isPasswordSubmitting && (
                                        <div className='flex justify-center items-center h-[410px]'>
                                            <div className='h-12 w-12 rounded-full border-t border-blue-600 animate-spin'></div>

                                        </div>
                                    )}

                                    {!isPasswordSubmitting && (
                                        <form onSubmit={handleForm} className="space-y-6">
                                            {/* Current Password */}
                                            <div>
                                                <label className="block text-black font-medium mb-3">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={form.current_password}
                                                    onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                                                    className={`w-full px-4 py-4 bg-gray-100 border rounded-2xl text-black focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${errors.current_password ? "border-red-500" : "border-gray-600"
                                                        }`}
                                                    placeholder="Enter your current password"
                                                />
                                                {errors.current_password && <p className="ml-1 mt-2 text-red-600">{errors.current_password}</p>}
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <label className="block text-black font-medium mb-3">New Password</label>
                                                <input
                                                    type="password"
                                                    value={form.new_password}
                                                    onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                                                    className={`w-full px-4 py-4 bg-gray-100 border rounded-2xl text-black focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${errors.new_password ? "border-red-500" : "border-gray-600"
                                                        }`}
                                                    placeholder="Enter new password"
                                                />
                                                {errors.new_password && <p className="ml-1 mt-2 text-red-600">{errors.new_password}</p>}
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label className="block text-black font-medium mb-3">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={form.confirm_password}
                                                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                                                    className={`w-full px-4 py-4 bg-gray-100 border rounded-2xl text-black focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${errors.confirm_password ? "border-red-500" : "border-gray-600"
                                                        }`}
                                                    placeholder="Confirm new password"
                                                />
                                                {errors.confirm_password && <p className="ml-1 mt-2 text-red-600">{errors.confirm_password}</p>}
                                            </div>


                                            {/* Deactivate Account Section */}
                                            <div>
                                                <DeactivateModal user={user} userData={userData} />
                                            </div>

                                            <button
                                                className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-700 active:bg-blue-600 transition-all shadow-xl"
                                            >
                                                Update Security Settings
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Balance & Withdrawal Tab */}
                            {activeTab === 'withdrawal' && userData.role === "Supplier" && (
                                <div ref={balanceSectionRef} className="bg-white backdrop-blur-md shadow-lg border border-gray-200 rounded-3xl p-8">
                                    <div className="flex items-center mb-6">
                                        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                                            <PhilippinePeso className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-xl font-bold text-black">Balance & Withdrawal</h3>
                                            <p className="text-black/70">Manage your earnings and withdrawals</p>
                                        </div>
                                    </div>

                                    {/* Balance Display */}
                                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 mb-6">
                                        <div className="text-center">
                                            <p className="text-black/70 mb-2">Available Balance</p>
                                            <p className="text-4xl font-bold text-gray-800">₱{userData.balance.toFixed(2)}</p>
                                            <p className="text-gray-700 text-sm mt-2">+₱{totalEarningsThisMonth} this month</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Withdrawal Amount */}
                                        <div >
                                            <label className="block text-black font-medium mb-3">Withdrawal Amount</label>

                                            <div ref={paymentSectionRef} className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/70 text-lg">₱</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-4 py-4 bg-gray-100 border border-gray-600 rounded-2xl text-black placeholder-gray-1000 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                    placeholder="0.00"
                                                    onChange={(e) => setCredentials({ ...credentials, amount: Number(e.target.value) })}
                                                />
                                            </div>
                                            {balanceError && (
                                                <span className='mt-2 py-2 px-3 block bg-red-400 rounded-md text-sm text-white'><div className='flex items-center gap-2'><CircleAlert /> {balanceError}</div></span>
                                            )}
                                            {/* <p className="text-black/50 text-sm mt-2">Minimum withdrawal: ₱50.00</p> */}
                                        </div>

                                        {/* Payment Method */}
                                        <div >
                                            <label className="block text-black font-medium mb-3">Payment Method</label>
                                            <div className="space-y-3">
                                                <div className='flex flex-col gap-5 mt-5'>
                                                    {payoutPaymentMethod.map((methods, methodIndex) => (
                                                        <div
                                                            key={methodIndex}
                                                            className={`transition-all duration-100 rounded-lg border shadow-lg p-5 
      ${selectedPayment.method === methods.method ? 'border-blue-600 ring ring-blue-600/30' : 'border-gray-300'}`}
                                                        >
                                                            {/* Selectable Header */}
                                                            <div
                                                                onClick={() => handlePaymentMethod(methods)}
                                                                className="flex justify-between cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <img src={methods.payment_method_logo} className="w-12 h-12 object-cover rounded-xl" alt="" />
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="block text-left text-gray-900 font-semibold">{methods.name}</span>
                                                                        <span className="block text-left text-sm text-gray-500">{methods.type}</span>
                                                                    </div>
                                                                </div>

                                                                <div
                                                                    className={`rounded-full h-5 w-5 border flex items-center justify-center 
          ${selectedPayment.method === methods.method ? methods.color : 'border-gray-300 bg-gray-300'}`}
                                                                >
                                                                    {selectedPayment.method === methods.method && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                            </div>

                                                            {/* Show inputs only if selected */}
                                                            {selectedPayment.method === methods.method && (
                                                                <div className="flex flex-col gap-4 mt-3">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                                        placeholder="Account Holder Name"
                                                                        onChange={(e) => setCredentials({ ...credentials, account_holder_name: e.target.value })}

                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        className="w-full pl-4 pr-4 py-2 bg-gray-50 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                                        placeholder="Account Number"
                                                                        maxLength={11}
                                                                        minLength={11}
                                                                        pattern='\d{11}'
                                                                        onInput={(e) => {
                                                                            e.target.value = e.target.value.replace(/\D/g, '');
                                                                        }}
                                                                        onWheel={(e) => e.preventDefault()}
                                                                        onChange={(e) => setCredentials({ ...credentials, account_number: e.target.value })}
                                                                    />

                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {paymentError && (
                                                        <span className='ml-3 py-2 px-3 bg-red-400 rounded-md text-sm text-white'><div className='flex items-center gap-2'><CircleAlert /> {paymentError}</div></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recent Transactions */}
                                        <div className="bg-gray-100 rounded-2xl p-6">
                                            <h4 className="text-black font-medium mb-4">Recent Transactions</h4>
                                            <div className={`space-y-4 overflow-y-auto ${transactions.length > 2 && 'h-[150px]'}`}>
                                                {transactions.map((transaction, index) => (
                                                    <div key={index} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-black text-sm">{transaction.type === "CREDIT" ? 'Event Payment' : "Withdrawn"}</p>
                                                            <p className="text-black/50 text-xs">{transaction.created_at
                                                                ? formatDistanceToNow(transaction.created_at.toDate(), { addSuffix: true })
                                                                : 'N/A'}</p>
                                                        </div>
                                                        <p className={`${transaction.type === "CREDIT" ? "text-green-400" : "text-red-400"} font-medium`}>{transaction.type === "CREDIT" ? "+ " : "- "}₱{transaction.amount}</p>
                                                    </div>

                                                ))}
                                                {transactions?.length === 0 && (
                                                    <h4 className="text-gray-400 text-center font-semibold py-2">No transaction found</h4>

                                                )}
                                            </div>

                                        </div>

                                        <button
                                            onClick={() => handlePayout()}
                                            className="w-full bg-green-500 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-green-600 transition-all shadow-xl flex items-center justify-center"
                                            disabled={isCreatePayoutLoading}
                                        >
                                            {isCreatePayoutLoading ? (
                                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                "Request Withdrawal"
                                            )}
                                        </button>

                                    </div>
                                </div>
                            )}
                        </div>
                    </div >
                </>
            )}
        </>
    );
}