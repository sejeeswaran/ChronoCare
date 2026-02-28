import React from 'react';
import { Users, PlusCircle } from 'lucide-react';

const Sidebar = ({ patients, selectedPatient, onSelectPatient }) => {
    return (
        <div className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-61px)] flex flex-col fixed left-0 top-[61px] bottom-0">
            <div className="p-4 border-b border-slate-100">
                <h2 className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-3">
                    Patient Directory
                </h2>
                <div className="space-y-1">
                    {patients.map((patient) => (
                        <button
                            key={patient}
                            onClick={() => onSelectPatient(patient)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedPatient === patient
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            {patient}
                        </button>
                    ))}

                    {patients.length === 0 && (
                        <p className="text-sm text-slate-400 italic px-3">No patients found</p>
                    )}
                </div>
            </div>

            <div className="p-4 mt-auto border-t border-slate-100">
                <button
                    onClick={() => onSelectPatient('NEW')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusCircle className="h-4 w-4" />
                    New Record
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
