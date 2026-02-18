import React from 'react';
import { Home, Map, MessageCircleHeart, Shield, Menu, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 group`}
  >
    <div className={`p-2.5 transition-all duration-300 ${active ? 'bg-amba-500 text-white shadow-lg shadow-amba-500/30 -translate-y-2' : 'text-slate-400 hover:text-slate-600'} rounded-full`}>
        <Icon className={`w-6 h-6 ${active ? 'stroke-2' : 'stroke-2'}`} />
    </div>
    <span className={`text-[10px] font-bold absolute bottom-2 transition-all duration-300 ${active ? 'opacity-100 translate-y-0 text-amba-600' : 'opacity-0 translate-y-2'}`}>
        {label}
    </span>
  </Link>
);

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 pointer-events-none">
        {/* Navigation Container */}
        <div className="pointer-events-auto bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 h-20 flex items-center justify-between px-2 relative z-10 backdrop-blur-2xl">
            
            {/* Custom Top Border: Thick Center, Thin Edges */}
            <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-amba-500 to-transparent rounded-full opacity-80 blur-[0.5px]"></div>
            
            {/* Left Side */}
            <div className="flex-1 flex justify-around items-center h-full mr-10">
                <NavItem to="/" icon={Home} label="Home" active={path === '/'} />
                <NavItem to="/map" icon={Map} label="Map" active={path === '/map'} />
            </div>

            {/* Center Gap for SOS Button is handled by spacing via mr-10 and ml-10 above */}

            {/* Right Side */}
            <div className="flex-1 flex justify-around items-center h-full ml-10">
                <NavItem to="/community" icon={Shield} label="Intel" active={path === '/community'} />
                <NavItem to="/wellness" icon={MessageCircleHeart} label="Chat" active={path === '/wellness'} />
            </div>
        </div>
    </div>
  );
};

interface HeaderProps {
    onMenuClick: () => void;
    onNotificationClick: () => void;
    isNotificationsOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onNotificationClick, isNotificationsOpen }) => {
  return (
    <header className="sticky top-0 z-30 bg-transparent px-5 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amba-500 to-amba-600 rounded-full shadow-lg shadow-amba-500/20 flex items-center justify-center text-white font-display font-extrabold text-xl">
            A
        </div>
        <div>
            <h1 className="font-display font-bold text-xl leading-none text-slate-900">AMBA</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Protocol</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button 
            onClick={onNotificationClick}
            className={`p-2.5 rounded-full transition-all relative shadow-sm hover:shadow-md border ${
                isNotificationsOpen 
                ? 'bg-amba-500 text-white border-amba-500' 
                : 'bg-white text-slate-500 hover:text-amba-600 border-white hover:border-amba-100'
            }`}
        >
           <Bell className={`w-5 h-5 ${isNotificationsOpen ? 'fill-current' : ''}`} />
           {!isNotificationsOpen && (
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
           )}
        </button>
        <button onClick={onMenuClick} className="p-2.5 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}