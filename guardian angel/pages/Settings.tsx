import React, { useState } from 'react';
import { 
  User, 
  Copy, 
  Shield, 
  Clock, 
  Users, 
  ChevronRight, 
  Bell, 
  Smartphone, 
  MapPin, 
  FileAudio, 
  LogOut, 
  UserCog, 
  X, 
  Plus, 
  Home, 
  Briefcase, 
  Navigation 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [ghostMode, setGhostMode] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [shakeToSos, setShakeToSos] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);

  // Mock User Data
  const user = {
    name: 'Jane Smith',
    handle: '@janesmith',
    id: 'e993dbcf82a1',
    safetyScore: 98,
    protectedHours: 24,
    contactsCount: 3
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    alert('ID copied to clipboard');
  };

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    }
  };

  return (
    <div className="pb-32 pt-6 px-5 min-h-screen bg-slate-50">
      
      {/* 1. Profile Header */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up">
        <div className="relative mb-4 group cursor-pointer">
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-amba-400 to-purple-500">
                <div className="w-full h-full rounded-full bg-white p-1">
                    <img 
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                EDIT
            </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-slate-900">{user.name}</h2>
        <p className="text-slate-400 text-sm font-medium mb-3">{user.handle}</p>
        
        <button 
            onClick={handleCopyId}
            className="flex items-center space-x-2 bg-slate-100 px-4 py-1.5 rounded-full text-xs font-mono text-slate-500 hover:bg-slate-200 transition-colors"
        >
            <span>ID: {user.id.slice(0, 8)}...</span>
            <Copy className="w-3 h-3" />
        </button>
      </div>

      {/* 2. Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
         <StatCard icon={Shield} value={`${user.safetyScore}%`} label="Safety Score" color="text-green-600" bg="bg-green-50" />
         <StatCard icon={Clock} value={`${user.protectedHours}h`} label="Protected" color="text-blue-600" bg="bg-blue-50" />
         <StatCard icon={Users} value={user.contactsCount} label="Contacts" color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* 3. Ghost Mode Card */}
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className={`rounded-3xl p-5 flex items-center justify-between transition-all duration-300 shadow-lg ${ghostMode ? 'bg-slate-900 text-white shadow-slate-900/30' : 'bg-white text-slate-900 border border-slate-100'}`}>
            <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ghostMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <UserCog className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Ghost Mode</h3>
                    <p className={`text-xs ${ghostMode ? 'text-slate-400' : 'text-slate-500'} max-w-[150px]`}>
                        Go unseen on the map immediately.
                    </p>
                </div>
            </div>
            <ToggleSwitch checked={ghostMode} onChange={() => setGhostMode(!ghostMode)} />
        </div>
      </div>

      {/* 4. Preferences Section */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Preferences</h3>
         <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
             
             <div className="p-4 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Bell className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Push Notifications</span>
                </div>
                <ToggleSwitch checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
             </div>

             <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Shake to SOS</span>
                </div>
                <ToggleSwitch checked={shakeToSos} onChange={() => setShakeToSos(!shakeToSos)} />
             </div>

         </div>
      </div>

      {/* 5. Account Section */}
      <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Account</h3>
         <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
             
             <MenuItem 
                icon={Users} 
                label="Emergency Contacts" 
                onClick={() => navigate('/contacts')} 
             />
             <MenuItem 
                icon={MapPin} 
                label="Saved Locations" 
                onClick={() => setShowLocationsModal(true)} 
             />
             <MenuItem 
                icon={FileAudio} 
                label="Audio Evidence" 
                onClick={() => navigate('/evidence')} 
                isLast
             />

         </div>
      </div>

      {/* 6. Action Buttons */}
      <div className="space-y-4 mb-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
         <button className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:bg-indigo-700 transition-colors active:scale-95">
             <Shield className="w-4 h-4 mr-2" />
             SWITCH TO GUARDIAN MODE
         </button>
         
         <button 
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors active:scale-95 flex items-center justify-center"
         >
             <LogOut className="w-4 h-4 mr-2" />
             LOG OUT
         </button>
      </div>

      {/* --------------------------- */}
      {/* SAVED LOCATIONS MODAL       */}
      {/* --------------------------- */}
      {showLocationsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLocationsModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 animate-slide-in-up">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display font-bold text-slate-900">Saved Locations</h2>
                    <button onClick={() => setShowLocationsModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {/* Location Items */}
                    <LocationItem label="Home" address="12/B, Green Avenue, Delhi" icon={Home} />
                    <LocationItem label="Work" address="Cyber City, DLF Phase 2, Gurgaon" icon={Briefcase} />
                    <LocationItem label="Gym" address="Gold's Gym, Sector 14" icon={Navigation} />
                </div>

                <button className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold text-sm flex items-center justify-center hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Location
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

// Helper Components

const StatCard = ({ icon: Icon, value, label, color, bg }: any) => (
    <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
        <div className={`w-8 h-8 ${bg} ${color} rounded-full flex items-center justify-center mb-2`}>
            <Icon className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-slate-900 leading-none mb-1">{value}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
    </div>
);

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-amba-500' : 'bg-slate-200'}`}
    >
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
);

const MenuItem = ({ icon: Icon, label, onClick, isLast }: any) => (
    <div 
        onClick={onClick}
        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700 text-sm">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300" />
    </div>
);

const LocationItem = ({ label, address, icon: Icon }: any) => (
    <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-700 shadow-sm mr-4 group-hover:text-amba-500 transition-colors">
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-sm">{label}</h4>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{address}</p>
        </div>
        <button className="text-slate-300 hover:text-slate-500">
            <div className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors">
                <ChevronRight className="w-4 h-4" />
            </div>
        </button>
    </div>
);
