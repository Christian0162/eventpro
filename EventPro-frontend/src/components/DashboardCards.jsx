export default function DashboardCard({ children, className }) {
    return (
        <div className={`border border-gray-300 shadow-lg bg-white  rounded-2xl flex justify-between items-center p-5 px-10 ${className}`}>
            {children}
        </div>
    )
}