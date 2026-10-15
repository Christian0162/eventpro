import type { Doc, LegacyProps } from "@/types/firestore";
import {
    ArrowRight, Bot, Camera, Building2, Clock, Heart, LayoutGrid, MapPin, Music, PartyPopper,
    Search, ShieldCheck, Sparkles, Star, Utensils, Wrench, X, MoreHorizontal, Wallet, Headphones,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { Typewriter } from "react-simple-typewriter";
import bookingIllustration from "@/assets/illustrations/booking.svg";
import { db, auth } from "@/firebase/firebase";
import AIModal from "@/components/organisms/ai-modal";
import PageLoading from "@/components/atoms/page-loading";
import LoadingOverlay from "@/components/atoms/loading-overlay";
import { useFetchSuppliers, useFetchSupplierServices } from "@/hooks/use-supplier";
import { useFetchReviews } from "@/hooks/use-reviews";
import { useFetchAllApplication } from "@/hooks/use-application";
import { useFetchEventsById } from "@/hooks/use-events";
import { useFetchFavorites } from "@/hooks/use-favorites";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SupplierModal = lazy(() => import("@/components/organisms/supplier-modal"));

const CATEGORY_CHIPS = [
    { key: "all", label: "All", icon: LayoutGrid, types: [] as string[] },
    { key: "catering", label: "Catering", icon: Utensils, types: ["catering", "bar_beverage", "cake_pastry"] },
    { key: "venues", label: "Venues", icon: Building2, types: ["venue"] },
    { key: "photography", label: "Photography", icon: Camera, types: ["photo_video"] },
    { key: "decoration", label: "Decoration", icon: PartyPopper, types: ["stylist_decorator", "floral_balloon"] },
    { key: "entertainment", label: "Entertainment", icon: Music, types: ["entertainment", "lighting_sound"] },
    { key: "equipment", label: "Equipment", icon: Wrench, types: ["stage_equipment", "furniture", "tent_booth"] },
    { key: "others", label: "Others", icon: MoreHorizontal, types: [] as string[] },
];

const KNOWN_TYPES = CATEGORY_CHIPS.flatMap(chip => chip.types);

const PRICE_RANGES = [
    { value: "any", label: "Any price", min: 0, max: Infinity },
    { value: "low", label: "Under ₱5,000", min: 0, max: 5000 },
    { value: "mid", label: "₱5,000 – ₱15,000", min: 5000, max: 15000 },
    { value: "high", label: "₱15,000 – ₱30,000", min: 15000, max: 30000 },
    { value: "premium", label: "₱30,000+", min: 30000, max: Infinity },
];

const RATING_OPTIONS = [
    { value: "0", label: "Any rating" },
    { value: "4", label: "4.0+ stars" },
    { value: "4.5", label: "4.5+ stars" },
];

const SORT_OPTIONS = [
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
];

const TRUST_POINTS = [
    { icon: ShieldCheck, label: "Verified Suppliers" },
    { icon: Wallet, label: "Secure Payments" },
    { icon: Headphones, label: "24/7 Support" },
];

const ALL = "__all__";

interface FilterSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
}

function FilterSelect({ label, value, onChange, options, className }: FilterSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger aria-label={label} className={`h-10 w-full rounded-lg bg-background ${className ?? ""}`}>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent position="popper">
                {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
        </Select>
    );
}

