import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Moon, Bell, Clock, User, LogOut, Trash2, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

const Toggle = ({ checked, onChange }) => (
    <button 
        onClick={onChange}
        className={clsx(
            "w-12 h-6 rounded-full transition-colors relative flex items-center",
            checked ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
        )}
    >
        <div className={clsx(
            "w-4 h-4 bg-white rounded-full transition-transform absolute shadow-sm",
            checked ? "translate-x-7" : "translate-x-1"
        )}></div>
    </button>
);

const Settings = () => {
  const { settings, updateSettingKey, toggleDarkMode, profile, updateProfile, logout } = useAppContext();
  
  const [showPassword, setShowPassword] = useState(false);
  const [localProfile, setLocalProfile] = useState({
      name: profile?.name || '',
      email: profile?.email || '',
      password: ''
  });

  const updateSetting = (key, value) => {
      updateSettingKey(key, value);
  };

  const handleSaveProfile = async (e) => {
      e.preventDefault();
      await updateProfile({ fullName: localProfile.name, email: localProfile.email });
      alert('Profile updated successfully.');
  }


  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-8">
      <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight mb-2">Settings</h2>
          <p className="text-gray-500">Manage your application preferences and account.</p>
      </div>

      <div className="space-y-6">
          {/* Appearance */}
          <div className="glass-card p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-borderDark pb-4">
                  <Moon className="text-primary" size={20} /> Appearance
              </h3>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <div className="font-bold">Dark Mode</div>
                          <div className="text-sm text-gray-500">Toggle dark theme globally</div>
                      </div>
                      <Toggle checked={settings.darkMode} onChange={toggleDarkMode} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                      <div>
                          <div className="font-bold">Accent Color</div>
                          <div className="text-sm text-gray-500">Choose your primary theme color</div>
                      </div>
                      <div className="flex gap-3">
                          {['#3B5BDB', '#10B981', '#F59E0B', '#EF4444'].map(color => (
                              <button
                                  key={color}
                                  onClick={() => updateSettingKey('accentColor', color)}
                                  className={clsx(
                                      "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
                                      settings.accentColor === color ? "scale-110 ring-2 ring-offset-2 ring-offset-bgLight dark:ring-offset-bgDark" : "hover:scale-110"
                                  )}
                                  style={{ backgroundColor: color, ringColor: color }}
                              >
                                  {settings.accentColor === color && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-borderDark pb-4">
                  <Bell className="text-primary" size={20} /> Notifications
              </h3>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <div className="font-bold">Task Reminders</div>
                          <div className="text-sm text-gray-500">Get notified before tasks begin</div>
                      </div>
                      <Toggle checked={settings.taskReminders} onChange={() => updateSetting('taskReminders', !settings.taskReminders)} />
                  </div>
                  <div className="flex items-center justify-between">
                      <div>
                          <div className="font-bold">Daily Discipline Reminder</div>
                          <div className="text-sm text-gray-500">Morning push notification</div>
                      </div>
                      <Toggle checked={settings.dailyReminder} onChange={() => updateSetting('dailyReminder', !settings.dailyReminder)} />
                  </div>
                  <div className="flex items-center justify-between">
                      <div>
                          <div className="font-bold">Rank Notifications</div>
                          <div className="text-sm text-gray-500">Alerts when you rank up or down</div>
                      </div>
                      <Toggle checked={settings.rankNotifications} onChange={() => updateSetting('rankNotifications', !settings.rankNotifications)} />
                  </div>
                  <div className="flex items-center justify-between">
                      <div>
                          <div className="font-bold">Sound Alerts</div>
                          <div className="text-sm text-gray-500">Play sounds on task completion</div>
                      </div>
                      <Toggle checked={settings.soundAlerts} onChange={() => updateSetting('soundAlerts', !settings.soundAlerts)} />
                  </div>
              </div>
          </div>

          {/* Timetable Preferences */}
          <div className="glass-card p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-borderDark pb-4">
                  <Clock className="text-primary" size={20} /> Timetable Preferences
              </h3>
              
              <div className="space-y-6 max-w-lg">
                  <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                          <label className="block font-bold mb-1">Default Reminder Time</label>
                          <select 
                              className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                              value={settings.reminderTime}
                              onChange={(e) => updateSetting('reminderTime', Number(e.target.value))}
                          >
                              <option value={5}>5 mins before</option>
                              <option value={10}>10 mins before</option>
                              <option value={15}>15 mins before</option>
                              <option value={30}>30 mins before</option>
                          </select>
                      </div>
                      <div className="flex-1">
                          <label className="block font-bold mb-1">Start of Day</label>
                          <input 
                              type="time" 
                              className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                              value={settings.startOfDay}
                              onChange={(e) => updateSetting('startOfDay', e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                          <label className="block font-bold mb-1">Daily Goal (Hours)</label>
                          <input 
                              type="number" 
                              min="1" max="24"
                              className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                              value={settings.dailyGoalHours}
                              onChange={(e) => updateSetting('dailyGoalHours', Number(e.target.value))}
                          />
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                      <div>
                          <div className="font-bold">Auto-delete Expired Tasks</div>
                          <div className="text-sm text-gray-500">Remove tasks not completed by EOD</div>
                      </div>
                      <Toggle checked={settings.autoDeleteExpired} onChange={() => updateSetting('autoDeleteExpired', !settings.autoDeleteExpired)} />
                  </div>
              </div>
          </div>

          {/* Account */}
          <div className="glass-card p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-borderDark pb-4">
                  <User className="text-primary" size={20} /> Account Settings
              </h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg mb-8">
                  <div>
                      <label className="block font-bold mb-2">Full Name</label>
                      <input 
                          type="text" 
                          className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary"
                          value={localProfile.name}
                          onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block font-bold mb-2">Email Address</label>
                      <input 
                          type="email" 
                          className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary"
                          value={localProfile.email}
                          onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block font-bold mb-2">Password</label>
                      <div className="relative">
                          <input 
                              type={showPassword ? "text" : "password"} 
                              className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl pl-4 pr-12 py-2.5 focus:outline-none focus:border-primary"
                              placeholder="••••••••"
                              value={localProfile.password}
                              onChange={(e) => setLocalProfile({...localProfile, password: e.target.value})}
                          />
                          <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                      </div>
                  </div>
                  <button type="submit" className="btn-primary w-full md:w-auto px-8">Save Changes</button>
              </form>

              <div className="border-t border-gray-100 dark:border-borderDark pt-6 flex flex-col sm:flex-row gap-4">
                  <button onClick={logout} type="button" className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-gray-200 dark:border-borderDark text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
                      <LogOut size={18} /> Log Out
                  </button>
                  <button className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border-2 border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 transition-colors">
                      <Trash2 size={18} /> Delete Account
                  </button>
              </div>
          </div>

      </div>
    </div>
  );
};

export default Settings;
