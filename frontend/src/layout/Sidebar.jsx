import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileUp, ActivitySquare, LineChart, Bell, LogOut, Stethoscope, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout, isDoctor } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { path: '/upload', label: 'Clinical Upload', icon: FileUp, show: true },
        { path: '/wearables', label: 'Wearable Insights', icon: ActivitySquare, show: !isDoctor },
        { path: '/timeline', label: 'Timeline Intelligence', icon: LineChart, show: true },
        { path: '/alerts', label: 'Alerts Center', icon: Bell, show: true },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
            <div className="p-4 py-8 flex flex-col gap-2 flex-1">
                <h2 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Navigation</h2>

                {navItems.filter(i => i.show).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                ? 'bg-blue-50 text-primary'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-100">
                {/* User info card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDoctor
                            ? 'bg-violet-100 text-violet-600'
                            : 'bg-blue-100 text-blue-600'
                            }`}>
                            {isDoctor ? <Stethoscope size={18} /> : <User size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                                {user?.name || 'User'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${isDoctor
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {user?.role || 'User'}
                                </span>
                                {user?.patient_id && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {user.patient_id}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>

                {/* System status */}
                <div className="mt-3 px-2">
                    <p className="text-[10px] text-slate-400 font-medium">ChronoCare Core v1.0.0</p>
                    <div className="mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                        <span className="text-[10px] text-slate-500 font-bold">System Online</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
