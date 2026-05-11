import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, Circle, Clock, Flame, ShieldAlert, Check, CheckSquare, Bell, X } from 'lucide-react';
import clsx from 'clsx';
import { getRankInfo, getTaskXP } from '../utils/gamification';
import { differenceInSeconds, isPast, format } from 'date-fns';
import { Link } from 'react-router-dom';
import TopBar from '../components/TopBar';

const Tasks = () => {
  const { tasks, addTask, toggleTask, deleteTask, profile, pointsData } = useAppContext();
  const [filter, setFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', dueTime: '', priority: 'Medium' });
  const [now, setNow] = useState(new Date());

  // Force re-render every second for timers
  React.useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
  }, []);

  const getTaskStatus = (dueDateTime) => {
      if(!dueDateTime) return { string: '--:--:--', urgency: 'normal' };
      const date = new Date(dueDateTime);
      if (isPast(date)) return { string: '00:00:00', urgency: 'overdue' };
      
      const diff = differenceInSeconds(date, now);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      
      const str = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      if (h < 1) return { string: str, urgency: 'urgent' };
      if (h < 3) return { string: str, urgency: 'soon' };
      return { string: str, urgency: 'normal' };
  };

  const getUrgencyColor = (urgency) => {
      if(urgency === 'urgent' || urgency === 'overdue') return { bg: 'bg-red-50/60 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-900/30', text: 'text-red-600', btn: 'bg-[#B91C1C] text-white', timer: 'text-red-600' };
      if(urgency === 'soon') return { bg: 'bg-[#F9F5F0] dark:bg-orange-900/10', border: 'border-[#E6D5C3] dark:border-orange-900/30', text: 'text-gray-900 dark:text-white', btn: 'bg-[#92400E] text-white', timer: 'text-[#92400E]' };
      return { bg: 'bg-white dark:bg-cardDark', border: 'border-gray-100 dark:border-borderDark', text: 'text-gray-900 dark:text-white', btn: 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300', timer: 'text-primary' };
  };

  const filteredTasks = tasks.filter(t => {
      if(filter === 'Pending') return !t.completed;
      if(filter === 'Completed') return t.completed;
      return true;
  });

  const handleToggle = (id) => {
      toggleTask(id);
  };

  const handleAddTask = async (e) => {
      e.preventDefault();
      if(!newTask.name || !newTask.dueTime) return;
      
      const dueDateTime = new Date();
      const [hours, minutes] = newTask.dueTime.split(':');
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await addTask({
          name: newTask.name,
          dueDateTime: dueDateTime.toISOString(),
          priority: newTask.priority
      });
      
      setNewTask({ name: '', dueTime: '', priority: 'Medium' });
      setShowAddForm(false);
  };

  const rankInfo = getRankInfo(pointsData?.totalXP || 0);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <TopBar title="Active Tasks" />
      
      <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1 p-1 bg-gray-100/50 dark:bg-cardDark rounded-full border border-gray-100 dark:border-borderDark">
              {['All', 'Pending', 'Completed'].map(f => {
                  return (
                      <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={clsx(
                              "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                              filter === f ? "bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-[#333]" : "text-gray-500 hover:text-gray-700"
                          )}
                      >
                          {f}
                      </button>
                  );
              })}
          </div>
          
          <div className="flex gap-4 text-sm text-gray-500 font-medium">
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1 text-primary font-bold hover:underline">
                  + Add Task
              </button>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> {tasks.length} Total</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#92400E]"></div> {tasks.filter(t => !t.completed && getTaskStatus(t.dueDateTime).urgency === 'soon').length} Approaching</div>
          </div>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
          {/* Task List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 hide-scrollbar pb-8">
              {showAddForm && (
                  <form onSubmit={handleAddTask} className="p-4 bg-white dark:bg-cardDark rounded-2xl border border-primary/30 mb-4 shadow-sm flex flex-col sm:flex-row gap-3">
                      <input type="text" placeholder="Task name..." value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="flex-1 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg px-3 py-2 text-sm focus:outline-none" required />
                      <input type="time" value={newTask.dueTime} onChange={e => setNewTask({...newTask, dueTime: e.target.value})} className="bg-gray-50 dark:bg-[#1A1A1A] rounded-lg px-3 py-2 text-sm focus:outline-none" required />
                      <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="bg-gray-50 dark:bg-[#1A1A1A] rounded-lg px-3 py-2 text-sm focus:outline-none">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                      </select>
                      <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Save</button>
                  </form>
              )}
              {filteredTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <CheckSquare size={48} className="mb-4 opacity-20" />
                      <p>No tasks found in this view.</p>
                  </div>
              ) : (
                  filteredTasks.map(task => {
                      const status = getTaskStatus(task.dueDateTime);
                      const style = getUrgencyColor(status.urgency);
                      const timeLabel = task.completed 
                        ? `Completed at ${task.completedAt ? format(new Date(task.completedAt), 'hh:mm a') : 'unknown'}` 
                        : `Due Today • ${task.dueDateTime ? format(new Date(task.dueDateTime), 'hh:mm a') : '--:--'}`;
                      return (
                      <div 
                          key={task.id} 
                          className={clsx(
                              "p-5 rounded-[20px] flex items-center justify-between transition-all border",
                              style.bg, style.border,
                              task.completed && "opacity-50 grayscale"
                          )}
                      >
                          <div className="flex items-center gap-5">
                              <button 
                                  onClick={() => handleToggle(task.id)}
                                  className={clsx(
                                      "w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all",
                                      task.completed ? "bg-gray-400 border-gray-400 text-white" : 
                                      style.timer.includes('red') ? "border-red-400 text-red-500 hover:bg-red-50" :
                                      style.timer.includes('orange') || style.timer.includes('92400E') ? "border-[#92400E]/50 text-[#92400E] hover:bg-[#92400E]/10" :
                                      "border-gray-400 text-transparent hover:border-gray-600"
                                  )}
                              >
                                  {task.completed && <Check size={18} strokeWidth={3} />}
                              </button>
                              
                              <div>
                                  <h4 className={clsx("font-semibold text-lg leading-tight transition-all", task.completed && "line-through", style.text)}>
                                      {task.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 font-medium mt-1">{timeLabel}</p>
                              </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-12">
                              {!task.completed ? (
                                  <>
                                      <div className="text-center min-w-[100px]">
                                          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Due In</div>
                                          <div className={clsx("text-2xl font-bold tracking-tight font-mono", style.timer)}>
                                              {status.string}
                                          </div>
                                      </div>
                                       <button 
                                           onClick={() => handleToggle(task.id)}
                                           className={clsx("text-sm font-semibold px-6 py-2.5 rounded-full transition-colors", style.btn)}
                                       >
                                           Mark Complete
                                       </button>
                                       <button 
                                           onClick={() => deleteTask(task.id)}
                                           className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                           title="Delete Task"
                                       >
                                           <X size={18} />
                                       </button>
                                  </>
                              ) : (
                                  <>
                                      <div className="text-center min-w-[100px] opacity-60">
                                          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Status</div>
                                          <div className="text-2xl font-bold tracking-tight text-gray-400">
                                              DONE
                                          </div>
                                      </div>
                                      <button disabled className="text-sm font-semibold px-6 py-2.5 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed">
                                          Completed
                                      </button>
                                  </>
                              )}
                          </div>
                      </div>
                  )})
              )}
          </div>

          {/* Right Sidebar - Motivation */}
          <div className="w-[300px] shrink-0 space-y-6 flex flex-col">
              <div className="glass-card p-6 bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl shadow-primary/20">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold">Focus Momentum</h3>
                      <Flame className="text-yellow-300" />
                  </div>
                  
                  <div className="text-center mb-6">
                      <div className="text-5xl font-black mb-1">{pointsData?.streak || 0}</div>
                      <div className="text-sm font-medium uppercase tracking-wider opacity-80">Day Streak</div>
                  </div>
                  
                  <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex justify-between text-sm mb-2">
                          <span>Efficiency</span>
                          <span className="font-bold">85%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1.5 mb-3">
                          <div className="h-1.5 rounded-full bg-yellow-300 w-[85%]"></div>
                      </div>
                      <p className="text-xs italic opacity-90 leading-relaxed">
                          "Discipline is choosing between what you want now and what you want most."
                      </p>
                  </div>
              </div>

              <div className="glass-card p-5 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ShieldAlert size={120} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Current Status</h4>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center text-warning">
                          <ShieldAlert size={20} />
                      </div>
                      <div>
                          <div className="font-bold text-lg leading-tight">{rankInfo.currentRank.name}</div>
                          <div className="text-xs text-warning font-medium">Level {rankInfo.currentRank.level}</div>
                      </div>
                  </div>
                  
                  <div className="w-full bg-gray-100 dark:bg-[#111] rounded-full h-2 mb-2 shadow-inner">
                      <div className="h-2 rounded-full bg-warning" style={{width: `${rankInfo.progress}%`}}></div>
                  </div>
                  <div className="text-right text-[10px] font-bold text-gray-400">
                      {rankInfo.nextRank ? `${Math.round(rankInfo.progress)}% to ${rankInfo.nextRank.name}` : 'MAX LEVEL'}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Tasks;
