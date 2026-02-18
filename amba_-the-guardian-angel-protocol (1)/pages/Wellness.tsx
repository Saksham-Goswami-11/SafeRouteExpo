import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, X, ArrowLeft, Pause } from 'lucide-react';
import { getWellnessResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';

const SUGGESTIONS = [
  "I feel anxious right now 😰",
  "Safety tips for traveling alone 🧳",
  "How to handle harassment? 🛡️",
  "Calming breathing exercise 🧘‍♀️",
  "Legal rights for women ⚖️"
];

export const Wellness: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]); 
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'Listening' | 'Processing' | 'Speaking'>('Listening');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await getWellnessResponse(history, userMsg.text);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  // Mock Voice Interaction
  useEffect(() => {
    let timeout: number;
    if (isVoiceMode) {
      setVoiceStatus('Listening');
      timeout = window.setTimeout(() => {
        setVoiceStatus('Processing');
        setTimeout(() => {
           setVoiceStatus('Speaking');
        }, 2000);
      }, 4000);
    }
    return () => clearTimeout(timeout);
  }, [isVoiceMode]);

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 z-10 pb-20">
      
      {/* SVG Filters for Noise and Blob Effect */}
      <svg className="hidden">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
         <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/50 backdrop-blur-sm text-slate-500 hover:bg-white transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
         </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-16 px-4 pb-4 space-y-6 scrollbar-hide">
        
        {messages.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center animate-fade-in-up">
              
              <div 
                className="relative mb-8 cursor-pointer group" 
                onClick={() => handleSend("Hello")}
              >
                 <div 
                    className="w-32 h-32 bg-gradient-to-tr from-orange-400 to-rose-300 shadow-2xl shadow-orange-500/40 transition-all duration-500 group-hover:scale-105 overflow-hidden"
                    style={{
                        borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                        animation: 'blob-bounce 10s infinite ease-in-out alternate',
                    }}
                 >
                    {/* Fixed grey edges: Added mix-blend-overlay and overflow-hidden to parent */}
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ filter: 'url(#noiseFilter)' }}></div>
                 </div>
                 
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-md">
                     <span className="text-2xl animate-bounce">👋</span>
                     <span className="font-display font-bold text-sm tracking-wider mt-1">Hello</span>
                 </div>
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-800 mb-2">How can I help you?</h3>
              <p className="text-slate-400 text-sm mb-8 text-center max-w-[250px]">
                 I'm here to listen, guide, and support you securely & anonymously.
              </p>

              <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
                 {SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(suggestion)}
                      className="px-4 py-2.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm text-xs font-semibold text-slate-600 hover:bg-amba-50 hover:text-amba-600 hover:border-amba-100 transition-all active:scale-95"
                    >
                      {suggestion}
                    </button>
                 ))}
              </div>
           </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-in-right`}>
               {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-100 to-rose-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0 border border-white shadow-sm">
                     <Sparkles className="w-4 h-4 text-rose-500" />
                  </div>
               )}
               
               <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                 isUser 
                   ? 'bg-gradient-to-br from-amba-500 to-orange-600 text-white rounded-tr-sm' 
                   : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
               }`}>
                 {msg.text}
                 <div className={`text-[10px] mt-1 font-medium opacity-70 ${isUser ? 'text-orange-100 text-right' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
               </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
             <div className="w-8 h-8 rounded-full bg-slate-100 mr-2"></div>
             <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex space-x-1.5 items-center h-10">
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full p-4 bg-slate-50">
         <form 
           onSubmit={handleFormSubmit}
           className="relative bg-white rounded-[2rem] shadow-glass-sm border border-slate-100 p-1.5 pl-5 flex items-center transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-amba-100"
         >
            <input 
               type="text" 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Type a message..."
               className="flex-1 bg-transparent border-none text-sm placeholder-slate-400 focus:ring-0 text-slate-800"
               disabled={isLoading}
            />
            
            <div className="flex items-center space-x-1">
               <button 
                 type="button"
                 onClick={() => setIsVoiceMode(true)}
                 className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors"
               >
                 <Mic className="w-5 h-5" />
               </button>

               <button 
                 type="submit" 
                 disabled={!inputText.trim() || isLoading}
                 className="bg-slate-900 text-white p-3 rounded-full shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
               >
                 <Send className="w-4 h-4 ml-0.5" />
               </button>
            </div>
         </form>
      </div>

      {/* 
        -----------------------
        VOICE MODE OVERLAY
        -----------------------
      */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col items-center justify-between overflow-hidden animate-in fade-in duration-300">
           
           {/* Top: Close Button */}
           <div className="w-full pt-14 px-6 flex justify-end z-30">
              <button 
                onClick={() => setIsVoiceMode(false)}
                className="w-12 h-12 rounded-full bg-slate-100/80 backdrop-blur-md flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
              >
                 <X className="w-6 h-6" />
              </button>
           </div>

           {/* Center: Content */}
           <div className="relative z-20 flex-1 flex flex-col items-center justify-center -mt-20">
              
              {/* Headings */}
              <div className="text-center mb-12">
                 <h2 className="text-4xl font-display font-black text-slate-900 mb-2 tracking-tight">
                    {voiceStatus === 'Listening' ? 'Listening' : 
                     voiceStatus === 'Processing' ? 'Thinking' : 'Speaking'}
                 </h2>
                 <p className="text-slate-400 text-lg font-medium">I'm here, go ahead.</p>
              </div>

              {/* Wavy Orb (Reference Style) */}
              <div className="relative group">
                 {/* Pulse Effect */}
                 <div className={`absolute inset-0 bg-orange-200 rounded-full blur-3xl opacity-50 transition-all duration-1000 ${voiceStatus === 'Listening' ? 'scale-150' : 'scale-100'}`}></div>

                 {/* The Blob */}
                 <div 
                    className="relative w-48 h-48 bg-gradient-to-tr from-orange-50 to-orange-100 flex items-center justify-center transition-all duration-500 shadow-sm border border-orange-50"
                    style={{
                        borderRadius: '42% 58% 70% 30% / 45% 45% 55% 55%',
                        animation: 'blob-bounce 5s infinite ease-in-out',
                    }}
                 >
                    <Mic className={`w-8 h-8 transition-colors duration-300 ${voiceStatus === 'Listening' ? 'text-orange-500' : 'text-slate-400'}`} />
                 </div>
              </div>
           </div>

           {/* Bottom: Gradient & Noise & Action */}
           {/* MIX AWAY FIX: Added 'maskImage' to fade out the top edge cleanly */}
           <div 
             className="absolute bottom-0 left-0 right-0 h-1/2 z-10 pointer-events-none flex flex-col justify-end items-center pb-12"
             style={{
                background: 'linear-gradient(to top, #f97316 0%, #fb923c 40%, transparent 100%)',
                maskImage: 'linear-gradient(to top, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent 100%)'
             }}
           >
               
               {/* Noise Overlay */}
               <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ filter: 'url(#noiseFilter)' }}></div>

               {/* Action Button */}
               <div className="relative z-20 pointer-events-auto">
                   <button className="flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-full px-8 py-4 text-white font-bold text-sm shadow-xl hover:bg-white/30 transition-all active:scale-95">
                       <Pause className="w-5 h-5 fill-current" />
                       <span>Pause Session</span>
                   </button>
               </div>
           </div>

        </div>
      )}

      <style>{`
        @keyframes blob-bounce {
          0% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: scale(1); }
          33% { border-radius: 58% 42% 30% 70% / 55% 55% 45% 45%; transform: scale(1.05); }
          66% { border-radius: 40% 60% 60% 40% / 40% 60% 40% 60%; transform: scale(0.95); }
          100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};