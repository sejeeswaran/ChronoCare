import React from 'react';
import { Activity, Bell, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">

      {/* Brand Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-primary">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">ChronoCare AI</h1>
          <p className="text-xs text-slate-500 font-medium">Predict. Detect. Prevent.</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Placeholder for Mini Global Risk Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
          <span className="text-sm font-semibold text-slate-700">Global Risk: 12%</span>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
          </button>

          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Moon size={20} />
          </button>

          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm ml-2 uppercase">
            {user?.name ? user.name.charAt(0) : (user?.role ? user.role.charAt(0) : 'U')}
          </div>
        </div>
      </div>

    </nav>
  );
}
