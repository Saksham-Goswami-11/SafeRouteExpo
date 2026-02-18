import React from 'react';
import { X, User, Settings, Users, Phone, HelpCircle, LogOut, FileText, Shield, Bell } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    onClose();
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl transform transition-all duration-500 ease-in-out rounded-r-[3rem] overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amba-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Menu</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
              <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center space-x-4 mb-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-glass-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amba-50 to-transparent opacity-50"></div>
            <div className="relative w-14 h-14 bg-gradient-to-br from-amba-400 to-amba-600 rounded-full flex items-center justify-center text-white font-display font-bold text-xl shadow-md">
              J
            </div>
            <div className="relative">
              <p className="font-bold text-slate-900 text-lg">Jane Smith</p>
              <p className="text-xs text-slate-500 font-medium">+91 98765 43210</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
            <SidebarItem icon={User} label="My Profile" to="/profile" onClose={onClose} />
            <SidebarItem icon={Bell} label="Notifications" to="/notifications" onClose={onClose} />
            <SidebarItem icon={Users} label="Trusted Contacts" to="/contacts" onClose={onClose} />
            <SidebarItem icon={Phone} label="Emergency Numbers" to="/tools" onClose={onClose} />
            <SidebarItem icon={FileText} label="Evidence Locker" to="/evidence" onClose={onClose} />
            <SidebarItem icon={Shield} label="Safety Tools" to="/tools" onClose={onClose} />
            
            <div className="my-4 border-t border-slate-100"></div>
            
            <SidebarItem icon={Settings} label="Settings" to="/settings" onClose={onClose} />
            <SidebarItem icon={HelpCircle} label="Help & Support" to="/help" onClose={onClose} />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-semibold"
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span>Log Out</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-semibold">AMBA Protocol v2.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

const SidebarItem = ({ icon: Icon, label, to, onClose }: { icon: any, label: string, to: string, onClose: () => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link 
            to={to} 
            onClick={onClose}
            className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-600 hover:bg-slate-50'}`}
        >
            <Icon className={`w-5 h-5 mr-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-amba-500'}`} />
            <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>{label}</span>
            {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amba-500 rounded-l-full"></div>}
        </Link>
    );
}