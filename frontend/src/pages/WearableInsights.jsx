import React from 'react';
import { Heart, Moon, ActivitySquare, Wind, RefreshCw } from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockData = {
    heartRate: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, val: 60 + Math.random() * 30 })),
    sleep: Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, val: 5 + Math.random() * 4 })),
    activity: Array.from({ length: 7 }, (_, i) => ({ day: `Day ${i + 1}`, val: 3000 + Math.random() * 8000 })),
    spo2: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, val: 95 + Math.random() * 5 }))
};

export default function WearableInsights() {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wearable Telemetry Insights</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Continuous monitoring data used for dynamic risk scoring modifiers.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold shadow-sm">
                    <RefreshCw size={16} /> Sync Device
                </button>
            </div>

            {/* Top 4 Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Resting Heart Rate" value="72" unit="bpm" icon={Heart} color="text-danger" bg="bg-red-50" />
                <MetricCard title="Sleep Duration" value="6.5" unit="hrs/avg" icon={Moon} color="text-primary" bg="bg-blue-50" />
                <MetricCard title="Daily Activity" value="8,240" unit="steps/avg" icon={ActivitySquare} color="text-warning" bg="bg-amber-50" />
                <MetricCard title="Blood Oxygen (SpO2)" value="98" unit="%" icon={Wind} color="text-success" bg="bg-emerald-50" />
            </div>

            {/* Two main charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

                {/* Heart Rate Timeline */}
                <div className="card p-6 h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Heart size={16} className="text-danger" /> 24-Hour Heart Rate Profile
                    </h3>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockData.heartRate}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sleep Pattern */}
                <div className="card p-6 h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Moon size={16} className="text-primary" /> 7-Day Sleep Architecture
                    </h3>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData.sleep}>
                                <defs>
                                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} fill="url(#sleepGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Bar */}
                <div className="card p-6 h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ActivitySquare size={16} className="text-warning" /> 7-Day Activity Load
                    </h3>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockData.activity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="val" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* SpO2 Chart */}
                <div className="card p-6 h-80 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Wind size={16} className="text-success" /> 24-Hour SpO2 Variance
                    </h3>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockData.spo2}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[90, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="step" dataKey="val" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

function MetricCard({ title, value, unit, icon: Icon, color, bg }) {
    return (
        <div className="card p-5 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-800">{value}</span>
                    <span className="text-sm font-semibold text-slate-500">{unit}</span>
                </div>
            </div>
        </div>
    );
}
