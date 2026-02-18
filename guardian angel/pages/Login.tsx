import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Mock authentication
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/');
  };

  return (
    <div className="relative h-screen w-full flex flex-col justify-between overflow-hidden font-sans bg-white">
      
      {/* Background Image with White Fade at Bottom */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://i.pinimg.com/736x/58/be/27/58be27d17ee226929d056e740dd3723f.jpg"
            alt="Vibrant Background"
            className="w-full h-full object-cover"
        />
        {/* White Fade Gradient - fading from image to white at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/90"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/90 to-transparent"></div>
      </div>

      {/* TOP: Brand Section */}
      <div className="relative z-10 w-full text-center pt-16 flex flex-col items-center animate-fade-in-up">
           {/* Unique Title with 'Italianno' Curve Font - Small & Elegant */}
           <h1 className="font-curve text-6xl text-slate-900 select-none drop-shadow-sm leading-none">
              Amba
           </h1>
           
           {/* Subheading: lowercase, no caps */}
           <p className="text-slate-500 text-sm font-medium lowercase tracking-wide mt-1">
              the guardian protocol
           </p>
      </div>

      {/* BOTTOM: Buttons */}
      <div className="relative z-10 px-6 pb-12 w-full max-w-md mx-auto flex flex-col items-center space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            
            {/* 3D Bubble "Get Started" Button */}
            <button 
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-b from-[#ff9a60] to-[#FF4F00] text-white font-bold text-lg py-5 rounded-[2.5rem] shadow-bubble active:scale-95 transition-all active:shadow-inner relative overflow-hidden group"
            >
                {/* Shine effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-[2.5rem] pointer-events-none"></div>
                <span className="relative z-10 drop-shadow-md">Get Started</span>
            </button>
            
            {/* Secondary Action - White/Light */}
            <button 
                onClick={handleLogin}
                className="w-full bg-slate-50/80 backdrop-blur-md text-slate-900 font-bold text-lg py-4 rounded-[2.5rem] shadow-lg border border-slate-100 hover:bg-white transition-all active:scale-95"
            >
                Log In
            </button>
      </div>

    </div>
  );
};