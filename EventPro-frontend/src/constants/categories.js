export const SupplierOptions = [
    { label: 'Catering Services (Food & Beverages)', value: 'catering' },
    { label: 'Lighting & Sound System', value: 'lighting_sound' },
    { label: 'Event Stylist / Decorator', value: 'stylist_decorator' },
    { label: 'Venue Provider', value: 'venue' },
    { label: 'Stage & Equipment Rentals', value: 'stage_equipment' },
    { label: 'Furniture & Fixture Rentals', value: 'furniture' },
    { label: 'Photography & Videography', value: 'photo_video' },
    { label: 'Entertainment (Hosts, Performers, DJs)', value: 'entertainment' },
    { label: 'Printing & Signage Services', value: 'printing' },
    { label: 'Cake & Pastry Supplier', value: 'cake_pastry' },
    { label: 'Souvenirs & Giveaways', value: 'souvenirs' },
    { label: 'Transportation Services', value: 'transportation' },
    { label: 'Security & Logistics', value: 'security_logistics' },
    { label: 'Event Production Company', value: 'event_production' },
    { label: 'Tent & Booth Rentals', value: 'tent_booth' },
    { label: 'Technical Crew / Operators', value: 'technical' },
    { label: 'Cleaning & Maintenance', value: 'cleaning' },
    { label: 'Floral & Balloon Decorations', value: 'floral_balloon' },
    { label: 'Costume & Props Supplier', value: 'costume_props' },
    { label: 'Bar & Beverage Services', value: 'bar_beverage' }
];

export const supplierTypeToExpertise = {
    catering: ['Buffet Services', 'Plated Meals', 'Beverage Service', 'Desserts & Pastries', 'On-site Cooking'],
    lighting_sound: ['Lighting Setup', 'Sound Systems', 'Stage Effects', 'Audio/Visual Equipment', 'Power Management'],
    stylist_decorator: ['Event Styling', 'Theme Design', 'Stage Design', 'Table Arrangements', 'Balloon & Floral Decorations'],
    venue: ['Banquet Halls', 'Outdoor Venues', 'Hotels & Resorts', 'Conference Rooms', 'Private Function Areas'],
    stage_equipment: ['Stage Setup', 'Backdrops', 'Trusses', 'LED Walls', 'Equipment Rentals'],
    furniture: ['Tables & Chairs', 'Lounges', 'Bars', 'Podiums', 'Decorative Furniture'],
    photo_video: ['Photography', 'Videography', 'Drone Shots', 'Event Coverage', 'Editing & Post Production'],
    entertainment: ['Live Bands', 'DJs', 'Performers', 'Hosts / MCs', 'Cultural Shows'],
    printing: ['Invitations', 'Banners & Tarpaulins', 'Menus & Programs', 'Signage', 'Souvenirs & Giveaways'],
    cake_pastry: ['Wedding Cakes', 'Birthday Cakes', 'Cupcakes', 'Dessert Buffets', 'Pastry Styling'],
    souvenirs: ['Giveaways', 'Customized Gifts', 'Eco Bags', 'Tokens', 'Packaging & Branding'],
    transportation: ['Guest Transport', 'Luxury Cars', 'Bridal Cars', 'Logistics Vans', 'Shuttle Services'],
    security_logistics: ['Security Personnel', 'Crowd Control', 'Event Safety', 'Logistics Coordination', 'Traffic Management'],
    event_production: ['Stage Design', 'Event Planning', 'Script Management', 'Talent Coordination', 'On-site Operations'],
    tent_booth: ['Tent Rentals', 'Booth Setup', 'Outdoor Canopies', 'Exhibit Structures', 'Pop-up Installations'],
    technical: ['Audio Operators', 'Lighting Technicians', 'Video Operators', 'Stage Crew', 'System Setup'],
    cleaning: ['Venue Cleaning', 'Post-Event Cleanup', 'Waste Management', 'Disinfection', 'Maintenance Services'],
    floral_balloon: ['Floral Arrangements', 'Balloon Arches', 'Centerpieces', 'Thematic Designs', 'Bouquets'],
    costume_props: ['Costumes', 'Props', 'Backdrop Accessories', 'Theme Outfits', 'Stage Accessories'],
    bar_beverage: ['Cocktail Bar Setup', 'Bartending Services', 'Alcoholic Beverages', 'Mocktails', 'Mixology']
};


export const EventTypeOptions = [
    { label: "Birthday Celebration", value: "birthday_celebration" },
    { label: "Wedding Ceremony", value: "wedding_ceremony" },
    { label: "Corporate Event", value: "corporate_event" },
    { label: "Concert / Live Performance", value: "concert_live_performance" },
    { label: "Formal Gala", value: "formal_gala" },
    { label: "Anniversary Celebration", value: "anniversary_celebration" },
    { label: "Family Reunion", value: "family_reunion" },
    { label: "Festival / Fair", value: "festival_fair" },
    { label: "Christening / Baptism", value: "christening_baptism" },
    { label: "Entertainment Events", value: "entertainment_events" },
    { label: "Others", value: "others" },
];


