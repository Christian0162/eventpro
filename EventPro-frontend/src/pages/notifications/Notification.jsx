import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import NotificationModal from '../../components/NotificationModal';
import { useFetchNotificationsById } from '../../hooks/useNotifications';
import PageLoading from '../../components/PageLoading';
import { Title } from 'react-head';

export default function Notification({ userData }) {
    const { notifications, isLoading } = useFetchNotificationsById(userData.id);
    const [isReading, setIsReading] = useState(false);

    const markAllAsRead = async () => {
        const unread = notifications.filter((n) => n.unread);
        setIsReading(true);
        try {
            for (const updateUnread of unread) {
                await updateDoc(doc(db, 'notifications', updateUnread.id), { unread: false });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsReading(false);
        }
    };

    return (
        <>
            {isLoading && (
                <PageLoading />
            )}

            <Title>Notification</Title>

            {!isLoading && (
                <div>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Notifications
                        </h1>

                        <button
                            onClick={markAllAsRead}
                            disabled={isReading}
                            className={`transition-all duration-200 flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-xl font-medium 
                                ${isReading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                                }`}
                        >
                            {isReading ? 'Marking...' : 'Mark All As Read'}
                            <Check size={18} className="hidden sm:block text-white" />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <NotificationModal userData={userData} key={notification.id} notification={notification} />
                        ))}
                    </div>

                    {/* Empty state */}
                    {notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center py-16 px-4 sm:px-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                No notifications yet
                            </h3>
                            <p className="text-slate-500 text-sm sm:text-base">
                                When you have notifications, they'll appear here.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
