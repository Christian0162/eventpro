import { Search, MapPin, PhilippinePeso, Clock, Star, Bot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Cards from "../../components/Cards";
import CreatableSelect from 'react-select/creatable';
import { SupplierOptions } from "../../constants/categories";
import { lazy, Suspense } from "react";
import AIModal from "../../components/AIModal";
import { Typewriter } from 'react-simple-typewriter'
import { useFetchSuppliers, useFetchSupplierServices } from "../../hooks/useSupplier";
import { useFetchReviews } from "../../hooks/useReviews";
import { useFetchAllApplication } from "../../hooks/useApplication";
import { useFetchEventsById } from "../../hooks/useEvents";
import PageLoading from "../../components/PageLoading";
import LoadingOverlay from "../../components/LoadingOverlay";

export default function Supplier({ userData }) {

    const SupplierModal = useMemo(() => lazy(() => import("../../components/SupplierModal")), []);

    const [category, setCategory] = useState(null);
    const [shop, setShop] = useState([]);
    const [filteredShops, setFilteredShops] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [ai_response, setAi_response] = useState('')
    const { services, isLoading: isServicesLoading } = useFetchSupplierServices()
    const { reviews, isLoading: isReviewsLoading } = useFetchReviews()
    const { suppliers, isLoading: isSupplierLoading } = useFetchSuppliers()
    const { applications, isLoading: isApplicationLoading } = useFetchAllApplication()
    const { events, isLoading: isEventsLoading } = useFetchEventsById(userData.id)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedShop, setSelectedShop] = useState(null)
    const [customCategories, setCustomCategories] = useState(() => {
        const saved = localStorage.getItem("customCategories");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("customCategories", JSON.stringify(customCategories));
    }, [customCategories]);



    const isAllLoading = isSupplierLoading || isEventsLoading || isApplicationLoading || isServicesLoading || isReviewsLoading

    const dynamicExpertiseOptions = useMemo(() => {
        const set = new Set();

        // From suppliers
        suppliers.forEach(supplier => {
            supplier?.supplier_expertise?.forEach(expertise => {
                set.add(expertise);
            });
        });

        // From static options
        SupplierOptions.forEach(option => {
            set.add(option.label);
        });

        // From user-added categories
        customCategories.forEach(cat => {
            set.add(cat.label);
        });

        return Array.from(set).map(item => ({
            value: item.toLowerCase().replace(/\s+/g, "_"),
            label: item
        }));
    }, [suppliers, customCategories]);

    const handleCreateCategory = (inputValue) => {

        const formattedValue = inputValue.trim();

        // Prevent duplicates
        const exists = dynamicExpertiseOptions.some(
            cat => cat.label.toLowerCase() === formattedValue.toLowerCase()
        );

        if (exists) {
            setCategory(
                dynamicExpertiseOptions.find(
                    cat => cat.label.toLowerCase() === formattedValue.toLowerCase()
                )
            );
            return;
        }

        const newOption = {
            label: formattedValue,
            value: formattedValue.toLowerCase().replace(/\s+/g, "_")
        };

        setCustomCategories(prev => [...prev, newOption]);
        setCategory(newOption);
    };


    useEffect(() => {
        const filteredSupplier = suppliers.filter(supplier =>
            supplier.is_verified &&
            supplier.status === "active" &&
            services.some(serv => serv.supplier_id === supplier.id)
        );

        setShop(filteredSupplier);
    }, [suppliers, services]);

    console.log(events)

    useEffect(() => {
        let filtered = shop;

        if (searchTerm) {
            filtered = filtered.filter(shopItem =>
                shopItem.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shopItem.supplier_expertise?.some(expertise =>
                    expertise.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
            setFilteredShops(filtered)
        }
        if (category) {
            filtered = filtered.filter(shopItem =>
                shopItem.supplier_type.value?.toLowerCase().includes(category?.value?.toLowerCase()) ||
                shopItem.supplier_expertise?.some(expertise =>
                    expertise.toLowerCase().includes(category?.label?.toLowerCase())
                )
            );
        }

        setFilteredShops(filtered);
    }, [searchTerm, category, shop]);

    const calculateAverageRating = (shopId) => {
        const shopReviews = reviews.filter(r => r.reviewed_id === shopId);
        const validRatings = shopReviews
            .map(review => Number(review.rating))
            .filter(rating => !isNaN(rating) && rating > 0);

        if (validRatings.length === 0) return "N/A";

        const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
        return average.toFixed(1);
    };

    const getReviewCount = (shopId) => {
        const shopReviews = reviews.filter(r => r.reviewed_id === shopId);
        return shopReviews.length;
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const openModal = (supplier) => {
        setSelectedShop(supplier)
        setIsModalOpen(true)
    };

    const closeModal = () => {
        setIsModalOpen(false)

    };

    console.log(category)

    if (isAllLoading) return <PageLoading />;
    return (
        <>

            <div className={`mb-8 flex flex-col lg:flex-row items-baseline justify-between`}>
                <div className="flex flex-col gap-2 items-baseline justify-between">
                    <div className="flex gap-4 items-baseline">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Suppliers
                            </h1>
                        </div>

                        {userData.role !== "Supplier" && (
                            <div>
                                <AIModal ai_response={setAi_response} ai_shops={setFilteredShops} />
                            </div>
                        )}

                    </div>
                    <span className="my-2 text-gray-600">
                        Discover trusted suppliers for your needs.
                    </span>
                </div>

                {/* Search and Filter Section */}
                <div className="flex flex-col items-start md:items-end">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex w-full gap-3">
                            <div className="flex sm:w-[35rem] w-full relative">
                                <Search className="absolute left-4 top-[1.30rem] transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-12 pr-4 py-2 bg-gray-50 border shadow-lg border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200"
                                    placeholder="Search suppliers by name or expertise..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="w-full md:w-72 mt-3">
                        <CreatableSelect
                            onChange={setCategory}
                            onCreateOption={handleCreateCategory}
                            value={category}
                            options={dynamicExpertiseOptions}
                            placeholder="Select or type a category"
                            isClearable
                            isSearchable
                            formatCreateLabel={(inputValue) => `+ Add "${inputValue}"`}
                        />



                    </div>
                </div>
            </div>

            {ai_response?.length > 0 && (
                <div className="mb-8 max-w-[800px]">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-md rounded-2xl p-6 relative">

                        {/* Close Button */}
                        <button
                            onClick={() => (setAi_response(""), setFilteredShops(shop))}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                        >
                            ✕
                        </button>

                        <div className="flex items-center mb-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shadow">
                                <Bot size={20} />
                            </div>
                            <h2 className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI Suggestion
                            </h2>
                        </div>

                        <div className="text-gray-700 leading-relaxed text-md">
                            <Typewriter
                                words={[ai_response]}
                                typeSpeed={20}
                                delaySpeed={500}
                            />
                        </div>
                    </div>
                </div >
            )
            }

            {/* Suppliers Grid */}
            {!isAllLoading && (
                <>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredShops.map((shopItem, index) => {
                            const averageRating = calculateAverageRating(shopItem.id);
                            const reviewCount = getReviewCount(shopItem.id);

                            const userServices = services.filter(serv => serv.supplier_id === shopItem.id)
                            return (
                                <Cards key={shopItem.id || index} className="group cursor-pointer flex flex-col justify-between">
                                    {/* Header - Applied Badge */}
                                    <div className="relative">
                                        {applications.some(app =>
                                            app.supplier_id === shopItem.id &&
                                            events.some(event => event.id === app.event_id)
                                        ) && (
                                                <div className="absolute top-3 left-3 z-10 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-green-700">
                                                    Applied
                                                </div>
                                            )}


                                        {/* Image */}
                                        <div className="relative overflow-hidden rounded-t-lg">
                                            {shopItem.supplier_background_image.length > 0 ? (
                                                <img
                                                    src={shopItem?.supplier_background_image}
                                                    loading="lazy"
                                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                                    alt={`${shopItem.supplier_name} background`}
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                                            )}

                                            {/* Rating Badge */}
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm">
                                                <Star className="text-yellow-400 fill-current" size={14} />
                                                <span className="text-sm font-semibold text-gray-900">{averageRating}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-grow flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                                                {shopItem.supplier_name}
                                            </h3>

                                            {/* Location */}
                                            <div className="flex items-center space-x-2 mb-4">
                                                <MapPin className="text-gray-400 shrink-0" size={16} />
                                                <span className="text-gray-600 text-sm">{shopItem.supplier_location}</span>
                                            </div>

                                            <div className="flex items-center space-x-2 mb-4">
                                                <Clock className="text-gray-400 shrink-0" size={16} />
                                                <span className="text-sm text-gray-600">{shopItem.supplier_availability}</span>
                                            </div>

                                            {/* Categories */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {shopItem?.supplier_expertise?.map((expertise, expertiseIndex) => (
                                                    <span
                                                        key={expertiseIndex}
                                                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                                                    >
                                                        {expertise}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Price and Hours */}
                                            <div className="flex flex-col mb-5 gap-2">


                                                <div className="flex items-center space-x-1">
                                                    <PhilippinePeso className="text-green-600" size={18} />
                                                    <span className="text-lg font-bold text-gray-900">{Number(userServices[0]?.service_price).toFixed(2)}</span>
                                                    <span className="text-sm text-gray-500">/service</span>
                                                </div>

                                            </div>

                                            {/* Reviews */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-1">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={
                                                                    i < Math.floor(averageRating !== "N/A" ? parseFloat(averageRating) : 0)
                                                                        ? "text-yellow-400 fill-current"
                                                                        : "text-gray-300"
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => openModal({
                                                supplierData: shopItem,
                                                services: userServices,
                                                reviews: reviews.filter(
                                                    (r) => r.reviewed_id === shopItem.id
                                                ),
                                                averageRating,
                                            })}
                                            className="py-2 rounded-lg font-semibold w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </Cards>
                            );
                        })}
                    </div>
                    {isModalOpen && selectedShop && (
                        <Suspense fallback={<LoadingOverlay isLoading={true} message="Pleasee waitt.." />}>
                            <SupplierModal
                                isOpen={isModalOpen}
                                onClose={closeModal}
                                supplierData={selectedShop?.supplierData}
                                services={selectedShop?.services}
                                reviews={selectedShop?.reviews}
                                userData={userData}
                                averageRating={selectedShop?.averageRating}
                            />
                        </Suspense>
                    )}
                </>
            )
            }

            {
                filteredShops.length === 0 && !isAllLoading && (
                    <div className="flex flex-col items-center justify-center py-[12rem]">
                        <span className="text-gray-400 text-xl mb-2">No Suppliers Found</span>
                        <span className="text-gray-500 text-sm">Try adjusting your search or filters</span>
                    </div>
                )
            }
        </>
    );
}