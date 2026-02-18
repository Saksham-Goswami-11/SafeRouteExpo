import React, { useState, useEffect } from 'react';
import { Search, User, Menu, Shield, Navigation, Siren, Hospital, Train, Pill, Users, AlertTriangle, Sparkles, CheckCircle, ChevronUp, ChevronDown, X } from 'lucide-react';
import { getLocationSafetyScore } from '../services/geminiService';

interface SafeMapProps {
    onMenuClick: () => void;
}

interface SafetyData {
  location: string;
  score: number;
  riskLevel: 'SAFE' | 'MODERATE' | 'HIGH_RISK';
  summary: string;
  factors: string[];
}

export const SafeMap: React.FC<SafeMapProps> = ({ onMenuClick }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchText, setSearchText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false); // New state for toggle
  const [safetyData, setSafetyData] = useState<SafetyData | null>({
    location: 'Current Location',
    score: 85,
    riskLevel: 'SAFE',
    summary: 'High volunteer density and good street lighting reported.',
    factors: ['CCTV Monitored', 'Active Patrols', 'Well Lit']
  });

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setIsAnalyzing(true);
    const result = await getLocationSafetyScore(searchText);
    setIsAnalyzing(false);

    if (result) {
      setSafetyData({
        location: searchText,
        score: result.score,
        riskLevel: result.riskLevel,
        summary: result.summary,
        factors: result.factors || []
      });
      setIsCardExpanded(true); // Auto expand on new search
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Mock Map SVG Component
  const MockMapBackground = () => (
    <svg className="w-full h-full bg-[#F4F4F5]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
           <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#E4E4E7" strokeWidth="1"/>
        </pattern>
      </defs>
      
      {/* Background Grid */}
      <rect width="100%" height="100%" fill="#F4F4F5" />
      
      {/* Blocks/Buildings */}
      <g fill="#FFFFFF" stroke="#E4E4E7" strokeWidth="1">
        <rect x="-50" y="-50" width="200" height="150" />
        <rect x="180" y="-50" width="150" height="150" />
        <rect x="360" y="-50" width="200" height="150" />
        
        <rect x="-50" y="130" width="200" height="120" />
        <rect x="180" y="130" width="150" height="120" />
        <rect x="360" y="130" width="200" height="120" />

        <rect x="-50" y="280" width="200" height="150" />
        <rect x="180" y="280" width="150" height="150" />
        <rect x="360" y="280" width="200" height="150" />

        <rect x="-50" y="460" width="200" height="200" />
        <rect x="180" y="460" width="150" height="200" />
        <rect x="360" y="460" width="200" height="200" />
      </g>

      {/* Parks (Green Areas) */}
      <path d="M 180 280 L 330 280 L 330 430 L 180 430 Z" fill="#DCFCE7" stroke="#BBF7D0" /> 
      <path d="M 360 -20 L 500 -20 L 500 100 L 360 100 Z" fill="#DCFCE7" stroke="#BBF7D0" />

      {/* Street Names */}
      <g fontSize="10" fontFamily="sans-serif" fill="#94A3B8" fontWeight="500">
        <text x="80" y="115">Post St</text>
        <text x="220" y="115">Geary Blvd</text>
        <text x="80" y="265">O'Farrell St</text>
        <text x="220" y="265">Ellis St</text>
        <text x="80" y="445">Eddy St</text>
        <text x="220" y="445">Turk St</text>
        <text x="160" y="60" transform="rotate(90, 160, 60)">Steiner St</text>
        <text x="340" y="60" transform="rotate(90, 340, 60)">Fillmore St</text>
      </g>

      {/* Places of Interest Labels */}
      <g fontSize="8" fontFamily="sans-serif" fill="#64748B" fontWeight="600">
         <text x="200" y="350">Safe Park</text>
         <text x="380" y="40">District Centre</text>
      </g>
    </svg>
  );

  return (
    <div className="relative h-[calc(100vh-6rem)] w-full overflow-hidden bg-slate-50">
      
      {/* 1. The Map Layer */}
      <div className="absolute inset-0 z-0">
         <MockMapBackground />
         
         {/* Current Location Dot */}
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10 box-content"></div>
                <div className="absolute top-1/2 left-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[60px] border-t-blue-500/20 -translate-x-1/2 -translate-y-full transform -rotate-45 origin-bottom"></div>
            </div>
         </div>

         {/* Safety Markers */}
         <MapMarker x="20%" y="30%" color="bg-blue-600" icon={<Siren className="w-3 h-3 text-white" />} label="Police Stn" />
         <MapMarker x="70%" y="20%" color="bg-red-500" icon={<Hospital className="w-3 h-3 text-white" />} label="Hospital" />
         <MapMarker x="60%" y="60%" color="bg-green-600" icon={<Shield className="w-3 h-3 text-white" />} label="Safe Zone" />
      </div>

      {/* 2. Top Search Bar */}
      <div className="absolute top-0 left-0 right-0 p-5 z-20">
         <div className="flex items-center gap-3">
             <button onClick={onMenuClick} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                 <User className="w-5 h-5" />
             </button>

             <div className="flex-1 h-12 bg-black rounded-full shadow-xl flex items-center px-4 overflow-hidden relative group transition-all focus-within:ring-2 focus-within:ring-amba-500">
                 <Search className="w-4 h-4 text-white mr-3 group-focus-within:text-amba-400" />
                 <input 
                    type="text" 
                    placeholder="Analyze location safety..." 
                    className="flex-1 bg-transparent border-none text-white placeholder-gray-400 text-sm focus:ring-0"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                 />
                 {isAnalyzing && (
                    <div className="absolute right-4 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 )}
             </div>

             <button onClick={onMenuClick} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 active:scale-95 transition-transform">
                 <Menu className="w-5 h-5" />
             </button>
         </div>
      </div>

      {/* 3. Safety Score Display (Minified vs Expanded) */}
      {safetyData && (
        <>
            {/* Expanded Card */}
            {isCardExpanded && (
                <div className="absolute bottom-24 left-5 right-5 z-20 animate-fade-in-up">
                    <div className="bg-white/95 backdrop-blur-xl rounded-[1.5rem] p-4 shadow-glass border border-white/50 relative overflow-hidden">
                        
                        <button 
                            onClick={() => setIsCardExpanded(false)} 
                            className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-20"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>

                        {/* Decorative background */}
                        <div className={`absolute top-0 right-0 w-24 h-24 ${getScoreBg(safetyData.score)} opacity-10 rounded-bl-[4rem] pointer-events-none`}></div>

                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-slate-900 font-bold text-lg leading-tight capitalize max-w-[180px] truncate">{safetyData.location}</h3>
                                    {safetyData.score > 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </div>
                                <div className="flex items-center space-x-2 mb-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        safetyData.riskLevel === 'SAFE' ? 'bg-green-50 text-green-600 border-green-100' : 
                                        safetyData.riskLevel === 'MODERATE' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                        'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                        {safetyData.riskLevel.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">AI Analysis</span>
                                </div>
                            </div>

                            {/* Score Circle */}
                            <div className="relative w-14 h-14 flex items-center justify-center mr-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="28" cy="28" r="26" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                                    <circle 
                                        cx="28" cy="28" r="26" 
                                        stroke="currentColor" 
                                        strokeWidth="4" 
                                        fill="none" 
                                        strokeDasharray="163" 
                                        strokeDashoffset={163 - (163 * safetyData.score) / 100} 
                                        strokeLinecap="round"
                                        className={`${getScoreColor(safetyData.score)} transition-all duration-1000 ease-out`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-sm font-black ${getScoreColor(safetyData.score)}`}>{safetyData.score}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            <Sparkles className="w-3 h-3 inline mr-1 text-amba-500" />
                            {safetyData.summary}
                        </p>

                        {/* Factors Row */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {safetyData.factors.map((factor, idx) => (
                                <span key={idx} className="flex-shrink-0 text-[10px] font-semibold bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100">
                                    {factor}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Minified Toggle Button (Visible when collapsed) */}
            {!isCardExpanded && (
                <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center animate-fade-in-up">
                    <button 
                        onClick={() => setIsCardExpanded(true)}
                        className="flex items-center bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-full pl-1 pr-4 py-1 group active:scale-95 transition-all"
                    >
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${getScoreBg(safetyData.score)} text-white`}>
                            {safetyData.score}
                         </div>
                         <div className="flex flex-col items-start mr-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Score</span>
                            <span className="text-xs font-bold text-slate-800 capitalize max-w-[120px] truncate">{safetyData.location}</span>
                         </div>
                         <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-amba-500" />
                    </button>
                </div>
            )}
        </>
      )}

      {/* 4. Bottom Controls (Lower Z-Index or positioned below card) */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col gap-4 pointer-events-none">
          <div className="overflow-x-auto scrollbar-hide px-5 pb-2 pointer-events-auto">
              <div className="flex gap-3">
                  <CategoryPill icon={Shield} label="Safe Zone" active={activeCategory === 'Safe Zone'} onClick={() => setActiveCategory('Safe Zone')} />
                  <CategoryPill icon={Siren} label="Police" active={activeCategory === 'Police'} onClick={() => setActiveCategory('Police')} />
                  <CategoryPill icon={Hospital} label="Hospital" active={activeCategory === 'Hospital'} onClick={() => setActiveCategory('Hospital')} />
                  <CategoryPill icon={Pill} label="Pharmacy" active={activeCategory === 'Pharmacy'} onClick={() => setActiveCategory('Pharmacy')} />
                  <CategoryPill icon={Users} label="Crowded" active={activeCategory === 'Crowded'} onClick={() => setActiveCategory('Crowded')} />
              </div>
          </div>
      </div>
    </div>
  );
};

const MapMarker = ({ x, y, color, icon, label }: { x: string, y: string, color: string, icon: any, label: string }) => (
    <div className="absolute transform -translate-x-1/2 -translate-y-full" style={{ left: x, top: y }}>
        <div className="flex flex-col items-center">
            <div className={`p-1.5 rounded-full shadow-md ${color} mb-1 transform hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 shadow-sm whitespace-nowrap">
                {label}
            </div>
        </div>
    </div>
);

const CategoryPill = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md transition-all whitespace-nowrap ${
            active 
            ? 'bg-slate-900 text-white transform scale-105' 
            : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
    >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{label}</span>
    </button>
);
