
import type { Alert } from '../types';
import type { PoliceOfficer } from '../types';
import { ShieldAlert, Battery, Clock, MapPin, LogOut } from 'lucide-react';

interface SidebarProps {
    alerts: Alert[];
    selectedAlertId: string | null;
    onSelectAlert: (id: string) => void;
    officer: PoliceOfficer | null;
    onSignOut: () => void;
    newAlertId: string | null;
    error: string | null;
    userId: string | undefined;
}

const Sidebar: React.FC<SidebarProps> = ({ alerts, selectedAlertId, onSelectAlert, officer, onSignOut, newAlertId, error, userId }) => {
    const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;

    return (
        <div className="w-96 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        <h1 className="text-xl font-bold text-white tracking-tight">AMBA RESPONSE</h1>
                    </div>
                    <button
                        onClick={onSignOut}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold ml-8">Command Center</p>
                {officer && (
                    <p className="text-xs text-slate-500 ml-8 mt-1">
                        {officer.rank} {officer.full_name} • #{officer.badge_number}
                    </p>
                )}
                {activeCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <span className="text-sm text-red-400 font-bold">{activeCount} Active SOS Alert{activeCount > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <ShieldAlert className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">No active alerts</p>
                        <p className="text-xs mt-1">Alerts will appear here in real-time</p>
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const isSelected = selectedAlertId === alert.id;
                        const isCritical = alert.status === 'ACTIVE';
                        const isNew = newAlertId === alert.id;
                        const displayName = alert.profiles?.full_name || alert.user_name || 'Unknown';
                        const displayBattery = alert.battery != null && alert.battery >= 0 ? `${Math.round(alert.battery * 100)}%` : 'N/A';

                        return (
                            <div
                                key={alert.id}
                                onClick={() => onSelectAlert(alert.id)}
                                className={`
                                    p-4 border-b border-slate-800 cursor-pointer transition-all duration-200
                                    ${isSelected ? 'bg-slate-800 border-l-4 border-l-red-500' : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'}
                                    ${isNew ? 'new-alert-flash' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                        {displayName}
                                    </h3>
                                    {isCritical ? (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            </span>
                                            SOS
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                            Resolved
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(alert.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Battery className={`w-3.5 h-3.5 ${alert.battery != null && alert.battery < 0.2 ? 'text-red-400' : ''}`} />
                                        <span>{displayBattery}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{alert.address_snapshot || `${alert.latitude?.toFixed(4)}, ${alert.longitude?.toFixed(4)}`}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 text-xs text-center text-slate-500">
                Connected to Supabase Realtime • Live Updates
                {error && <p className="text-red-500 mt-1">Error: {error}</p>}
                <p className="text-[10px] mt-1 opacity-50">UID: {userId}</p>
            </div>
        </div>
    );
};

export default Sidebar;
