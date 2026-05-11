/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AppContext = createContext();

const defaultSettings = {
  darkMode: false,
  accentColor: '#2D4FD6',
  fontSize: 14,
  taskReminders: true,
  dailyReminder: true,
  rankNotifications: true,
  soundAlerts: true,
  reminderMinutes: 15,
  startOfDay: '06:00',
  autoDeleteExpired: true,
  dailyGoalHours: 8
};

const defaultPoints = { totalXP: 0, currentRank: 'Bronze I', streak: 0, lastStreakDate: null };

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('vakt_access_token'));
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [tasks, setTasks] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [pointsData, setPointsData] = useState(defaultPoints);
  const [activity, setActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const [focusSession, setFocusSession] = useState({
    isActive: false, currentTask: null, startTime: null, duration: 0,
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const applyDarkMode = (isDark) => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  // ─── Load all data after auth ────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, tasksRes, timetableRes, pointsRes, settingsRes, notifRes, activityRes] =
        await Promise.all([
          api.get('/user/me'),
          api.get('/tasks'),
          api.get('/timetable'),
          api.get('/points'),
          api.get('/settings'),
          api.get('/notifications'),
          api.get('/user/me/activity'),
        ]);

      const u = userRes.data.data;
      if (u) {
        setProfile({ id: u.id, name: u.fullName, username: u.username, email: u.email, avatarUrl: u.avatarUrl, createdAt: u.createdAt });
      }

      // Normalise tasks from SQL shape to app shape
      const rawTasks = tasksRes?.data?.data || [];
      setTasks(rawTasks.map(t => ({
        id: t.id,
        name: t.name,
        priority: t.priority,
        dueDateTime: t.dueDateTime,
        dueTime: t.dueDateTime ? new Date(t.dueDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        completed: t.status === 'COMPLETED',
        completedAt: t.completedAt,
        createdAt: t.createdAt,
      })));

      // Normalise timetable slots
      const rawSlots = timetableRes?.data?.data || [];
      setTimetable(rawSlots.map(s => ({
        id: s.id,
        name: s.name,
        start: s.start,
        duration: s.durationMin,
        priority: s.priority,
        desc: s.description,
        date: s.date,
        completed: s.status === 'COMPLETED',
      })));

      const pts = pointsRes.data.data;
      setPointsData({
        totalXP: pts?.totalXP || 0,
        currentRank: pts?.currentRank || 'Bronze I',
        streak: pts?.streak || 0,
        lastStreakDate: pts?.lastStreakDate || null,
      });

      const s = settingsRes.data.data;
      const merged = { ...defaultSettings, ...s };
      setSettings(merged);
      applyDarkMode(merged.darkMode);

      const rawNotifs = notifRes?.data?.data || [];
      setNotifications(rawNotifs.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.isRead,
        timestamp: n.createdAt,
      })));

      const rawActivity = activityRes?.data?.data || [];
      setActivity(rawActivity.map(a => ({
        id: a.id,
        description: a.title,
        points: a.xpDelta,
        timestamp: a.createdAt,
      })));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    if (isAuthenticated) {
      loadAll();
    }
  }, [isAuthenticated, loadAll]);

  // ─── Auth ────────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user, settings: s, points } = data.data;
    localStorage.setItem('vakt_access_token', accessToken);
    localStorage.setItem('vakt_refresh_token', refreshToken);
    setIsAuthenticated(true);
    return true;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    const { accessToken, refreshToken } = data.data;
    localStorage.setItem('vakt_access_token', accessToken);
    localStorage.setItem('vakt_refresh_token', refreshToken);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('vakt_access_token');
    localStorage.removeItem('vakt_refresh_token');
    setIsAuthenticated(false);
    setProfile(null);
    setTasks([]);
    setTimetable([]);
    setPointsData(defaultPoints);
    setNotifications([]);
    setActivity([]);
    setSettings(defaultSettings);
    applyDarkMode(false);
  };

  // ─── Settings ────────────────────────────────────────────────────────────────
  const toggleDarkMode = async () => {
    const next = !settings.darkMode;
    const updated = { ...settings, darkMode: next };
    setSettings(updated);
    applyDarkMode(next);
    try { await api.patch('/settings', { darkMode: next }); } catch {}
  };

  const updateSettingKey = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try { await api.patch('/settings', { [key]: value }); } catch {}
  };

  // ─── Tasks ───────────────────────────────────────────────────────────────────
  const addTask = async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    const t = data.data;
    const normalised = {
      id: t.id, name: t.name, priority: t.priority,
      dueDateTime: t.dueDateTime, completed: false,
      completedAt: null, createdAt: t.createdAt,
    };
    setTasks(prev => [...prev, normalised]);
    return normalised;
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Optimistic update
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null }
      : t
    ));
    try {
      const { data } = await api.patch(`/tasks/${id}/complete`);
      const pts = data.data;
      if (pts) setPointsData(p => ({ ...p, totalXP: p.totalXP + (newCompleted ? 1 : -1) }));
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? task : t));
    }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await api.delete(`/tasks/${id}`); } catch {
      loadAll();
    }
  };

  // ─── Timetable ───────────────────────────────────────────────────────────────
  const addSlot = async (slotData) => {
    const { data } = await api.post('/timetable', slotData);
    const s = data.data;
    const norm = {
      id: s.id, name: s.name, start: s.start, duration: s.durationMin,
      priority: s.priority, desc: s.description, date: s.date, completed: false,
    };
    setTimetable(prev => [...prev, norm]);
    // Also add mirrored task locally
    const slotDate = new Date(slotData.date);
    const [h, m] = slotData.start.split(':');
    slotDate.setHours(parseInt(h), parseInt(m), 0, 0);
    const mirroredTask = {
      id: s.id + '_task', name: s.name, priority: s.priority || 'Medium',
      dueDateTime: slotDate.toISOString(), completed: false, completedAt: null,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, mirroredTask]);
    setPointsData(p => ({ ...p, totalXP: p.totalXP + 5 }));
    return norm;
  };

  const toggleSlot = async (id) => {
    setTimetable(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    try { await api.patch(`/timetable/${id}/complete`); } catch {}
  };

  // ─── Points ──────────────────────────────────────────────────────────────────
  const addPoints = (amount) => {
    setPointsData(p => ({ ...p, totalXP: p.totalXP + amount }));
  };

  const logActivity = (description, pointsEarned = 0) => {
    const ev = { id: Date.now().toString(), description, points: pointsEarned, timestamp: new Date().toISOString() };
    setActivity(prev => [ev, ...prev]);
  };

  // ─── Notifications ───────────────────────────────────────────────────────────
  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.patch(`/notifications/${id}/read`); } catch {}
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.patch('/notifications/read-all'); } catch {}
  };

  const addNotification = (title, message, type = 'info') => {
    const notif = {
      id: Date.now().toString(), title, message, type,
      timestamp: new Date().toISOString(), read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // ─── Profile ─────────────────────────────────────────────────────────────────
  const updateProfile = async (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
    try { await api.patch('/user/me', updates); } catch {}
  };

  // ─── Focus ──────────────────────────────────────────────────────────────────
  const startFocusSession = async (taskId) => {
    try {
      await api.post('/focus/start', { taskId });
      setFocusSession({ isActive: true, currentTask: taskId, startTime: new Date().toISOString(), duration: 0 });
    } catch {}
  };

  const endFocusSession = async (taskId, durationMin, xpAwarded) => {
    try {
      const { data } = await api.post('/focus/end', { taskId, durationMin, xpAwarded });
      setFocusSession({ isActive: false, currentTask: null, startTime: null, duration: 0 });
      // Update local points
      setPointsData(p => ({ ...p, totalXP: p.totalXP + xpAwarded }));
      return data.data;
    } catch {}
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, loading,
      login, signup, logout,
      profile, setProfile, updateProfile,
      settings, setSettings, toggleDarkMode, updateSettingKey,
      tasks, setTasks, addTask, toggleTask, deleteTask,
      timetable, setTimetable, addSlot, toggleSlot,
      pointsData, setPointsData, addPoints,
      activity, logActivity,
      notifications, setNotifications, addNotification, markNotificationRead, markAllNotificationsRead,
      focusSession, startFocusSession, endFocusSession,
      loadAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
