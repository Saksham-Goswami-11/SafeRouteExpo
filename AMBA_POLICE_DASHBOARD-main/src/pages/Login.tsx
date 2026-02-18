import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">AMBA COMMAND</h1>
                    <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest">Police Response System</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                    <h2 className="text-lg font-semibold text-white mb-6">Officer Login</h2>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="officer@police.gov.in"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold rounded-lg uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            'Access Dashboard'
                        )}
                    </button>

                    <p className="text-xs text-slate-500 text-center mt-4">
                        Authorized personnel only. All access is logged.
                    </p>
                </form>
            </div>
        </div>
    );
}
