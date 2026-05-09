import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getRankInfo, getTaskXP } from '../utils/gamification';
import { CheckCircle2, TrendingUp, Target, Flame, Trophy } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { differenceInSeconds, startOfDay, endOfDay, format } from 'date-fns';
import TopBar from '../components/TopBar';

const Dashboard = () => {
  const { profile, tasks, settings, pointsData, activity } = useAppContext();
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
  }, []);
  
  const currentRankInfo = getRankInfo(pointsData?.totalXP || 0);
  
  // Calculate Focus Minutes
  const todayStart = startOfDay(new Date());
  let focusedMinutesToday = 0;
  activity.forEach(log => {
      const logDate = new Date(log.timestamp);
      if (logDate >= todayStart && log.type === 'focus') {
          focusedMinutesToday += log.duration || 0;
      }
  });

  const dailyGoalMinutes = (settings.dailyGoalHours || 8) * 60;
  const percentCompleted = dailyGoalMinutes === 0 ? 0 : Math.min(100, Math.round((focusedMinutesToday / dailyGoalMinutes) * 100));

  const getDisciplineLevel = () => {
      if(percentCompleted >= 80) return { label: 'High', color: 'text-[#0052CC]', bar: 'bg-[#0052CC]' };
      if(percentCompleted >= 40) return { label: 'Medium', color: 'text-warning', bar: 'bg-warning' };
      return { label: 'Low', color: 'text-red-500', bar: 'bg-red-500' };
  };
  const disciplineLevel = getDisciplineLevel();

  const recentTasks = [...tasks].filter(t => t.completed).sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 5);

  const eod = endOfDay(new Date());
  const diffEod = differenceInSeconds(eod, now);
  const hEod = Math.floor(diffEod / 3600);
  const mEod = Math.floor((diffEod % 3600) / 60);
  const sEod = diffEod % 60;
  const resetTimerStr = `${hEod.toString().padStart(2, '0')}:${mEod.toString().padStart(2, '0')}:${sEod.toString().padStart(2, '0')}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TopBar
        title="Dashboard"
        subtitle={format(now, 'EEEE, MMM do • hh:mm a')}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Progress Ring */}
        <div className="glass-card p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          <div className="w-48 h-48 mb-6 relative">
             <CircularProgressbar
                value={percentCompleted}
                text={`${percentCompleted}%`}
                strokeWidth={8}
                styles={buildStyles({
                    textColor: settings.darkMode ? '#fff' : '#111',
                    pathColor: settings.accentColor,
                    trailColor: settings.darkMode ? '#2A2A2A' : '#E5E7EB',
                    pathTransitionDuration: 0.5,
                })}
            />
            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                FOCUSED
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Great Progress, {profile?.name?.split(' ')[0] || 'User'}</h2>
          <p className="text-gray-500 dark:text-gray-400">Daily Goal: {settings.dailyGoalHours || 8}h</p>
        </div>

        {/* Right Panel - Context */}
        <div className="flex flex-col gap-6 w-full md:w-80">
          <div className="glass-card p-6 flex-1 flex flex-col justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none">
            <h3 className="text-sm font-semibold opacity-70 mb-1 uppercase tracking-wider">End of Day Reset</h3>
            <div className="text-3xl font-black font-mono tracking-tighter mb-6">
               {resetTimerStr}
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-sm font-medium opacity-90">Today's Discipline</span>
                    <span className={`text-sm font-bold ${disciplineLevel.color}`}>{disciplineLevel.label}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                    <div className={`h-2 rounded-full ${disciplineLevel.bar}`} style={{ width: `${percentCompleted}%` }}></div>
                </div>
            </div>
          </div>
          
          <div className="glass-card p-6 border-l-4 border-l-primary flex gap-4 items-start">
             <Target className="text-primary mt-1 shrink-0" />
             <div>
                 <h4 className="font-bold mb-1">Consistency is Key</h4>
                 <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Completing all your highly prioritized tasks early in the day improves overall discipline by 40%.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Tasks Completed', value: tasks.filter(t=>t.completed).length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Total Points', value: pointsData?.totalXP || 0, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Current Rank', value: currentRankInfo.currentRank.name, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10', sub: `Lvl ${currentRankInfo.currentRank.level}` },
          { label: 'Discipline Streak', value: `${pointsData?.streak || 0} Days`, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-0.5">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-bold truncate">{stat.value}</h3>
                  {stat.sub && <span className="text-xs font-bold text-warning">{stat.sub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
              Recent Activity
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">Today</span>
          </h3>
          <div className="space-y-3">
            {recentTasks.length > 0 ? (
                recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
                    <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle2 size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{task.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.dueDateTime ? format(new Date(task.dueDateTime), 'hh:mm a') : 'No time'}
                        </p>
                    </div>
                    </div>
                    <div className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                    +{getTaskXP(task.priority)} XP
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center py-8 text-sm text-gray-500">No tasks completed today yet. Start moving!</div>
            )}
          </div>
        </div>

        {/* Rank Progression */}
        <div className="glass-card p-6 flex flex-col justify-center">
           <div className="flex items-center justify-between mb-8">
               <div>
                   <h3 className="text-lg font-bold mb-1">Rank Progression</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Push to {currentRankInfo.nextRank?.name || 'Max'}</p>
               </div>
               <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center text-warning shadow-inner">
                   <Trophy size={24} />
               </div>
           </div>

           <div className="space-y-3">
               <div className="flex justify-between text-sm font-bold">
                   <span>{currentRankInfo.currentRank.name}</span>
                   {currentRankInfo.nextRank && <span className="text-gray-500">{currentRankInfo.nextRank.name}</span>}
               </div>
               <div className="w-full bg-gray-100 dark:bg-[#2A2A2A] rounded-full h-3 shadow-inner overflow-hidden">
                   <div 
                        className="h-3 rounded-full bg-gradient-to-r from-warning to-yellow-300 relative" 
                        style={{ width: `${currentRankInfo.progress}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 animate-pulse-slow"></div>
                    </div>
               </div>
               <div className="text-right text-xs text-gray-500 dark:text-gray-400 font-medium">
                   {currentRankInfo.nextRank ? `${pointsData?.totalXP || 0} / ${currentRankInfo.nextRank.minXp} XP` : 'Max Rank Achieved'}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
