import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Play, Pause, Square } from 'lucide-react';

const FocusSessionModal = ({ onClose }) => {
  const { tasks, startFocusSession, endFocusSession } = useAppContext();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins default
  const [isActive, setIsActive] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    const durationMin = 25; // default pomodoro
    const xp = 50; // XP for full session
    await endFocusSession(selectedTask, durationMin, xp);
    alert(`Great job! You earned ${xp} XP.`);
    onClose();
  };

  const toggleTimer = async () => {
    if (!isActive && !sessionStartTime) {
        setSessionStartTime(new Date());
        await startFocusSession(selectedTask);
    }
    setIsActive(!isActive);
  };

  const stopTimer = async () => {
    if (isActive || sessionStartTime) {
        // Calculate partial duration if stopped early? 
        // For simplicity, only reward if finished or just send what we have
        const actualMin = Math.floor((25 * 60 - timeLeft) / 60);
        if (actualMin > 0) {
            await endFocusSession(selectedTask, actualMin, actualMin * 2); // 2 XP per min
        }
    }
    setIsActive(false);
    setTimeLeft(25 * 60); // reset
    onClose();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-bgLight dark:bg-cardDark w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative border border-white/10 flex flex-col items-center">
        
        <button onClick={stopTimer} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-8 text-primary uppercase tracking-widest text-center">Focus Session</h2>

        <div className="w-full max-w-md mb-12">
            <label className="block text-sm font-medium mb-2 opacity-80 text-center">Select Task</label>
            <select 
                value={selectedTask} 
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-borderDark rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-primary transition-colors text-center"
            >
                <option value="">-- Choose a task --</option>
                {tasks.filter(t => !t.completed).map(task => (
                    <option key={task.id} value={task.id}>{task.name}</option>
                ))}
            </select>
        </div>

        <div className="text-8xl font-black tabular-nums tracking-tighter mb-12 bg-gradient-to-br from-primary to-blue-400 bg-clip-text text-transparent">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={toggleTimer}
            className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-105 shadow-lg shadow-primary/30"
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={stopTimer}
            className="w-16 h-16 rounded-full bg-white dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-md"
          >
            <Square size={24} fill="currentColor" />
          </button>
        </div>
        
        <p className="mt-8 text-sm opacity-60 text-center max-w-sm">Stay disciplined. Focus entirely on the current task and eliminate all distractions.</p>
      </div>
    </div>
  );
};

export default FocusSessionModal;
