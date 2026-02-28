import React from 'react';
import { Activity } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <Activity className="text-blue-600 h-6 w-6" />
                <h1 className="text-xl font-bold text-slate-800">ChronoCare AI</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    Dr
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
