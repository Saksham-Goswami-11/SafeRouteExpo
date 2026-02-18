import React, { useState } from 'react';
import { MOCK_EVIDENCE } from '../constants';
import { 
  FileAudio, 
  MapPin, 
  CheckCircle, 
  ShieldCheck, 
  Lock, 
  Download, 
  Share2, 
  FileText, 
  Video, 
  Filter,
  MoreVertical,
  Cloud,
  Shield
} from 'lucide-react';

export const Evidence: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'AUDIO' | 'VIDEO' | 'LOCATION'>('ALL');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Filter logic
  const filteredEvidence = MOCK_EVIDENCE.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'LOCATION') return item.type === 'LOCATION_LOG';
    return item.type === filter; // Assumes MOCK_EVIDENCE types match closely
  });

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      alert("Secure PDF Report downloaded to your device.");
    }, 2000);
  };

  return (
    <div className="pb-32 bg-slate-50 min-h-screen">
      
      {/* 1. Secure Vault Header - Image Background */}
      <div className="relative pt-8 pb-10 px-6 rounded-b-[2.5rem] shadow-xl overflow-hidden group">
         
         {/* Background Image Layer */}
         <div className="absolute inset-0 z-0">
            <img 
              src="https://i.pinimg.com/1200x/f1/51/d8/f151d8aad797b7cb19c1d16f075459ac.jpg" 
              alt="Security Vault Background" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
         </div>

         <div className="relative z-10">
            {/* Title Row */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-display font-normal text-black flex items-center drop-shadow-md">
                        <Lock className="w-6 h-6 mr-2 stroke-[3]" /> Evidence Vault
                    </h2>
                    <p className="text-black-200 text-xs mt-1 font-medium tracking-wide ml-1 opacity-90">AES-256 Encrypted • Blockchain Verified</p>
                </div>
                <div className="p-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Cloud Storage Card - Glassmorphism */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl relative overflow-hidden group/card">
                {/* Shine Effect */}
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover/card:animate-slide-in-right transition-all"></div>
                
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-slate-100 text-xs font-bold uppercase tracking-wider">
                        <Cloud className="w-4 h-4 mr-2" />
                        Cloud Storage
                    </div>
                    <span className="text-white text-xs font-bold font-mono">2.4 GB / 5 GB</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden mb-4 border border-white/10">
                    <div className="h-full bg-gradient-to-r from-amba-400 to-amba-500 w-[45%] rounded-full shadow-[0_0_15px_rgba(251,146,60,0.6)]"></div>
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                     <div className="flex items-center">
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse mr-2 border border-white/20 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                        <span className="text-xs text-white font-semibold">Blockchain Synced</span>
                     </div>
                     <span className="text-[10px] text-slate-300 font-mono">Block #892102</span>
                </div>
            </div>
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="px-5 mt-6 relative z-20">
        
        {/* Filters */}
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide mb-6 pb-2">
            {[
                { id: 'ALL', label: 'All Items' }, 
                { id: 'AUDIO', label: 'Audio' }, 
                { id: 'VIDEO', label: 'Video' }, 
                { id: 'LOCATION', label: 'Logs' }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border ${
                        filter === tab.id 
                        ? 'bg-amba-600 text-white border-amba-600 shadow-amba-500/30' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Evidence List */}
        <div className="space-y-4">
            {filteredEvidence.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Filter className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm">No evidence found in this category.</p>
                </div>
            ) : (
                filteredEvidence.map((item) => (
                    <div key={item.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-amba-100 transition-all active:scale-[0.99]">
                        
                        {/* Header Row */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                                {/* Icon Box */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 border ${
                                    item.type === 'AUDIO' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                                    item.type === 'VIDEO' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                    'bg-blue-50 border-blue-100 text-blue-600'
                                }`}>
                                    {item.type === 'AUDIO' && <FileAudio className="w-6 h-6" />}
                                    {item.type === 'VIDEO' && <Video className="w-6 h-6" />}
                                    {item.type === 'LOCATION_LOG' && <MapPin className="w-6 h-6" />}
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                        {item.type === 'AUDIO' ? 'Voice Recording' : 
                                         item.type === 'VIDEO' ? 'Camera Footage' : 'Location Trace'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        {new Date(item.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <button className="text-slate-300 hover:text-slate-600 p-1">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Hash / Blockchain Verification Block */}
                        <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SHA-256 HASH</span>
                                {item.verifiedOnBlockchain && (
                                    <div className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                    </div>
                                )}
                            </div>
                            <p className="font-mono text-[10px] text-slate-500 truncate select-all opacity-80">
                                {item.hash}
                            </p>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <button className="flex-1 flex items-center justify-center py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group-hover:text-amba-600">
                                <Share2 className="w-3.5 h-3.5 mr-2" /> Share Safe Link
                            </button>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <button className="flex-1 flex items-center justify-center py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group-hover:text-amba-600">
                                <Download className="w-3.5 h-3.5 mr-2" /> Download
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Floating Action Button for Report */}
        <div className="mt-8 mb-4">
            <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center group active:scale-95 transition-all"
            >
                {isGeneratingReport ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                ) : (
                    <FileText className="w-5 h-5 mr-3 text-amba-400 group-hover:text-white transition-colors" />
                )}
                <span className="font-bold">
                    {isGeneratingReport ? 'Compiling Evidence...' : 'Generate Legal Report'}
                </span>
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3 px-6">
                Generates a court-admissible PDF containing all selected evidence logs, blockchain signatures, and timestamps.
            </p>
        </div>

      </div>
    </div>
  );
};
