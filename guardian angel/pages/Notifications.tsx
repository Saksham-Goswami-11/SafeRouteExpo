import React from 'react';
import { ShieldCheck, AlertCircle, Info, Check, X } from 'lucide-react';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'success',
    title: 'Guardian Accepted',
    message: 'Rahul has accepted your trusted contact request.',
    time: '2 mins ago',
    icon: ShieldCheck,
    color: 'text-green-600',
    bg: 'bg-green-100'
  },
  {
    id: 2,
    type: 'alert',
    title: 'Unsafe Zone Alert',
    message: 'High incident reports in Sector 29. Please be careful.',
    time: '1 hour ago',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-100'
  },
  {
    id: 3,
    type: 'info',
    title: 'Weekly Report',
    message: 'Your safety summary for the week is ready.',
    time: 'Yesterday',
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  {
    id: 4,
    type: 'success',
    title: 'Evidence Uploaded',
    message: 'Your audio recording has been successfully hashed.',
    time: 'Yesterday',
    icon: Check,
    color: 'text-amba-600',
    bg: 'bg-amba-100'
  }
];

interface NotificationsProps {
    onClose?: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onClose }) => {
  return (
    <div className="pb-32 pt-2 px-5 bg-slate-50/90 backdrop-blur-sm min-h-full rounded-t-[2rem]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-900">Notifications</h2>
        <div className="flex items-center space-x-4">
            <button className="text-xs text-amba-600 font-bold hover:underline">Mark all read</button>
            {onClose && (
                <button onClick={onClose} className="p-1 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors">
                    <X className="w-4 h-4 text-slate-600" />
                </button>
            )}
        </div>
      </div>

      <div className="space-y-4">
        {NOTIFICATIONS.map((notif) => (
          <div key={notif.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start space-x-4 hover:border-amba-100 transition-colors animate-slide-in-right" style={{animationDelay: `${notif.id * 100}ms`}}>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.bg} ${notif.color}`}>
               <notif.icon className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h3 className="font-bold text-slate-800 text-sm">{notif.title}</h3>
                 <span className="text-[10px] text-slate-400">{notif.time}</span>
               </div>
               <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">No more notifications</p>
      </div>
    </div>
  );
};