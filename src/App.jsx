import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import FocusSessionModal from './components/FocusSessionModal';

// Pages
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import PointsRank from './pages/PointsRank';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Notifications from './pages/Notifications';
import EditProfile from './pages/EditProfile';
import ForgotPassword from './pages/ForgotPassword';

function AppContent() {
  const { isAuthenticated, loading } = useAppContext();
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-bgLight dark:bg-bgDark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Synchronizing Vakt...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-bgLight dark:bg-bgDark text-gray-900 dark:text-textDark font-sans transition-colors duration-300">
      <Sidebar onStartFocus={() => setIsFocusModalOpen(true)} />
      
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/points" element={<PointsRank />} />
          <Route path="/rank" element={<PointsRank />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {isFocusModalOpen && (
        <FocusSessionModal onClose={() => setIsFocusModalOpen(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
