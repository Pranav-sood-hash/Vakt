import React from 'react';
import { useAppContext } from '../context/AppContext';
import { getRankInfo, RANKS } from '../utils/gamification';
import { Trophy, ArrowUpCircle, XCircle, Star, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import clsx from 'clsx';

import { formatDistanceToNow, subDays, format, startOfDay } from 'date-fns';
import TopBar from '../components/TopBar';

const PointsRank = () => {
  const { profile, pointsData, activity, tasks, settings } = useAppContext();
  const rankInfo = getRankInfo(pointsData?.totalXP || 0);

  // Calculate Chart Data
  const getChartData = () => {
      const today = startOfDay(new Date());
      const data = [];
      for(let i=6; i>=0; i--) {
          const d = subDays(today, i);
          const dayName = format(d, 'EEE');
          
          let focus = 0;
          let tasksXP = 0;
          
          activity.forEach(a => {
              if (!a.timestamp) return;
              try {
                  const actDate = startOfDay(new Date(a.timestamp));
                  if(actDate.getTime() === d.getTime()) {
                      if(a.type === 'FOCUS' || a.description?.toLowerCase().includes('focus')) focus += a.points;
                      else tasksXP += a.points;
                  }
              } catch (e) {
                  console.error('Invalid activity date:', a.timestamp);
              }
          });
          
          data.push({ name: dayName, focus, tasks: tasksXP });
      }
      return data;
  };
  const chartData = getChartData();

  const getFeedColor = (desc, pts) => {
      if(pts < 0) return { color: 'text-red-500', bg: 'bg-red-500/10' };
      if(desc.toLowerCase().includes('rank')) return { color: 'text-warning', bg: 'bg-warning/10' };
      if(desc.toLowerCase().includes('focus')) return { color: 'text-orange-500', bg: 'bg-orange-500/10' };
      return { color: 'text-primary', bg: 'bg-primary/10' };
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-8 h-full">
      
      <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-y-auto hide-scrollbar pb-8">
          <TopBar title="Points & Rank" />
          {/* Top Cards */}
          <div className="flex flex-col md:flex-row gap-6">
              {/* Current Rank Card */}
              <div className="glass-card p-8 flex-1 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-warning/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-warning/20 transition-all duration-700"></div>
                  
                  <div className="relative z-10">
                      <h3 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-6">Current Standing</h3>
                      <div className="flex items-center gap-6 mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-warning to-yellow-500 rounded-2xl flex items-center justify-center text-gray-900 shadow-lg shadow-warning/30 transform rotate-3 group-hover:rotate-6 transition-transform">
                              <Shield size={40} fill="currentColor" className="opacity-90" />
                          </div>
                          <div>
                              <div className="text-4xl font-black tracking-tight mb-1">{rankInfo.currentRank.name}</div>
                              <div className="text-warning font-semibold">Top 15% of Users</div>
                          </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-sm opacity-80">Total Discipline Points</span>
                              <span className="text-2xl font-bold text-warning">{pointsData?.totalXP || 0} XP</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Progression Stats */}
              <div className="glass-card p-6 flex-1 flex flex-col justify-center">
                  <h3 className="font-bold mb-6">Rank Progression</h3>
                  
                  <div className="mb-8">
                      <div className="flex justify-between text-sm font-bold mb-2">
                          <span>{rankInfo.currentRank.name}</span>
                          <span className="text-gray-400">{rankInfo.nextRank?.name || 'MAX'}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-[#2A2A2A] rounded-full h-4 shadow-inner p-0.5">
                          <div className="h-full rounded-full bg-gradient-to-r from-warning to-yellow-400 relative" style={{width: `${rankInfo.progress}%`}}>
                               <div className="absolute inset-0 bg-white/20 w-full animate-pulse-slow rounded-full"></div>
                          </div>
                      </div>
                      <div className="text-right text-xs mt-2 text-gray-500 font-medium">
                          {rankInfo.nextRank ? `${Math.round(rankInfo.nextRank.minXp - (pointsData?.totalXP || 0))} XP to next level` : 'Maximum level reached'}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-100 dark:border-borderDark">
                          <div className="text-xs text-gray-500 font-bold mb-1">Consistency Streak</div>
                          <div className="text-xl font-black text-primary">{pointsData?.streak || 0} Days</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-100 dark:border-borderDark">
                          <div className="text-xs text-gray-500 font-bold mb-1">Tasks Completed</div>
                          <div className="text-xl font-black text-green-500">{tasks.filter(t=>t.completed).length}</div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Chart */}
          <div className="glass-card p-6">
              <h3 className="font-bold mb-6">Weekly Performance</h3>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                          <Tooltip 
                              cursor={{fill: 'rgba(59, 91, 219, 0.05)'}}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="tasks" name="Tasks XP" stackId="a" fill="var(--primary-color)" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="focus" name="Focus XP" stackId="a" fill="#C9832A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Hierarchy Grid */}
          <div className="glass-card p-6">
              <h3 className="font-bold mb-4">Hierarchy of Discipline</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {RANKS.map((rank) => {
                      const isCurrent = rank.name === rankInfo.currentRank.name;
                      const isUnlocked = (pointsData?.totalXP || 0) >= rank.minXp;
                      
                      return (
                          <div 
                              key={rank.level} 
                              className={clsx(
                                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2",
                                  isCurrent ? "border-warning bg-warning/5 transform scale-105 shadow-lg" : 
                                  isUnlocked ? "border-primary/30 bg-white dark:bg-[#1A1A1A]" : 
                                  "border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111] opacity-50 grayscale"
                              )}
                          >
                              <Shield size={24} className={clsx(isCurrent ? "text-warning" : isUnlocked ? "text-primary" : "text-gray-400")} />
                              <div>
                                  <div className={clsx("font-bold text-sm", isCurrent && "text-warning")}>{rank.name}</div>
                                  <div className="text-xs text-gray-500">{rank.minXp} XP</div>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      </div>

      {/* Right Sidebar - Feed */}
      <div className="w-full xl:w-[320px] shrink-0">
          <div className="glass-card p-6 h-full flex flex-col">
              <h3 className="font-bold mb-6 flex items-center justify-between">
                  Discipline Feed
                  <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
              </h3>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 hide-scrollbar">
                  {activity.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-8">No activity yet. Go complete some tasks!</div>
                  ) : (
                      activity.slice(0, 20).map(event => {
                          const style = getFeedColor(event.description, event.points);
                          return (
                          <div key={event.id} className="relative pl-4 border-l-2 border-gray-100 dark:border-borderDark pb-2">
                              <div className={clsx("absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-cardDark", style.bg)}>
                                  <div className={clsx("w-full h-full rounded-full", style.bg.replace('/10', ''))}></div>
                              </div>
                              
                              <div className="mb-1 flex items-center justify-between">
                                  <span className={clsx("text-[10px] font-bold uppercase tracking-wider", style.color)}>
                                      {event.points >= 0 ? 'EARNED' : 'PENALTY'}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(event.timestamp))} ago</span>
                              </div>
                              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{event.description}</p>
                              {event.points !== 0 && <div className={clsx("text-xs font-bold mt-1", style.color)}>{event.points > 0 ? `+${event.points}` : event.points} XP</div>}
                          </div>
                          )
                      })
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default PointsRank;
