import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Clock, Plus, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { format, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { TIMETABLE_SLOT_XP } from '../utils/gamification';

const Timetable = () => {
  const { timetable, addSlot, toggleSlot } = useAppContext();
  const [activeTab, setActiveTab] = useState('Today');
  const [now, setNow] = useState(new Date());
  const [inlineAddHour, setInlineAddHour] = useState(null);
  const [inlineTaskName, setInlineTaskName] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  
  React.useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(interval);
  }, []);

  const timelineHours = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6; // 06:00 to 22:00
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const [newTask, setNewTask] = useState({
      name: '', start: '09:00', duration: 60, priority: 'Medium', desc: ''
  });

  const getPriorityColor = (prio) => {
      if(prio === 'High') return 'bg-red-500 text-white';
      if(prio === 'Medium') return 'bg-warning text-white';
      return 'bg-primary/40 text-white';
  }

  const handleAddTask = async (e) => {
      e.preventDefault();
      if(!newTask.name) return;
      
      const slotDate = activeTab === 'Today' ? new Date() : addDays(new Date(), 1);
      
      await addSlot({
          name: newTask.name,
          start: newTask.start,
          durationMin: newTask.duration,
          priority: newTask.priority,
          description: newTask.desc,
          date: startOfDay(slotDate).toISOString()
      });

      setNewTask({name: '', start: '09:00', duration: 60, priority: 'Medium', desc: ''});
  }

  const handleInlineSave = async (hour) => {
      if(!inlineTaskName.trim()) {
          setInlineAddHour(null);
          return;
      }
      
      const slotDate = activeTab === 'Today' ? new Date() : addDays(new Date(), 1);

      await addSlot({
          name: inlineTaskName.trim(),
          start: hour,
          durationMin: 60,
          priority: 'Medium',
          description: '',
          date: startOfDay(slotDate).toISOString()
      });
      
      setInlineAddHour(null);
      setInlineTaskName('');
  };

  const toggleComplete = (id) => {
      toggleSlot(id);
  }

  const currentDaySlots = timetable.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return activeTab === 'Today' ? isToday(d) : isTomorrow(d);
  });

  const completedSlots = currentDaySlots.filter(t => t.completed).length;

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const indicatorTop = Math.max(0, (currentHour - 6) * 80 + (currentMin / 60) * 80); // 80px per hour, starting at 06:00


  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 h-full">
      {/* Left Column - Timeline */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black tracking-tight">Timetable</h2>
            <div className="flex bg-gray-100 dark:bg-[#1E1E1E] p-1 rounded-xl">
                {['Today', 'Tomorrow'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab 
                            ? 'bg-white dark:bg-[#2A2A2A] shadow-sm text-primary' 
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="glass-card flex-1 overflow-y-auto relative p-6 hide-scrollbar">
            {activeTab === 'Today' && currentHour >= 6 && currentHour <= 22 && (
                <div 
                    className="absolute left-6 right-6 z-10 flex items-center pointer-events-none transition-all duration-1000"
                    style={{ top: `${indicatorTop + 24}px` }} // +24px padding offset
                >
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="flex-1 h-px bg-red-500/50"></div>
                </div>
            )}

            <div className="space-y-6">
                {timelineHours.map((hour, idx) => {
                    const slotTasks = currentDaySlots.filter(t => t.start === hour);

                    return (
                        <div key={hour} className="flex gap-4 min-h-[80px] group relative">
                            <div className="w-16 shrink-0 text-right pt-2">
                                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors">{hour}</span>
                            </div>
                            
                            <div className="flex-1 border-t border-gray-100 dark:border-borderDark pt-2 relative">
                                {slotTasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {slotTasks.map(task => (
                                            <div 
                                                key={task.id} 
                                                className={clsx(
                                                    "p-4 rounded-xl border relative transition-all group/task",
                                                    task.completed ? "bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-borderDark opacity-60" : "bg-white dark:bg-cardDark border-primary/20 shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-xs text-gray-500 font-medium">{task.duration} min</span>
                                                        </div>
                                                        <h4 className={clsx("font-bold text-lg", task.completed && "line-through text-gray-500")}>
                                                            {task.name}
                                                        </h4>
                                                        {task.desc && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.desc}</p>}
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleComplete(task.id)}
                                                        className={clsx(
                                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                                                            task.completed ? "bg-green-500 text-white" : "border-2 border-gray-300 dark:border-gray-600 hover:border-primary text-transparent hover:text-primary"
                                                        )}
                                                    >
                                                        <Check size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    inlineAddHour === hour ? (
                                        <div className="w-full min-h-[48px] rounded-xl border-2 border-primary bg-white dark:bg-cardDark flex items-center px-3 shadow-sm transition-all">
                                            <input 
                                                autoFocus
                                                type="text" 
                                                className="w-full bg-transparent border-none focus:outline-none text-sm font-semibold"
                                                placeholder="Task name (Press Enter)..."
                                                value={inlineTaskName}
                                                onChange={e => setInlineTaskName(e.target.value)}
                                                onKeyDown={e => {
                                                    if(e.key === 'Enter') handleInlineSave(hour);
                                                    if(e.key === 'Escape') setInlineAddHour(null);
                                                }}
                                            />
                                            <button onClick={() => handleInlineSave(hour)} className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors">
                                                <Check size={16} strokeWidth={3} />
                                            </button>
                                            <button onClick={() => setInlineAddHour(null)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-md ml-1 transition-colors">
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => { setInlineAddHour(hour); setInlineTaskName(''); }}
                                            className="w-full h-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-borderDark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E1E1E]"
                                        >
                                            <span className="text-sm font-medium text-gray-500 flex items-center gap-2"><Plus size={16}/> Click to add slot</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[380px] flex flex-col gap-6">
          <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="text-primary" />
                  Schedule Task
              </h3>

              <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Task Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="e.g. Deep Work"
                        value={newTask.name}
                        onChange={e => setNewTask({...newTask, name: e.target.value})}
                      />
                  </div>
                  
                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Start Time</label>
                          <select 
                            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-all font-mono"
                            value={newTask.start}
                            onChange={e => setNewTask({...newTask, start: e.target.value})}
                          >
                              {timelineHours.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                      </div>
                      <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Duration</label>
                          <select 
                            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-all"
                            value={isCustomDuration ? 'custom' : newTask.duration}
                            onChange={e => {
                                if(e.target.value === 'custom') {
                                    setIsCustomDuration(true);
                                    setNewTask({...newTask, duration: 45});
                                } else {
                                    setIsCustomDuration(false);
                                    setNewTask({...newTask, duration: Number(e.target.value)});
                                }
                            }}
                          >
                              <option value={30}>30 min</option>
                              <option value={60}>1 hour</option>
                              <option value={90}>1.5 hrs</option>
                              <option value={120}>2 hrs</option>
                              <option value="custom">Custom...</option>
                          </select>
                          {isCustomDuration && (
                              <div className="mt-2 flex items-center gap-2">
                                  <input 
                                      type="number" 
                                      min="1"
                                      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-all text-sm"
                                      value={newTask.duration}
                                      onChange={e => setNewTask({...newTask, duration: Number(e.target.value)})}
                                      placeholder="Minutes"
                                  />
                                  <span className="text-sm font-medium text-gray-500">min</span>
                              </div>
                          )}
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Priority</label>
                      <div className="flex gap-2 p-1 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-borderDark">
                          {['Low', 'Medium', 'High'].map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setNewTask({...newTask, priority: p})}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${newTask.priority === p ? getPriorityColor(p) + ' shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-[#222]'}`}
                              >
                                  {p}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Description (Optional)</label>
                      <textarea 
                          rows={3}
                          className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                          placeholder="Add details..."
                          value={newTask.desc}
                          onChange={e => setNewTask({...newTask, desc: e.target.value})}
                      />
                  </div>

                  <button type="submit" className="w-full btn-primary py-3 mt-2">
                      Add to Schedule
                  </button>
              </form>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-primary to-blue-600 text-white border-none">
              <h4 className="font-bold mb-2">Daily Goal Progress</h4>
              <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-black">{completedSlots} <span className="text-lg opacity-70">/ {currentDaySlots.length || 6}</span></span>
                  <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-md">Slots Completed</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                   <div className="h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: `${currentDaySlots.length ? (completedSlots/currentDaySlots.length)*100 : 0}%` }}></div>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">You are maintaining a strong streak. Keep pushing through the scheduled blocks to maximize output.</p>
          </div>
      </div>
    </div>
  );
};

export default Timetable;
