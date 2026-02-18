import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header, MobileNav } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { SOSButton } from './components/SOSButton';
import { Dashboard } from './pages/Dashboard';
import { SafeMap } from './pages/SafeMap';
import { Community } from './pages/Community';
import { Wellness } from './pages/Wellness';
import { Evidence } from './pages/Evidence';
import { Tools } from './pages/Tools';
import { Contacts } from './pages/Contacts';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';

// Layout for Protected Routes (The main app)
const ProtectedLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  // Authentication Check
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amba-100 relative overflow-x-hidden">
        
        {/* Wavy Bottom "Aurora" Gradient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute inset-0 bg-slate-50"></div>
            <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[50vh] bg-orange-200/40 rounded-[100%] blur-[80px] mix-blend-multiply animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60vh] bg-amber-100/60 rounded-[100%] blur-[60px] mix-blend-multiply animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-30%] left-[30%] w-[60%] h-[50vh] bg-rose-100/50 rounded-[100%] blur-[90px] mix-blend-multiply animate-blob animation-delay-4000"></div>
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
        </div>

        {!isMapPage && (
          <Header 
              onMenuClick={() => setIsSidebarOpen(true)} 
              onNotificationClick={() => setShowNotifications(!showNotifications)}
              isNotificationsOpen={showNotifications}
          />
        )}
        
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="mx-auto w-full max-w-md min-h-[calc(100vh-4rem)] relative z-10 pb-28">
          
          {showNotifications && (
            <div className="absolute inset-0 z-20 animate-fade-in-up">
                <Notifications onClose={() => setShowNotifications(false)} />
            </div>
          )}

          <div className={`${showNotifications ? 'hidden' : 'block'}`}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<SafeMap onMenuClick={() => setIsSidebarOpen(true)} />} />
                <Route path="/community" element={<Community />} />
                <Route path="/wellness" element={<Wellness />} />
                <Route path="/evidence" element={<Evidence />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Navigate to="/" replace />} />
                {/* Catch all within protected layout redirects to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          
          <SOSButton />
          <MobileNav />
        </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Protected Routes Wrapper */}
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
