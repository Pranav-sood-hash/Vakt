import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { getRankInfo } from '../utils/gamification';
import { Trophy, CheckCircle2, XCircle, Activity, Star, Target, Shield, Clock, Camera } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { formatDistanceToNow, isPast } from 'date-fns';

const Profile = () => {
  const { profile, updateProfile, settings, pointsData, tasks, activity } = useAppContext();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              await updateProfile({ avatarUrl: reader.result });
          };
          reader.readAsDataURL(file);
      }
  };

  const rankInfo = getRankInfo(pointsData?.totalXP || 0);
  
  const tasksCompleted = tasks.filter(t => t.completed).length;
  const tasksMissed = tasks.filter(t => !t.completed && t.dueDateTime && isPast(new Date(t.dueDateTime))).length;
  
  const totalTasks = tasks.length;
  const weeklyProgress = totalTasks === 0 ? 0 : Math.round((tasksCompleted / totalTasks) * 100);
  const disciplineScore = (tasksCompleted + tasksMissed) === 0 ? 0 : Math.round((tasksCompleted / (tasksCompleted + tasksMissed)) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
              <div 
                  className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-5xl shadow-xl shadow-primary/30 shrink-0 transform -rotate-3 uppercase relative group cursor-pointer overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
              >
                  {profile?.avatarUrl ? (
                      <img 
                          src={profile.avatarUrl.startsWith('data:') ? profile.avatarUrl : `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}${profile.avatarUrl}`} 
                          alt="Avatar" 
                          className="w-full h-full object-cover transform rotate-3" 
                      />
                  ) : (
                      profile?.name?.charAt(0) || 'U'
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={32} className="text-white drop-shadow-md transform rotate-3" />
                  </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              
              <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                          <h2 className="text-3xl font-black tracking-tight">{profile?.name || 'User'}</h2>
                          <div className="text-gray-500 font-medium">@{profile?.username || 'user'} • {profile?.email}</div>
                      </div>
                      <Link to="/profile/edit" className="btn-primary w-full md:w-auto text-center">Edit Profile</Link>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <div className="flex items-center gap-2 bg-warning/10 text-warning px-4 py-2 rounded-xl font-bold text-sm">
                          <Shield size={16} /> {rankInfo.currentRank.name}
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm">
                          <Star size={16} /> {pointsData?.totalXP || 0} Points
                      </div>
                      <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold text-sm">
                          <Activity size={16} /> {pointsData?.streak || 0} Day Streak
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="glass-card p-6 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                  <CheckCircle2 size={20} />
              </div>
              <div>
                  <div className="text-3xl font-black">{tasksCompleted}</div>
                  <div className="text-sm font-medium text-gray-500">Total Tasks Completed</div>
              </div>
          </div>
          
          <div className="glass-card p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                      <XCircle size={20} />
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md">-5%</span>
              </div>
              <div>
                  <div className="text-3xl font-black text-red-500">{tasksMissed}</div>
                  <div className="text-sm font-medium text-gray-500">Tasks Missed</div>
              </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                  <Target size={20} />
              </div>
              <div>
                  <div className="text-3xl font-black">{weeklyProgress}%</div>
                  <div className="text-sm font-medium text-gray-500">Weekly Progress</div>
              </div>
          </div>

          <div className="glass-card p-6 flex items-center justify-center">
              <div className="w-28 h-28 relative">
                  <CircularProgressbar
                      value={disciplineScore}
                      text={`${disciplineScore}`}
                      strokeWidth={10}
                      styles={buildStyles({
                          textColor: settings.darkMode ? '#fff' : '#111',
                          pathColor: '#3B5BDB',
                          trailColor: settings.darkMode ? '#2A2A2A' : '#E5E7EB',
                      })}
                  />
                  <div className="absolute -bottom-2 w-full text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Discipline Score
                  </div>
              </div>
          </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {/* Achievements */}
          <div className="glass-card p-6">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                  <Trophy className="text-warning" />
                  Achievements
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                      { icon: CheckCircle2, name: 'First Task', unlocked: tasksCompleted >= 1, color: 'text-green-500', bg: 'bg-green-500/10' },
                      { icon: Activity, name: '7-Day Streak', unlocked: (pointsData?.streak || 0) >= 7, color: 'text-red-500', bg: 'bg-red-500/10' },
                      { icon: Star, name: '40 Points', unlocked: (pointsData?.totalXP || 0) >= 40, color: 'text-warning', bg: 'bg-warning/10' },
                      { icon: Shield, name: 'Silver Rank', unlocked: (pointsData?.totalXP || 0) >= 500, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-[#2A2A2A]' },
                  ].map((badge, i) => (
                      <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl text-center transition-all ${badge.unlocked ? 'border border-gray-100 dark:border-borderDark hover:-translate-y-1 hover:shadow-md' : 'opacity-50 grayscale'}`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${badge.unlocked ? badge.bg : 'bg-gray-200 dark:bg-[#333]'} ${badge.unlocked ? badge.color : 'text-gray-500'}`}>
                              <badge.icon size={24} />
                          </div>
                          <div className="text-xs font-bold leading-tight">{badge.name}</div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-6">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                  <Clock className="text-primary" />
                  Recent Activity
              </h3>
              
              <div className="space-y-6 pl-2">
                  {activity.length === 0 ? (
                      <div className="text-sm text-gray-500">No recent activity.</div>
                  ) : (
                      activity.slice(0, 10).map((act, i) => (
                          <div key={act.id} className="relative pl-6">
                              <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${act.points > 0 ? 'bg-green-500' : act.points < 0 ? 'bg-red-500' : 'bg-blue-500'} ring-4 ring-white dark:ring-cardDark`}></div>
                              {i !== activity.slice(0,10).length - 1 && <div className="absolute left-[3px] top-4 w-px h-full min-h-[30px] bg-gray-200 dark:bg-borderDark"></div>}
                              
                              <div className="font-medium text-sm">{act.description}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(act.timestamp))} ago</div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Profile;
