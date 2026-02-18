import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';

// Social Icons SVGs
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.643h6.455c-.278 1.503-1.124 2.775-2.396 3.627v3.015h3.878c2.269-2.089 3.578-5.166 3.578-8.83z" fill="#4285F4"/>
    <path d="M12 24c3.24 0 5.957-1.074 7.942-2.906l-3.878-3.015c-1.074.72-2.449 1.146-4.064 1.146-3.127 0-5.775-2.112-6.723-4.95H1.28v3.125C3.253 21.314 7.29 24 12 24z" fill="#34A853"/>
    <path d="M5.277 14.269A7.145 7.145 0 0 1 5.05 12c0-.788.136-1.545.378-2.269V6.606H1.28A11.996 11.996 0 0 0 0 12c0 1.933.465 3.758 1.28 5.394l3.997-3.125z" fill="#FBBC05"/>
    <path d="M12 4.773c1.763 0 3.348.607 4.593 1.797l3.447-3.447C17.95 1.17 15.234 0 12 0 7.29 0 3.253 2.686 1.28 6.606l3.997 3.125C6.225 6.885 8.873 4.773 12 4.773z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const Signup: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col relative px-6 pt-12 pb-6">
       
       {/* Top Navigation */}
       <div className="flex justify-between items-center mb-8">
            <button 
                onClick={() => navigate('/login')}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
       </div>

       {/* Icon Logo */}
       <div className="flex justify-center mb-6 animate-fade-in-up">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Shield className="w-6 h-6 fill-current" />
            </div>
       </div>

       {/* Form Content */}
       <div className="flex-1 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            
            <h1 className="text-3xl font-display font-bold text-slate-900 text-center mb-3">
                Create Account
            </h1>
            <p className="text-slate-500 text-center mb-8 text-sm">
                Join the AMBA protocol community.
            </p>

            <div className="w-full space-y-6">
                {/* Social Logins */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center space-x-2 border border-slate-200 rounded-xl py-3 hover:bg-slate-50 transition-colors">
                        <GoogleIcon />
                        <span className="text-sm font-bold text-slate-700">Google</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 border border-slate-200 rounded-xl py-3 hover:bg-slate-50 transition-colors">
                        <FacebookIcon />
                        <span className="text-sm font-bold text-slate-700">Facebook</span>
                    </button>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-300 uppercase">Or via email</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                </div>

                {/* Name */}
                <div className="group">
                    <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">Full Name</label>
                    <input 
                        type="text" 
                        placeholder="Jane Doe"
                        className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-300"
                    />
                </div>

                {/* Email */}
                <div className="group">
                    <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">Email</label>
                    <input 
                        type="email" 
                        placeholder="name@example.com"
                        className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-300"
                    />
                </div>

                {/* Password */}
                <div className="group">
                    <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-transparent border-b-2 border-slate-200 py-3 text-lg font-medium text-slate-900 focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-300"
                    />
                </div>
            </div>

            <div className="mt-8 w-full flex justify-end">
                <button 
                    onClick={() => navigate('/onboarding')}
                    className="bg-black text-white px-8 py-4 rounded-full font-bold text-sm flex items-center space-x-2 shadow-xl hover:scale-105 active:scale-95 transition-all w-full justify-center"
                >
                    <span>Create & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="mt-6 text-center w-full pb-4">
                <button onClick={() => navigate('/login')} className="text-slate-400 text-sm font-medium hover:text-slate-900">
                    Already have an account? Log in
                </button>
            </div>
       </div>
    </div>
  );
};