const peso = (value: number) => `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

export default function Supplier({ userData }: LegacyProps) {
    const { services, isLoading: isServicesLoading } = useFetchSupplierServices();
    const { reviews, isLoading: isReviewsLoading } = useFetchReviews();
    const { suppliers, isLoading: isSupplierLoading } = useFetchSuppliers();
    const { applications, isLoading: isApplicationLoading } = useFetchAllApplication();
    const { events, isLoading: isEventsLoading } = useFetchEventsById(userData.id);
    const { favorites } = useFetchFavorites();

    const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
    const [chip, setChip] = useState("all");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [priceRange, setPriceRange] = useState("any");
    const [minRating, setMinRating] = useState("0");
    const [sortBy, setSortBy] = useState("popular");
    const [aiResponse, setAiResponse] = useState("");
    const [aiShops, setAiShops] = useState<Doc[] | null>(null);
    const [selectedShop, setSelectedShop] = useState<LegacyProps | null>(null);

    const isAllLoading = isSupplierLoading || isEventsLoading || isApplicationLoading || isServicesLoading || isReviewsLoading;

    const likedIds = useMemo(
        () => new Set(favorites.filter(f => f.user_id === auth.currentUser?.uid && f.isActive).map(f => f.supplier_id)),
        [favorites],
    );

    // Everything a card needs, computed once per data change rather than per render per card.
    const shops = useMemo(() => {
        return suppliers
            .filter(s => s.is_verified && s.status === "active" && services.some(serv => serv.supplier_id === s.id))
            .map(s => {
                const shopServices = services.filter(serv => serv.supplier_id === s.id);
                const ratings = reviews
                    .filter(r => r.reviewed_id === s.id)
                    .map(r => Number(r.rating))
                    .filter(r => !isNaN(r) && r > 0);
                const rating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
                const prices = shopServices.map(serv => Number(serv.service_price)).filter(p => !isNaN(p));
                return {
                    supplier: s,
                    services: shopServices,
                    rating,
                    reviewCount: ratings.length,
                    price: prices.length ? Math.min(...prices) : null,
                };
            });
    }, [suppliers, services, reviews]);

    const categoryOptions = useMemo(() => {
        const labels = new Set<string>();
        shops.forEach(({ supplier }) => supplier.supplier_expertise?.forEach((e: string) => labels.add(e)));
        return Array.from(labels).sort((a, b) => a.localeCompare(b));
    }, [shops]);

    const locationOptions = useMemo(() => {
        const set = new Set<string>();
        shops.forEach(({ supplier }) => supplier.supplier_location && set.add(supplier.supplier_location));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [shops]);

    const visibleShops = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const chipConfig = CATEGORY_CHIPS.find(c => c.key === chip);
        const price = PRICE_RANGES.find(p => p.value === priceRange) ?? PRICE_RANGES[0];
        const ratingFloor = Number(minRating);
        const aiIds = aiShops ? new Set(aiShops.map(s => s.id)) : null;

        const list = shops.filter(({ supplier, rating, price: shopPrice }) => {
            if (aiIds && !aiIds.has(supplier.id)) return false;

            if (term) {
                const matches =
                    supplier.supplier_name?.toLowerCase().includes(term) ||
                    supplier.supplier_expertise?.some((e: string) => e.toLowerCase().includes(term));
                if (!matches) return false;
            }

            if (chip === "others") {
                if (KNOWN_TYPES.includes(supplier.supplier_type?.value)) return false;
            } else if (chipConfig && chipConfig.types.length > 0) {
                if (!chipConfig.types.includes(supplier.supplier_type?.value)) return false;
            }

            if (category && !supplier.supplier_expertise?.includes(category)) return false;
            if (location && supplier.supplier_location !== location) return false;
            if (price.value !== "any" && (shopPrice === null || shopPrice < price.min || shopPrice >= price.max)) return false;
            if (ratingFloor > 0 && (rating === null || rating < ratingFloor)) return false;
            return true;
        });

        return [...list].sort((a, b) => {
            switch (sortBy) {
                case "rating": return (b.rating ?? 0) - (a.rating ?? 0);
                case "price_asc": return (a.price ?? Infinity) - (b.price ?? Infinity);
                case "price_desc": return (b.price ?? -1) - (a.price ?? -1);
                default: return b.reviewCount - a.reviewCount || (b.rating ?? 0) - (a.rating ?? 0);
            }
        });
    }, [shops, searchTerm, chip, category, location, priceRange, minRating, sortBy, aiShops]);

    const hasActiveFilters =
        searchTerm !== "" || chip !== "all" || category !== "" || location !== "" ||
        priceRange !== "any" || minRating !== "0" || sortBy !== "popular" || aiShops !== null;

    const clearAll = () => {
        setSearchTerm("");
        setChip("all");
        setCategory("");
        setLocation("");
        setPriceRange("any");
        setMinRating("0");
        setSortBy("popular");
        setAiResponse("");
        setAiShops(null);
    };

    const toggleFavorite = async (supplierId: string) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        try {
            if (likedIds.has(supplierId)) {
                const snap = await getDocs(query(
                    collection(db, "favorites"),
                    where("user_id", "==", uid),
                    where("supplier_id", "==", supplierId),
                ));
                await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "favorites", d.id))));
            } else {
                await addDoc(collection(db, "favorites"), {
                    user_id: uid,
                    supplier_id: supplierId,
                    isActive: true,
                    created_at: serverTimestamp(),
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const isApplied = (supplierId: string) =>
        applications.some(app => app.supplier_id === supplierId && events.some(event => event.id === app.event_id));

    const canUseAi = userData.role !== "Supplier";

    if (isAllLoading) return <PageLoading />;

    return (
        <div className="flex flex-col gap-6">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-violet-500/10 px-6 py-8 sm:px-10 sm:py-10">
                <div className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute right-10 bottom-0 hidden size-40 rounded-full bg-violet-500/10 blur-2xl md:block" />
                <img
                    src={bookingIllustration}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-6 top-1/2 hidden w-72 -translate-y-1/2 select-none md:block lg:right-12 lg:w-96"
                />
                <div className="relative max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <Sparkles size={12} /> Trusted • Verified • Professional
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                        Find the Perfect Suppliers
                        <span className="block bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                            for Your Next Event
                        </span>
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                        Connect with top-rated suppliers for catering, venues, photography, decor, entertainment and more — all in one place.
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                        {TRUST_POINTS.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-1.5">
                                <Icon size={14} className="text-primary" /> {label}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Search + filters */}
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search for a supplier (e.g. catering, photography, venue...)"
                            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                        />
                    </div>
                    {canUseAi && (
                        <AIModal
                            ai_response={setAiResponse}
                            ai_shops={(found: Doc[]) => setAiShops(found)}
                            trigger={(open: () => void) => (
                                <button
                                    type="button"
                                    onClick={open}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                                >
                                    <Bot size={18} /> AI Search
                                </button>
                            )}
                        />
                    )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    <FilterSelect
                        label="Category"
                        value={category || ALL}
                        onChange={v => setCategory(v === ALL ? "" : v)}
                        options={[{ value: ALL, label: "All categories" }, ...categoryOptions.map(o => ({ value: o, label: o }))]}
                    />
                    <FilterSelect
                        label="Location"
                        value={location || ALL}
                        onChange={v => setLocation(v === ALL ? "" : v)}
                        options={[{ value: ALL, label: "All locations" }, ...locationOptions.map(o => ({ value: o, label: o }))]}
                    />
                    <FilterSelect
                        label="Price range"
                        value={priceRange}
                        onChange={setPriceRange}
                        options={PRICE_RANGES.map(({ value, label }) => ({ value, label }))}
                    />
                    <FilterSelect label="Rating" value={minRating} onChange={setMinRating} options={RATING_OPTIONS} />
                    <FilterSelect
                        label="Sort by"
                        value={sortBy}
                        onChange={setSortBy}
                        className="col-span-2 md:col-span-1"
                        options={SORT_OPTIONS.map(({ value, label }) => ({ value, label: `Sort by: ${label}` }))}
                    />
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={!hasActiveFilters}
                        className="col-span-2 h-10 rounded-lg text-sm font-medium text-primary transition hover:bg-primary/10 disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-transparent md:col-span-1"
                    >
                        Clear all
                    </button>
                </div>
            </section>

            {/* Category chips */}
            <nav aria-label="Supplier categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {CATEGORY_CHIPS.map(({ key, label, icon: Icon }) => {
                    const active = chip === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setChip(key)}
                            aria-pressed={active}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${active
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                        >
                            <Icon size={16} /> {label}
                        </button>
                    );
                })}
            </nav>

            {/* AI suggestion */}
            {aiResponse.length > 0 && (
                <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 p-5">
                    <button
                        type="button"
                        aria-label="Dismiss AI suggestion"
                        onClick={() => { setAiResponse(""); setAiShops(null); }}
                        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X size={16} />
                    </button>
                    <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot size={16} /></span>
                        AI Suggestion
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/80">
                        <Typewriter words={[aiResponse]} typeSpeed={20} delaySpeed={500} />
                    </div>
                </div>
            )}

            {/* Results */}
            <section>
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <Star size={18} className="fill-primary text-primary" />
                            {chip === "all" && !hasActiveFilters ? "Featured Suppliers" : "Suppliers"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {visibleShops.length} {visibleShops.length === 1 ? "supplier" : "suppliers"} · top-rated and most trusted for your special events
                        </p>
                    </div>
                </div>

                {visibleShops.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
                        <span className="text-lg font-semibold text-foreground">No suppliers found</span>
                        <span className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</span>
                        {hasActiveFilters && (
                            <button type="button" onClick={clearAll} className="mt-4 text-sm font-medium text-primary hover:underline">
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {visibleShops.map(({ supplier, services: shopServices, rating, reviewCount, price }) => {
                            const liked = likedIds.has(supplier.id);
                            const openDetails = () => setSelectedShop({
                                supplierData: supplier,
                                services: shopServices,
                                reviews: reviews.filter(r => r.reviewed_id === supplier.id),
                                averageRating: rating === null ? "N/A" : rating.toFixed(1),
                            });
                            const tags: string[] = supplier.supplier_expertise ?? [];

                            return (
                                <article
                                    key={supplier.id}
                                    onClick={openDetails}
                                    className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    <div className="relative h-44 overflow-hidden">
                                        {supplier.supplier_background_image?.length > 0 ? (
                                            <img
                                                src={supplier.supplier_background_image}
                                                loading="lazy"
                                                alt={`${supplier.supplier_name} background`}
                                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="size-full bg-gradient-to-br from-primary to-violet-500" />
                                        )}
                                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur">
                                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                            {rating === null ? "New" : rating.toFixed(1)}
                                            {reviewCount > 0 && <span className="font-normal text-muted-foreground">({reviewCount})</span>}
                                        </span>
                                        {isApplied(supplier.id) && (
                                            <span className="absolute bottom-3 left-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                                                Applied
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
                                            aria-pressed={liked}
                                            onClick={e => { e.stopPropagation(); toggleFavorite(supplier.id); }}
                                            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition hover:scale-110"
                                        >
                                            <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                                        </button>
                                    </div>

                                    <div className="flex flex-1 flex-col gap-3 p-4">
                                        <div>
                                            <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
                                                {supplier.supplier_name}
                                            </h3>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MapPin size={13} className="shrink-0" />
                                                <span className="truncate">{supplier.supplier_location}</span>
                                            </p>
                                            {supplier.supplier_availability && (
                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock size={13} className="shrink-0" />
                                                    <span className="truncate">{supplier.supplier_availability}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                                                    {tag}
                                                </span>
                                            ))}
                                            {tags.length > 3 && (
                                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    +{tags.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
                                            <div>
                                                <span className="text-[11px] text-muted-foreground">From</span>
                                                <p className="text-base font-bold text-foreground">
                                                    {price === null ? "—" : peso(price)}
                                                    <span className="ml-1 text-xs font-normal text-muted-foreground">/service</span>
                                                </p>
                                            </div>
                                            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                                                <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Bottom CTA */}
            {canUseAi && (
                <section className="flex flex-col items-start gap-4 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 to-violet-500/10 p-5 sm:flex-row sm:items-center">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Sparkles size={20} />
                    </span>
                    <div className="flex-1">
                        <h3 className="font-bold text-foreground">Can't find what you're looking for?</h3>
                        <p className="text-sm text-muted-foreground">Tell us what you need and our AI will help you find the best matches.</p>
                    </div>
                    <AIModal
                        ai_response={setAiResponse}
                        ai_shops={(found: Doc[]) => setAiShops(found)}
                        trigger={(open: () => void) => (
                            <button
                                type="button"
                                onClick={open}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                                Try AI Search <ArrowRight size={16} />
                            </button>
                        )}
                    />
                </section>
            )}

            {selectedShop && (
                <Suspense fallback={<LoadingOverlay isLoading={true} message="Please wait.." />}>
                    <SupplierModal
                        isOpen
                        onClose={() => setSelectedShop(null)}
                        supplierData={selectedShop.supplierData}
                        services={selectedShop.services}
                        reviews={selectedShop.reviews}
                        userData={userData}
                        averageRating={selectedShop.averageRating}
                    />
                </Suspense>
            )}
        </div>
    );
}
