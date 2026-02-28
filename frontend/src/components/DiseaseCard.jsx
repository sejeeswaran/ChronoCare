import React from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import TrendIndicator from './TrendIndicator';

export default function DiseaseCard({ name, riskScore, riskLevel, trendStatus }) {
    // Determine colors based on risk level
    const isCritical = riskLevel?.toLowerCase() === 'critical' || riskLevel?.toLowerCase() === 'high';
    const isModerate = riskLevel?.toLowerCase() === 'moderate';

    const headerColor = isCritical ? 'text-danger' : isModerate ? 'text-warning' : 'text-success';
    const bgSoftColor = isCritical ? 'bg-red-50' : isModerate ? 'bg-amber-50' : 'bg-emerald-50';
    const strokeColor = isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

    // Mock historical data for sparkline to give the dashboard a "live" feel
    const mockData = Array.from({ length: 15 }, (_, i) => ({
        value: Math.max(0, Math.min(100, riskScore + (Math.random() * 10 - 5) - (15 - i) * (trendStatus === 'Deteriorating' ? -1 : 0)))
    }));

    const formatName = (str) => {
        const map = { ckd: 'Chronick Kidney Disease (CKD)' };
        return map[str.toLowerCase()] || str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div className="card flex flex-col hover:shadow-md transition-shadow duration-300">
            <div className="p-5 flex justify-between items-start border-b border-slate-100">
                <div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Module</h3>
                    <h2 className={`text-lg font-bold text-slate-900`}>{formatName(name)}</h2>
                </div>
                <div className={`p-2 rounded-xl ${bgSoftColor} ${headerColor}`}>
                    <Activity size={20} />
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-800 tracking-tight">{Math.round(riskScore)}</span>
                            <span className="text-slate-400 font-semibold">%</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1">Risk Probability</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${bgSoftColor} ${headerColor} border-current/20`}>
                            {riskLevel}
                        </span>
                        <TrendIndicator status={trendStatus} />
                    </div>
                </div>

                {/* Sparkline */}
                <div className="h-16 w-full mt-2 opacity-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockData}>
                            <defs>
                                <linearGradient id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={strokeColor}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#gradient-${name})`}
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
