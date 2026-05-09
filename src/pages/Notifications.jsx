import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Bell, CheckCircle2, AlertTriangle, Trophy, Star, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TopBar from '../components/TopBar';

const Notifications = () => {
    const { notifications, setNotifications, markNotificationRead, markAllNotificationsRead } = useAppContext();

    const getIcon = (type) => {
        switch(type) {
            case 'success': return <CheckCircle2 className="text-green-500" />;
            case 'warning': return <AlertTriangle className="text-red-500" />;
            case 'achievement': return <Trophy className="text-warning" />;
            case 'rank': return <Star className="text-primary" />;
            default: return <Bell className="text-blue-500" />;
        }
    };

    const markAllRead = () => markAllNotificationsRead();
    const markOneRead = (id) => markNotificationRead(id);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col pb-8">
            <TopBar title="Notifications" subtitle="Stay updated on your discipline journey." />

            {notifications.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500 font-medium">
                        {unreadCount > 0 ? (
                            <span className="text-primary font-bold">{unreadCount} unread</span>
                        ) : (
                            'All caught up!'
                        )}
                    </p>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                        >
                            <CheckCheck size={16} /> Mark all read
                        </button>
                    )}
                </div>
            )}

            <div className="glass-card p-2 md:p-6 flex-1 overflow-y-auto hide-scrollbar">
                {notifications.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">No notifications yet</h3>
                        <p className="text-sm text-gray-500">When you complete tasks, reach new ranks, or unlock achievements, you'll be notified here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => markOneRead(notif.id)}
                                className={`p-4 rounded-xl border transition-colors flex gap-4 cursor-pointer ${
                                    notif.read
                                        ? 'border-gray-100 dark:border-borderDark hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                                        : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                                }`}
                            >
                                <div className="mt-1 shrink-0 relative">
                                    {getIcon(notif.type)}
                                    {!notif.read && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm mb-1">{notif.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                                    <div className="text-xs text-gray-400 mt-2 font-medium">
                                        {formatDistanceToNow(new Date(notif.timestamp))} ago
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;