export const statusOptions = [
    { label: 'Planning', value: 'planning' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
];

export const createStatusOptions = [
    { label: 'Planning', value: 'planning' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'In Progress', value: 'in_progress' },
];

export const headerBackgrounds = [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
];

export const eventStatusStyles = {
    planning: "bg-violet-100 text-violet-700",
    in_progress: "bg-blue-100 text-blue-700",
    open: "bg-blue-100 text-blue-700",
    payment_pending: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    waiting_for_completing_contract: "bg-yellow-100 text-yellow-700"
};

export const serviceType = [
    { label: 'Motorcycle', value: 'MOTORCYCLE' },
    { label: 'Aluminum 2,000kg', value: '2000KG_ALUMINUM' },
]

export const statusStyles = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    reject: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    hold: "bg-amber-100 text-amber-700",
    refunded: "bg-blue-100 text-blue-700",
    succeeded: "bg-green-100 text-green-700",
    under_review: "bg-yellow-100 text-yellow-700",

};


export const termsOfCondition = {
    title: "Terms and Conditions",
    description:
        "These terms and conditions outline the responsibilities, penalties, and obligations of both planners and suppliers to ensure fairness, accountability, and the successful execution of contracted services.",
    clauses: [
        {
            title: "Late Delivery",
            details: [
                "A penalty of 0.5% of the total contract value per day of delay will be applied to the supplier.",
                "Total penalties shall not exceed 10% to 20% of the total contract amount.",
            ],
        },
        {
            title: "Non-Delivery / No Service",
            details: [
                "A full refund of the total contract amount will be issued to the planner.",
                "All payments made by the planner must be reimbursed if no service or delivery was provided.",
                "Supplier’s account will be subject to termination due to failure to deliver the agreed service or fulfill contractual obligations.",
            ],
        },
        {
            title: "Service Non-Conformity or Damage",
            details: [
                "The supplier shall bear the cost of repair, replacement, or any loss incurred due to defective or non-conforming service.",
                "Deductions will be made from the supplier’s payment based on the actual cost verified by the client.",
            ],
        },
        {
            title: "Non-Payment by Planner",
            details: [
                "Planners are required to complete all agreed payments as stated in the contract.",
                "Failure to pay the supplier without valid justification will result in account suspension or permanent termination.",
                "Repeated payment violations may also lead to platform-wide banning of the planner’s account.",
            ],
        },
        {
            title: "Delivery Acceptance and Dispute Resolution",
            details: [
                "After delivery, the planner must either accept the delivery or raise a delivery issue with reason and proof if applicable.",
                "If an issue is raised, the supplier can submit a response with supporting evidence.",
                "If both parties disagree, the admin will review all evidence and make a final decision:",
                "• If the admin agrees with the planner, the appropriate penalty will be deducted from the supplier’s payment.",
                "• If the admin disagrees with the planner, no deduction will occur and the remaining payment, including downpayment, will be released to the supplier.",
            ],
        },
    ],
};


export const paymentMethods = [
    {
        name: "Gcash",
        method: "GCASH",
        payment_method_logo: '/payment_methods/gcashlogo.png',
        type: 'Digital Wallet',
        process_fee: 0.027,
        color: 'bg-blue-600'
    },
    {
        name: "Maya",
        method: "PAYMAYA",
        payment_method_logo: '/payment_methods/mayalogo.jpg',
        type: 'Digital Wallet',
        process_fee: 0.027,
        color: 'bg-green-400'
    },
    {
        name: "Credit Card",
        method: "CREDIT_CARD",
        payment_method_logo: '/payment_methods/creditcardlogo.jpg',
        type: 'Visa, Mastercard',
        process_fee: 0.03,
        color: 'bg-violet-500'
    }
]


export const responseTimeOptions = [
    { label: 'Within 1 Hour', value: 'within 1 hour' },
    { label: 'Within 4 Hour', value: 'within 4 hour' },
    { label: 'Within 24 Hour', value: 'within 24 hour' },
    { label: 'Within 48 Hour', value: 'within 48 hour' },
]

export const planTypeOptions = [
    { label: 'Basic Plan', value: 'basic plan' },
    { label: 'Premium Plan', value: 'premium plan' },
]

export const paymentNoticeOptions = [
    { label: 'Pay after service delivered', value: 'pay after service delivered' },
    { label: 'Down Payment required atleast 50 percent.' }
]

export const idOptions = [
    { label: "Driver's License", value: "driver_license" },
    { label: 'Social Security System (SSS) ID', value: 'sss' },
    { label: 'Unified Multi-Purpose (UMID) ID', value: 'umid' },
    { label: 'National ID', value: 'national' },
    { label: 'Philippine Identification (PhilID) / ePhilID', value: 'philid' },
]

export const documentOptions = [
    { label: 'DTI (Department of Trade and Industry', value: 'dti' },
    { label: 'Business Permit', value: 'business_permit' },
]

export const exampleIds = {
    driver_license: ['id/driver_license_front.jpg', 'id/driver_license_back.jpg'],
    sss: ['id/sss_front.jpg', 'id/sss_back.jpg'],
    umid: ['id/umid_front.jpg', 'id/umid_back.jpg'],
    national: ['id/national_id_front.jpg', 'id/national_id_back.jpg'],
    philid: ['id/ephil_front_back.jpg']
};

export const exampleDocuments = {
    dti: ['documents/dti.jpg'],
    business_permit: ['documents/business_permit.jpg'],

};
