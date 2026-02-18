import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, Shield, Heart, Lock } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-12 pb-8 relative font-sans">
        
        {/* Top Section: Icon & Progress */}
        <div className="flex flex-col items-center mb-12 animate-fade-in-up">
            {/* Black Icon Box */}
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-slate-200">
                {step === 1 && <Heart className="w-7 h-7 text-white fill-current" />}
                {step === 2 && <Shield className="w-7 h-7 text-white fill-current" />}
                {step === 3 && <Lock className="w-7 h-7 text-white fill-current" />}
            </div>

            {/* Progress Indicators */}
            <div className="flex space-x-2">
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            step === i ? 'w-8 bg-orange-500' : 'w-1.5 bg-slate-200'
                        }`}
                    />
                ))}
            </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col items-center w-full max-w-xs mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            
            {step === 1 && (
                <>
                    <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-3 leading-tight">
                        Any medical <br/> conditions?
                    </h2>
                    <p className="text-slate-500 text-center text-sm mb-12 px-4 leading-relaxed">
                        This will be displayed to paramedics in case of an emergency.
                    </p>
                    <div className="w-full">
                         <input 
                            type="text" 
                            placeholder="e.g. Asthma, Diabetes (Optional)"
                            className="w-full text-center bg-transparent border-b-2 border-orange-500 py-2 text-lg font-medium text-slate-900 focus:outline-none placeholder:text-slate-300"
                            autoFocus
                         />
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-3 leading-tight">
                        Who is your <br/> Guardian?
                    </h2>
                    <p className="text-slate-500 text-center text-sm mb-12 px-4 leading-relaxed">
                        Their contact details will be used for SOS alerts.
                    </p>
                    <div className="w-full space-y-6">
                         <input 
                            type="text" 
                            placeholder="Name (e.g. Mom)"
                            className="w-full text-center bg-transparent border-b-2 border-orange-500 py-2 text-lg font-medium text-slate-900 focus:outline-none placeholder:text-slate-300"
                            autoFocus
                         />
                         <input 
                            type="tel" 
                            placeholder="Phone Number"
                            className="w-full text-center bg-transparent border-b-2 border-slate-200 focus:border-orange-500 py-2 text-lg font-medium text-slate-900 focus:outline-none placeholder:text-slate-300 transition-colors"
                         />
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-3 leading-tight">
                        Set a secure <br/> PIN
                    </h2>
                    <p className="text-slate-500 text-center text-sm mb-12 px-4 leading-relaxed">
                        You'll need this to cancel false alarms.
                    </p>
                    <div className="w-full flex justify-center space-x-4">
                         {[1, 2, 3, 4].map((i) => (
                             <input 
                                key={i}
                                type="password" 
                                maxLength={1}
                                className="w-12 h-14 text-center bg-slate-50 rounded-xl border-none text-2xl font-black text-slate-900 focus:ring-2 focus:ring-orange-500"
                             />
                         ))}
                    </div>
                </>
            )}

        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-end pt-6">
            <button 
                onClick={handleNext}
                className="bg-black text-white pl-6 pr-5 py-3.5 rounded-full font-bold text-sm flex items-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
                <span className="mr-2">{step === totalSteps ? 'Finish' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
        
    </div>
  );
};