import { Button, Dialog, DialogPanel } from '@headlessui/react'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { Bot, X, Search } from "lucide-react"
import { useState } from 'react'
import { db } from '../firebase/firebase'
import { useFetchReviews } from '../hooks/useReviews'
import nlp from 'compromise';
import Fuse from 'fuse.js'
import { useFetchSupplierServices } from '../hooks/useSupplier'

export default function AIModal({ ai_response, ai_shops }) {
    const [isOpen, setIsOpen] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [budget, setBudget] = useState('') // New budget input
    const [recommendations, setRecommendations] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { reviews } = useFetchReviews()
    const { services } = useFetchSupplierServices()

    function open() { 
        setIsOpen(true) 
        setBudget('')
    }
    function close() { setError(''); setIsOpen(false) }

    function normalizeText(text) {
        return text
            ?.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const handleAiSearch = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        ai_response('')
        setError('');

        if (!prompt.trim()) {
            setError('Please describe what you are looking for.');
            setIsSubmitting(false);
            return;
        }

        try {
            const q = query(collection(db, "shops"));
            const snapShop = await getDocs(q);

            const shopData = await Promise.all(snapShop.docs.map(async (doc) => {
                const data = doc.data();
                const shopId = doc.id;

                const supplierService = services.filter(s => s.supplier_id === shopId)
                const selectedService = supplierService[0]

                const userReviews = reviews.filter(rev => rev.reviewed_id === shopId)
                const avgRating = userReviews.length > 0 ?
                    (userReviews.reduce((sum, rev) => sum + parseFloat(rev.rating || 0), 0) / userReviews.length).toFixed(1) : 0;

                const latestReviewQuery = query(
                    collection(db, "reviews"),
                    orderBy("created_at", "desc"),
                    where("reviewed_id", "==", shopId),
                    limit(1)
                );

                const latestReviewSnapshot = await getDocs(latestReviewQuery);
                const latestReviewText = !latestReviewSnapshot.empty
                    ? latestReviewSnapshot.docs[0].data().comment
                    : '';

                return {
                    id: shopId,
                    name: data.supplier_name,
                    category: data.supplier_type?.label || '',
                    expertise: data.supplier_expertise || [],
                    avg_rating: parseFloat(avgRating),
                    reviews: latestReviewText,
                    budget: Number(selectedService?.service_price),
                    ...data
                };
            }));

            if (shopData.length === 0 && shopData.budget > budget) {
                setError("No suppliers found.");
                setIsSubmitting(false);
                return;
            }

            const promptLower = prompt.toLowerCase();
            const doc = nlp(promptLower);
            const ratingMatch = doc.numbers().out('array');
            let ratingThreshold = null;
            let shouldFilterByRating = false;

            if (ratingMatch) {
                ratingThreshold = parseFloat(ratingMatch[0]);
                shouldFilterByRating = true;
            }

            const options = {
                includeScore: true,
                threshold: 0.2,
                distance: 50,
                keys: [
                    'supplier_name',
                    'supplier_type.label',
                    'supplier_expertise',
                    'budget'
                ]
            }

            const normalizedPrompt = normalizeText(promptLower);
            const keywords = normalizedPrompt.split(/\s+/);
            const fuse = new Fuse(shopData, options);

            const allResults = keywords.flatMap(word => fuse.search(word));
            const uniqueResults = Array.from(
                new Map(allResults.map(r => [r.item.id, r.item])).values()
            );

            const isBelow = normalizedPrompt.includes('below') ||
                normalizedPrompt.includes('less') ||
                normalizedPrompt.includes('under');
            const isAbove = normalizedPrompt.includes('above') ||
                normalizedPrompt.includes('more') ||
                normalizedPrompt.includes('over');

            const filteredShops = uniqueResults.filter(shop => {
                if (!shouldFilterByRating || isNaN(ratingThreshold)) return true;
                const rating = Number(shop.avg_rating);
                if (isBelow) return rating <= ratingThreshold;
                if (isAbove) return rating >= ratingThreshold;
                return rating >= ratingThreshold;
            });

            if (filteredShops.length === 0) {
                setError("No suppliers match your search criteria.");
                setIsSubmitting(false);
                return;
            }

            // Budget filtering
            // Budget filtering

            console.log(filteredShops)
            let budgetFilteredShops = filteredShops;
            const numericBudget = parseFloat(budget);

            if (!isNaN(numericBudget)) {

                // Filter using the budget
                budgetFilteredShops = filteredShops.filter(shop => {
                    // shops with no budget should NOT be included
                    return shop.budget !== undefined && shop.budget !== null && shop.budget <= numericBudget;
                });

                if (filteredShops.length > 0 && budgetFilteredShops.length === 0) {
                    setError("No suppliers match your budget.");
                    setIsSubmitting(false);
                    return;
                }
            }

            const sortedShops = [...budgetFilteredShops].sort((a, b) => {
                if (a.budget !== b.budget) return a.budget - b.budget; // cheapest first
                return b.avg_rating - a.avg_rating; // tie-break by rating
            });

            console.log(sortedShops)

            const response = await fetch("https://eventpro-backend-python.onrender.com/api/v1/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_prompt: prompt,
                    suppliers: sortedShops
                }),
            });

            const data = await response.json();
            if (data) {
                setRecommendations(data.recommendations);
                ai_response(data.recommendations);

                const recommendedShops = sortedShops.filter(shop =>
                    data.recommendations.includes(shop.name)
                );
                ai_shops(recommendedShops);
            }

            setIsSubmitting(false);
            close();
        }
        catch (error) {
            console.error("Error during AI search:", error);
            setError("An error occurred while processing your request.");
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button
                onClick={open}
                className="relative overflow-hidden transition-all rounded-full hover:scale-105 px-6 py-2 text-white bg-gradient-to-r from-blue-600 via-purple-500 to-violet-600 bg-[length:200%_200%] duration-500 ease-in-out hover:bg-[position:100%_100%] flex items-center gap-3"
            >
                <Bot size={21} />
                <span className="hidden sm:hidden md:hidden lg:hidden xl:block">AI Search</span>
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                <div className="fixed inset-0 bg-black/25" />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            <div className='relative px-10 py-7 bg-gray-100 rounded-t-xl'>
                                <button
                                    onClick={close}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                                >
                                    <X size={20} className="text-gray-600" />
                                </button>

                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-blue-600">
                                        AI Supplier Search
                                    </h2>
                                </div>
                                <p className="text-gray-600 text-sm">Find the perfect suppliers for your event using AI-powered recommendations</p>
                            </div>

                            <form onSubmit={handleAiSearch}>
                                <div className='flex flex-col px-10 py-5'>
                                    <div className='relative flex flex-col mb-4'>
                                        <label htmlFor="search" className='text-sm mb-2 text-gray-800 font-bold'>What are you looking for?</label>
                                        <input
                                            onChange={(e) => setPrompt(e.target.value)}
                                            type="text"
                                            placeholder="Example: 'Event suppliers with at least 5 star rating'"
                                            className='rounded-lg focus:outline-none border border-gray-300 shadow-lg py-2 px-4'
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Describe your needs (e.g., "wedding florist", "corporate event planner", "5 star caterers")
                                        </p>
                                    </div>

                                    {/* Budget input */}
                                    <div className='relative flex flex-col mb-4'>
                                        <label htmlFor="budget" className='text-sm mb-2 text-gray-800 font-bold'>Budget (₱)</label>
                                        <input
                                            onChange={(e) => setBudget(e.target.value)}
                                            type="number"
                                            placeholder="e.g., 20000"
                                            className='rounded-lg focus:outline-none border border-gray-300 shadow-lg py-2 px-4'
                                        />
                                    </div>

                                    {error && (
                                        <span className='mt-5 text-red-500'>{error}</span>
                                    )}
                                    <button
                                        disabled={isSubmitting}
                                        className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-md mt-7 py-2 rounded-md text-white flex justify-center text-center items-center gap-3`}
                                    >
                                        {isSubmitting ? <div className='h-4 w-4 rounded-full border border-t-2 animate-spin'></div> : <Search size={21} />}
                                        Search with AI
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
