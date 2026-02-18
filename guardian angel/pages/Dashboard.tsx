import React from 'react';
import { Shield, Eye, Heart, MapPin, ChevronRight, Lock, BellRing, PhoneCall, Zap } from 'lucide-react';
import { MOCK_VOLUNTEERS } from '../constants';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const nearbyVolunteers = MOCK_VOLUNTEERS.filter(v => v.distance < 500).length;

  return (
    <div className="pt-2 px-5 space-y-8">
      {/* Welcome */}
      <div className="flex items-center space-x-3 mb-2">
         <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full overflow-hidden border-2 border-white shadow-md">
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">J</div>
         </div>
         <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Welcome Back</p>
            <h2 className="text-xl font-display font-bold text-slate-900">Jane Smith</h2>
         </div>
      </div>

      {/* Hero Card - White & Clean */}
      <div className="relative w-full h-48 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden group border border-white">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amba-50 rounded-full opacity-50 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50 rounded-full opacity-50 blur-2xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative z-10 h-full flex items-center justify-between px-8">
           <div className="flex-1 pr-4">
              <div className="inline-flex items-center space-x-2 bg-green-50 rounded-full px-3 py-1 mb-3 border-2 border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">You are <br/>Protected</h2>
              <p className="text-slate-500 text-xs font-medium">{nearbyVolunteers} Guardians in your vicinity</p>
           </div>
           
           {/* Image Area - Replace src with your own image */}
           <div className="w-70 h-80  relative flex items-center justify-center">
              <img 
                src="https://img.freepik.com/free-vector/young-woman-white_25030-39527.jpg?t=st=1771424088~exp=1771427688~hmac=46b15a986b2beae04ca7a7b37f0b9174f9c84c444c68ac94503a21e9a8410791" 
                alt="Protected Shield" 
                className="w-full h-full object-contain translate-x-6"
              />
           </div>
        </div>
      </div>

      {/* Quick Actions - Light Gradients (Restored) */}
      <div>
        <h3 className="text-slate-800 font-display font-bold text-lg mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-amba-500" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4">
            <Link to="/map" className="group relative overflow-hidden bg-gradient-to-br from-white to-indigo-50 rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-indigo-100 transition-all active:scale-95">
                <div className="relative w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                    <MapPin className="w-5 h-5" />
                </div>
                <h4 className="relative font-bold text-slate-800">Safe Route</h4>
                <p className="relative text-[10px] text-slate-500 font-medium mt-1">AI Navigation</p>
            </Link>

            <Link to="/tools" className="group relative overflow-hidden bg-gradient-to-br from-white to-red-50 rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-red-100 transition-all active:scale-95">
                <div className="relative w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-3 text-red-600 group-hover:scale-110 transition-transform shadow-sm">
                    <BellRing className="w-5 h-5" />
                </div>
                <h4 className="relative font-bold text-slate-800">Siren</h4>
                <p className="relative text-[10px] text-slate-500 font-medium mt-1">Loud Alarm</p>
            </Link>

            <Link to="/evidence" className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-100 rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-slate-200 transition-all active:scale-95">
                <div className="relative w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 text-slate-700 group-hover:scale-110 transition-transform shadow-sm">
                    <Lock className="w-5 h-5" />
                </div>
                <h4 className="relative font-bold text-slate-800">Evidence</h4>
                <p className="relative text-[10px] text-slate-500 font-medium mt-1">Blockchain</p>
            </Link>

            <Link to="/wellness" className="group relative overflow-hidden bg-gradient-to-br from-white to-pink-50 rounded-3xl p-5 shadow-sm border border-slate-100 hover:border-pink-100 transition-all active:scale-95">
                <div className="relative w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center mb-3 text-pink-500 group-hover:scale-110 transition-transform shadow-sm">
                    <Heart className="w-5 h-5" />
                </div>
                <h4 className="relative font-bold text-slate-800">Wellness</h4>
                <p className="relative text-[10px] text-slate-500 font-medium mt-1">AI Support</p>
            </Link>
        </div>
      </div>

      {/* Community Insight */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[1.5rem] p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
        <div className="relative z-10 flex items-start justify-between">
           <div>
               <h4 className="font-bold text-lg mb-1 flex items-center">
                   <Eye className="w-4 h-4 mr-2 text-blue-200" /> Community
               </h4>
               <p className="text-blue-100 text-xs max-w-[80%] leading-relaxed mb-4">
               Sector 18 Market reporting higher safety score today.
               </p>
               <Link to="/community" className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                   View Heatmap
               </Link>
           </div>
        </div>
        <MapPin className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 transform group-hover:scale-110 transition-transform duration-500" />
      </div>
    </div>
  );
};