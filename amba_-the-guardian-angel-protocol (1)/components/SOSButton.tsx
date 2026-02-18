import React, { useState, useEffect } from 'react';
import { X, Shield, Radio, MapPin, Mic } from 'lucide-react';

export const SOSButton: React.FC = () => {
  const [active, setActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSOSSent, setIsSOSSent] = useState(false);

  useEffect(() => {
    let timer: number;
    if (active && countdown > 0 && !isSOSSent) {
      timer = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (active && countdown === 0 && !isSOSSent) {
      // Trigger SOS
      setIsSOSSent(true);
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 1000]); // Intense vibration
      }
    }
    return () => clearInterval(timer);
  }, [active, countdown, isSOSSent]);

  const handlePress = () => {
    setActive(true);
    setCountdown(5);
    setIsSOSSent(false);
  };

  const handleCancel = () => {
    setActive(false);
    setCountdown(5);
    setIsSOSSent(false);
  };

  return (
    <>
      <style>{`
        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>
      
      {/* 
        FLOATING TRIGGER BUTTON 
        Z-Index 50: Sits above the Bottom Nav (z-40)
      */}
      <div className="fixed bottom-[1.5rem] left-1/2 -translate-x-1/2 z-50 pointer-events-auto h-20 flex items-center justify-center">
         <button
          onClick={handlePress}
          className="group relative"
          aria-label="SOS"
        >
          {/* Ripple Effect */}
          <span className="absolute inset-0 rounded-full bg-red-600 animate-[ping_2s_ease-in-out_infinite] opacity-20"></span>
          <span className="absolute inset-0 rounded-full bg-red-600 animate-[ping_2s_ease-in-out_infinite] opacity-20 delay-500"></span>
          
          {/* Main Button Construction */}
          <div className="relative w-[4.5rem] h-[4.5rem] rounded-full bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.5)] border-[4px] border-white transition-transform duration-200 group-active:scale-95">
            <span className="text-white font-display font-black text-xl tracking-wider leading-none">SOS</span>
          </div>
        </button>
      </div>

      {/* 
        FULL SCREEN POPUP LAYER
        Z-Index 100: Absolute top layer.
      */}
      {active && (
        <>
          {/* 
            Background Layer - No Backdrop, Just the Modal becomes the screen essentially
            The user requested "without any background dark overlay".
            We click outside logic is usually on a backdrop, but if we remove the backdrop,
            we rely on the "Cancel" button.
          */}
          
          {/* Modal Container */}
          <div className="fixed z-[100] inset-x-3 top-2 bottom-28 animate-in slide-in-from-bottom-5 fade-in duration-300 ease-out">
            <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-0 border-none">
              
              {/* 
                DYNAMIC GRADIENT BACKGROUND
                Replaces static image and dark overlay.
                Mixes Red, Orange, and Maroon.
              */}
              <div 
                className="absolute inset-0 z-0 animate-gradient-xy"
                style={{
                  background: 'linear-gradient(-45deg, #ef4444, #dc2626, #991b1b, #f97316)',
                }}
              ></div>

              {/* CONTENT LAYER */}
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6">
                 
                 {/* Top Status */}
                 <div className="w-full flex justify-center pt-4">
                    <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-lg">
                      <Shield className="w-3 h-3 text-white fill-current" />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">Emergency Mode</span>
                    </div>
                 </div>

                 {/* Center Action */}
                 <div className="flex-1 flex flex-col items-center justify-center w-full">
                    {isSOSSent ? (
                      <div className="flex flex-col items-center animate-in zoom-in duration-300">
                         <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                            <Radio className="w-8 h-8 text-red-600 animate-pulse" />
                         </div>
                         <h2 className="text-5xl font-display font-black tracking-tighter text-white mb-2 text-center drop-shadow-xl uppercase">
                           SOS SENT
                         </h2>
                         <p className="text-white font-bold text-center text-xs tracking-wide mb-8 bg-black/20 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
                           Help is on the way.
                         </p>
                         
                         <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
                            <div className="bg-white rounded-2xl p-3 flex flex-col items-center shadow-xl">
                               <MapPin className="w-5 h-5 text-black mb-1" />
                               <span className="text-[10px] text-slate-500 uppercase font-bold">Location</span>
                               <span className="text-xs font-black text-black">Live</span>
                            </div>
                            <div className="bg-white rounded-2xl p-3 flex flex-col items-center shadow-xl">
                               <Mic className="w-5 h-5 text-black mb-1 animate-pulse" />
                               <span className="text-[10px] text-slate-500 uppercase font-bold">Audio</span>
                               <span className="text-xs font-black text-black">Rec</span>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center relative">
                         <p className="text-white font-black tracking-[0.2em] uppercase text-xs mb-6 opacity-90">
                           Sending Alert In
                         </p>
                         <h1 className="text-[160px] leading-none font-display font-black tabular-nums tracking-tighter text-white drop-shadow-lg">
                            {countdown}
                         </h1>
                         <div className="mt-6">
                             <p className="text-white font-bold text-sm bg-black/20 backdrop-blur-sm px-4 py-1 rounded-lg border border-white/20">
                               Notifying Contacts & Police
                             </p>
                         </div>
                      </div>
                    )}
                 </div>

                 {/* Bottom Action Button */}
                 <div className="w-full pb-2">
                    {isSOSSent ? (
                       <button 
                         onClick={handleCancel}
                         className="w-full bg-white text-black py-4 rounded-[3rem] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center border-0 border-white"
                       >
                         <Shield className="w-5 h-5 mr-2 text-black fill-current" />
                         I AM SAFE
                       </button>
                    ) : (
                       <button 
                         onClick={handleCancel}
                         className="w-full bg-white text-red-600 py-3 rounded-[3rem] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center border-4 border-white hover:bg-red-50"
                       >
                         <X className="w-6 h-6 mr-2 text-red-600" />
                         CANCEL ALERT
                       </button>
                    )}
                 </div>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
