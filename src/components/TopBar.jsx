import { Link } from 'react-router-dom';
import { Clock, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const TopBar = ({ title, subtitle }) => {
    const { profile, notifications } = useAppContext();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-medium tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm text-gray-400 font-medium mt-1">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-4">
                <Link to="/timetable" title="Timetable" className="text-gray-500 hover:text-primary transition-colors">
                    <Clock size={20} />
                </Link>
                <Link to="/notifications" title="Notifications" className="relative text-gray-500 hover:text-primary transition-colors">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
                <Link
                    to="/profile"
                    title="Profile"
                    className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden border border-gray-300 dark:border-borderDark flex items-center justify-center font-bold text-primary text-xs uppercase hover:ring-2 hover:ring-primary/50 transition-all shrink-0"
                >
                    {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl.startsWith('data:') ? profile.avatarUrl : `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}${profile.avatarUrl}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        profile?.name?.charAt(0) || 'U'
                    )}
                </Link>
            </div>
        </div>
    );
};

export default TopBar;
