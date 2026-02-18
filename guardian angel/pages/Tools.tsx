import React, { useState, useEffect } from 'react';
import { BellRing, PhoneCall, Volume2, Mic, X, Phone } from 'lucide-react';
import { Button } from '../components/Button';

export const Tools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'NONE' | 'SIREN' | 'FAKE_CALL'>('NONE');
  const [sirenInterval, setSirenInterval] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sirenInterval) window.clearInterval(sirenInterval);
    };
  }, [sirenInterval]);

  const toggleSiren = () => {
    if (activeTool === 'SIREN') {
      stopSiren();
    } else {
      startSiren();
    }
  };

  const startSiren = () => {
    setActiveTool('SIREN');
    // Simulate loud sound loop (in real app, play audio file)
    const interval = window.setInterval(() => {
      setIsFlashing(prev => !prev);
      // Play sound logic here
      if (navigator.vibrate) navigator.vibrate(500);
    }, 500);
    setSirenInterval(interval);
  };

  const stopSiren = () => {
    if (sirenInterval) window.clearInterval(sirenInterval);
    setActiveTool('NONE');
    setIsFlashing(false);
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] pt-6 px-4 transition-colors duration-300 ${activeTool === 'SIREN' && isFlashing ? 'bg-red-500' : 'bg-slate-50'}`}>
      
      {activeTool === 'NONE' && (
        <>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Safety Tools</h2>
          
          <div className="grid gap-4">
            {/* Siren Card */}
            <div 
              onClick={startSiren}
              className="bg-white rounded-2xl p-6 shadow-glass-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-red-200 transition-all active:scale-98"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-4">
                  <BellRing className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Loud Siren</h3>
                  <p className="text-sm text-slate-500">Play alarm & flash light</p>
                </div>
              </div>
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold">START</div>
            </div>

            {/* Fake Call Card */}
            <div 
              onClick={() => setActiveTool('FAKE_CALL')}
              className="bg-white rounded-2xl p-6 shadow-glass-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-green-200 transition-all active:scale-98"
            >
              <div className="flex items-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                  <PhoneCall className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Fake Call</h3>
                  <p className="text-sm text-slate-500">Simulate incoming call</p>
                </div>
              </div>
              <div className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-xs font-bold">START</div>
            </div>

            {/* Audio Record Card */}
            <div className="bg-white rounded-2xl p-6 shadow-glass-sm border border-slate-100 flex items-center justify-between opacity-60">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Record Audio</h3>
                  <p className="text-sm text-slate-500">Discreetly record evidence</p>
                </div>
              </div>
              <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold">SOON</div>
            </div>
          </div>
        </>
      )}

      {/* Siren Active State */}
      {activeTool === 'SIREN' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 text-white animate-pulse">
           <BellRing className="w-32 h-32 mb-8 animate-bounce" />
           <h1 className="text-5xl font-black mb-12 tracking-widest">ALARM</h1>
           <button 
             onClick={stopSiren}
             className="bg-white text-red-600 px-12 py-4 rounded-full font-bold text-xl shadow-xl hover:scale-105 transition-transform"
           >
             STOP ALARM
           </button>
        </div>
      )}

      {/* Fake Call Active State */}
      {activeTool === 'FAKE_CALL' && (
        <FakeCallScreen onEnd={() => setActiveTool('NONE')} />
      )}
    </div>
  );
};

// Fake Call Component
const FakeCallScreen = ({ onEnd }: { onEnd: () => void }) => {
  const [status, setStatus] = useState<'RINGING' | 'CONNECTED'>('RINGING');

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col text-white">
      {/* iOS Style Call Screen */}
      <div className="flex-1 flex flex-col items-center pt-24 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-3xl font-bold mb-6">
          M
        </div>
        <h2 className="text-3xl font-medium mb-2">Mom</h2>
        <p className="text-gray-400 text-lg mb-12">{status === 'RINGING' ? 'mobile...' : '00:12'}</p>

        <div className="w-full mt-auto mb-20 px-12">
           {status === 'RINGING' ? (
             <div className="flex justify-between items-center">
                <div className="flex flex-col items-center">
                   <button onClick={onEnd} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-2">
                      <Phone className="w-8 h-8 rotate-[135deg]" />
                   </button>
                   <span className="text-sm">Decline</span>
                </div>
                <div className="flex flex-col items-center">
                   <button onClick={() => setStatus('CONNECTED')} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                      <Phone className="w-8 h-8" />
                   </button>
                   <span className="text-sm">Accept</span>
                </div>
             </div>
           ) : (
             <div className="flex justify-center items-center">
                <div className="flex flex-col items-center">
                   <button onClick={onEnd} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-2">
                      <Phone className="w-8 h-8 rotate-[135deg]" />
                   </button>
                   <span className="text-sm">End Call</span>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}