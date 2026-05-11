import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckCircle2, Bell, Star, Medal, User, Settings, Moon, Sun, Timer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Sidebar = ({ onStartFocus }) => {
  const { settings, toggleDarkMode } = useAppContext();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Timetable', path: '/timetable', icon: Calendar },
    { name: 'Tasks', path: '/tasks', icon: CheckCircle2 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Points', path: '/points', icon: Star },
    { name: 'Rank', path: '/rank', icon: Medal },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="w-[260px] h-screen bg-sidebarLight dark:bg-sidebarDark border-r border-gray-100 dark:border-borderDark flex flex-col transition-colors duration-200 shrink-0 sticky top-0">
      <div className="pt-8 px-8 pb-4 flex flex-col items-start gap-1">
        <div className="flex items-center gap-3">
          <div className="relative">
              <CheckCircle2 className="text-gray-900 dark:text-white" size={28} strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-white dark:bg-sidebarDark px-0.5">Vakt</div>
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Vakt</h1>
        </div>
        <p className="text-gray-400 text-sm font-medium pl-1 mt-1">Stay Disciplined</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-4 px-4 py-3 rounded-full font-medium transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-white'}`
            }
          >
            {({ isActive }) => (
                <>
                    <item.icon size={20} className={isActive ? "text-white" : "text-gray-400"} />
                    {item.name}
                </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 space-y-6">
        <button 
          onClick={onStartFocus}
          className="w-full bg-primary hover:opacity-90 text-white rounded-full flex items-center justify-center gap-2 py-3.5 font-semibold shadow-md shadow-primary/20 transition-all active:scale-95"
        >
          <Timer size={18} />
          Start Focus Session
        </button>

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-borderDark">
            <button 
                onClick={toggleDarkMode} 
                className="flex items-center gap-4 px-4 py-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#2A2A2A]"
            >
                {settings.darkMode ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-400" />}
                Dark Mode
            </button>
            <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                `flex items-center gap-4 px-4 py-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors rounded-full ${isActive ? 'bg-gray-100 dark:bg-[#2A2A2A]' : 'hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'}`
                }
            >
                <Settings size={20} className="text-gray-400" />
                Settings
            </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
