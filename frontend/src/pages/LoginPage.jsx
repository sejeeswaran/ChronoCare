import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Stethoscope, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login, signup, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');

    // If already authenticated, redirect
    if (isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await signup(name, email, password, role);
            }
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                {/* Logo + Brand */}
                <div className="text-center mb-8">
                    <img src="/favicon.png" alt="ChronoCare Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">ChronoCare</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Predict. Detect. Prevent.</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('signup'); setError(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'signup'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name (signup only) */}
                        {mode === 'signup' && (
                            <div>
                                <label htmlFor="signupName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="signupName"
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="your name"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="authEmail" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="authEmail"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@chronocare.ai"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Password with show/hide */}
                        <div>
                            <label htmlFor="authPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="authPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Role selector (signup only) */}
                        {mode === 'signup' && (
                            <div>
                                <div className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    I am a
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('patient')}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${role === 'patient'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${role === 'patient' ? 'bg-blue-200/50' : 'bg-slate-100'}`}>
                                            <User size={18} className={role === 'patient' ? 'text-blue-700' : 'text-slate-500'} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold">Patient</div>
                                            <div className="text-[10px] opacity-80">Track my health</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('doctor')}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${role === 'doctor'
                                            ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${role === 'doctor' ? 'bg-violet-200/50' : 'bg-slate-100'}`}>
                                            <Stethoscope size={18} className={role === 'doctor' ? 'text-violet-700' : 'text-slate-500'} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold">Doctor</div>
                                            <div className="text-[10px] opacity-80">Manage patients</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 mt-6"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-xs mt-6 font-medium">
                    ChronoCare AI — Hybrid Chronic Risk Intelligence Engine
                </p>
            </div>
        </div>
    );
}
