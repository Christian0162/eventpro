export default function ShopCards ({ children, className = "" }){
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-md transition-shadow duration-300 ${className}`}>
            {children}
        </div>
    )
}