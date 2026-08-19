import { MapPin, CircleCheckBig, Star, Edit3, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { ShopBackgroundModal } from "../../components/ShopBackgroundModal"
import SupplierRegistration from "./SupplierRegistration"
import SupplierPanels from "../../components/SupplierPanels"
import { SupplierDetails } from "../../components/UpdateModal"
import { useFetchSuppliers, useFetchSupplierServices } from "../../hooks/useSupplier"
import { useFetchReviews } from "../../hooks/useReviews"
import PageLoading from "../../components/PageLoading"
import { Title } from "react-head"

export default function SupplierShop({ userData }) {
    const [supplier, setSupplier] = useState([])
    const { suppliers: shop, isLoading: isSupplierLoading } = useFetchSuppliers()
    const { reviews, isLoading: isReviewsLoading } = useFetchReviews()
    const { services, isLoading: isServicesLoading } = useFetchSupplierServices()

    const isAllLoading = isSupplierLoading || isReviewsLoading || isServicesLoading

    const supplierService = services.filter(serv => serv.supplier_id === userData.id)
    console.log(supplierService)

    const userReviews = reviews.filter(rev => rev.reviewed_id === userData.id)

    console.log(userReviews)

    useEffect(() => {
        const userShop = shop?.find(shop => shop?.id === userData.id)
        setSupplier(userShop)

    }, [shop, userData])


    if (!supplier && !isAllLoading) {
        return <SupplierRegistration />
    }

    if (userData.role !== 'Supplier') {
        return <Navigate to={'/dashboard'} />
    }

    const validRatings = userReviews
        .map(review => Number(review.rating))
        .filter(rating => !isNaN(rating));

    const averageRating = validRatings.length > 0
        ? (validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length).toFixed(1)
        : "N/A";


    return (
        <>
            {isAllLoading && (
                <PageLoading />
            )}

            {!isAllLoading && (

                <>
                    <Title>Shop</Title>

                    <div className="px-4">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Shop</h1>
                            <p className="text-gray-600 mt-2">Manage your business profile and showcase your services</p>
                        </div>

                        {(!supplierService || supplierService.length === 0) && (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg shadow-sm">
                                ⚠️ Your shop is currently <b>hidden</b> until you add at least one service.
                            </div>
                        )}
                        {(!userData || userData.verification_status !== "verified") && (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg shadow-sm">
                                ⚠️ Your shop is currently <b>hidden</b> until your shop is unverified.
                            </div>
                        )}

                        {/* Main Content Container */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                            {/* Hero Image */}
                            <div className="relative h-64 md:h-80 overflow-hidden">
                                <ShopBackgroundModal userData={userData} />
                                <div className="relative h-64 md:h-80 overflow-hidden rounded-t-2xl">
                                    {supplier?.supplier_background_image ? (
                                        <img
                                            loading="lazy"
                                            src={supplier.supplier_background_image}
                                            alt="background image"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-600 via-blue-600 to-violet-600 opacity-50"></div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 md:p-10">
                                {/* Business Header */}
                                <div className="mb-8">
                                    <div className="flex flex-wrap items-center gap-4 mb-4">
                                        <h2 className="text-3xl font-bold text-gray-900">{supplier?.supplier_name}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                                                {supplier?.supplier_type?.label}
                                            </span>
                                            {(userData.verification_status === "unverified" || userData.verification_status === "rejected") && !supplier.is_verified && (
                                                <a href={'/verify'} className={`transtion-all duration-75 flex group items-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-400 rounded-full px-4 py-2`}>
                                                    <span className={`text-blue-700 group-hover:text-white font-medium text-sm`}>Verify</span>
                                                </a>
                                            )}
                                            {userData.verification_status === "pending" && !supplier.is_verified && (
                                                <span className="flex group items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2">
                                                    <span className={`text-yellow-700 font-medium text-sm`}>Pending</span>
                                                </span>
                                            )}

                                            {userData.verification_status === "verified" && supplier.is_verified && (
                                                <span className="flex group items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                                                    <span className={`text-green-700 font-medzium text-sm`}>Verified</span>
                                                    <CircleCheckBig size={16} className="text-green-600" />
                                                </span>
                                            )}
                                        </div>
                                        <SupplierDetails supplierData={supplier} />

                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={20} className="text-blue-500" />
                                            <span className="font-medium">{supplier?.supplier_location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Star size={20} className="text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium">{averageRating}</span>
                                            <span className="text-gray-500">{userReviews.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <SupplierPanels userData={userData} reviews={userReviews} shop={supplier} services={supplierService} averageRating={averageRating} />

                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}