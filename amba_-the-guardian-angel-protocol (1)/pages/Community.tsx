import React, { useState } from 'react';
import { MessageSquare, MapPin, Search, Send, CheckCircle2, ShieldAlert, BarChart3, Users, Heart } from 'lucide-react';
import { analyzeSafetyReport } from '../services/geminiService';

// Mock Data Structure matching the design
const FEED_ITEMS = [
  {
    id: 1,
    user: 'Sarah Jenkins',
    role: 'Verified Guardian',
    avatar: 'S',
    verified: true,
    time: 'Today at 6:41',
    title: 'Safe Zone Active in Sector 29',
    content: 'The new AMBA Volunteer booth is now active near the metro station. Well lit and monitored.',
    likes: 2321,
    comments: 532,
    shares: 120,
    views: 5321,
    isAlert: false
  },
  {
    id: 2,
    user: 'City Police',
    role: 'Official Authority',
    avatar: 'P',
    verified: true,
    time: 'Today at 5:30',
    title: 'Patrol Update: MG Road',
    content: 'Increased patrolling has been deployed on MG Road following recent reports. Stay safe.',
    likes: 4500,
    comments: 120,
    shares: 800,
    views: 12000,
    isAlert: true
  },
  {
    id: 3,
    user: 'Anonymous User',
    role: 'Community Member',
    avatar: 'A',
    verified: false,
    time: 'Yesterday',
    title: 'Street Light Issue',
    content: 'Street lights are out near the public park entrance. Avoid this route after 8 PM.',
    likes: 89,
    comments: 12,
    shares: 5,
    views: 400,
    isAlert: false
  }
];

export const Community: React.FC = () => {
  const [newPost, setNewPost] = useState('');

  return (
    <div className="pb-28 pt-4 px-5">
      
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">J</div>
             </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">Hello Jane</p>
            <p className="text-slate-800 text-sm font-bold">Stay safe today 🛡️</p>
          </div>
        </div>
        <button className="p-2.5 bg-white rounded-full border border-slate-100 shadow-sm text-slate-600">
           <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-900 leading-tight">
          Share Safety <br /> Updates Today 🚨
        </h2>
      </div>

      {/* 2. Input Box - Pill Shaped */}
      <div className="relative mb-8">
         <div className="bg-white rounded-full shadow-sm border border-slate-100 p-1.5 pl-5 flex items-center justify-between">
             <input 
               type="text" 
               placeholder="Report an incident..." 
               className="flex-1 bg-transparent border-none text-sm placeholder-slate-400 focus:ring-0"
               value={newPost}
               onChange={(e) => setNewPost(e.target.value)}
             />
             <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">
                <Send className="w-3 h-3 mr-2" /> Post
             </button>
         </div>
      </div>

      {/* 3. Quick Access - Gradient Cards */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Quick Access</h3>
            <button className="text-xs text-slate-400 font-medium hover:text-slate-600">View all</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Discussion/Alerts */}
            <div className="relative overflow-hidden h-32 rounded-[2rem] p-5 flex flex-col justify-between group cursor-pointer shadow-lg shadow-purple-500/10 transition-transform active:scale-95">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E0C3FC] to-[#8EC5FC]"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-20 rounded-full blur-xl -mr-5 -mt-5"></div>
                
                <div className="relative z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                    <h4 className="text-white font-bold text-sm">Live Alerts</h4>
                    <p className="text-white/80 text-[10px] font-medium">Real-time danger zones</p>
                </div>
            </div>

            {/* Card 2: Tools/Resources */}
            <div className="relative overflow-hidden h-32 rounded-[2rem] p-5 flex flex-col justify-between group cursor-pointer shadow-lg shadow-blue-500/10 transition-transform active:scale-95">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-20 rounded-full blur-xl -mr-5 -mt-5"></div>
                
                <div className="relative z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-500 shadow-sm">
                    <Users className="w-5 h-5" />
                </div>
                <div className="relative z-10">
                    <h4 className="text-white font-bold text-sm">Community</h4>
                    <p className="text-white/80 text-[10px] font-medium">Verified Guardians</p>
                </div>
            </div>
        </div>
      </div>

      {/* 4. Feed Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Recent Activity Feed</h3>
            <button className="text-xs text-slate-400 font-medium hover:text-slate-600">View all</button>
        </div>

        <div className="space-y-4">
           {FEED_ITEMS.map((item) => (
               <div key={item.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-50">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 mr-3">
                              {item.avatar}
                          </div>
                          <div>
                              <div className="flex items-center">
                                  <h4 className="font-bold text-slate-900 text-sm mr-1">{item.user}</h4>
                                  {item.verified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 fill-current" />}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                          </div>
                      </div>
                      <button className="text-slate-300 hover:text-slate-500">•••</button>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                      {item.isAlert && (
                          <div className="inline-block bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded mb-2 border border-red-100">
                              OFFICIAL ALERT
                          </div>
                      )}
                      <h3 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                          {item.content}
                      </p>
                  </div>

                  {/* Stats / Engagement Pills */}
                  <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                              <Heart className="w-3 h-3 text-slate-400 mr-1.5" />
                              <span className="text-[10px] font-bold text-slate-500">{item.likes}</span>
                          </div>
                          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                              <MessageSquare className="w-3 h-3 text-slate-400 mr-1.5" />
                              <span className="text-[10px] font-bold text-slate-500">{item.comments}</span>
                          </div>
                      </div>
                      <div className="flex items-center text-slate-300 space-x-1">
                          <BarChart3 className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{item.views}</span>
                      </div>
                  </div>
               </div>
           ))}
        </div>
      </div>

    </div>
  );
};