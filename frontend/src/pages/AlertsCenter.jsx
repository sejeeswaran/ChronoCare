import React, { useMemo, useState } from 'react';
import { Bell, AlertTriangle, ShieldAlert, BadgeInfo, Filter } from 'lucide-react';
import { useHealthData } from '../context/HealthDataContext';

export default function AlertsCenter() {
    const { patientData } = useHealthData();
    const [filter, setFilter] = useState('All');

    const allAlerts = useMemo(() => {
        if (!patientData || !patientData.activated_diseases) return [];

        // Extract actual active alerts 
        const active = patientData.activated_diseases
            .filter(d => d.alert)
            .map(d => ({
                id: Math.random().toString(36).substr(2, 9),
                disease: d.disease_name,
                severity: d.alert.severity,
                message: d.alert.message,
                timestamp: new Date().toISOString(),
                status: 'Active'
            }));

        // Generate some mock historical alerts
        const historical = ['diabetes', 'cardio', 'ckd', 'hypertension'].map((d, i) => ({
            id: `hist-${i}`,
            disease: d,
            severity: i % 2 === 0 ? 'Warning' : 'Critical',
            message: `Historical alert pattern detected for ${d}.`,
            timestamp: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
            status: 'Resolved'
        }));

        return [...active, ...historical].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [patientData]);

    const filteredAlerts = useMemo(() => {
        if (filter === 'All') return allAlerts;
        if (filter === 'Active') return allAlerts.filter(a => a.status === 'Active');
        return allAlerts.filter(a => a.severity === filter);
    }, [allAlerts, filter]);

    const severityConfig = {
        'Critical': { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        'Warning': { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        'Info': { icon: BadgeInfo, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    };

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alerts Center</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Unified notification and threshold violation log.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg">
                    <Filter size={16} className="text-slate-400 ml-2 mr-1" />
                    {['All', 'Active', 'Critical', 'Warning'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${filter === f ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card overflow-hidden">
                {filteredAlerts.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                        <Bell size={48} className="mb-4 text-slate-300" />
                        <p className="font-semibold text-lg">No alerts found</p>
                        <p className="text-sm mt-1 text-slate-400">Your current filters returned 0 results.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 pl-6">Severity</th>
                                <th className="p-4">Module</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">Time Detected</th>
                                <th className="p-4 pr-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAlerts.map((alert) => {
                                const config = severityConfig[alert.severity] || severityConfig['Info'];
                                const Icon = config.icon;

                                return (
                                    <tr key={alert.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${config.bg} ${config.color} ${config.border} text-xs font-bold`}>
                                                <Icon size={14} />
                                                {alert.severity}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-700 capitalize">
                                            {alert.disease}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 font-medium max-w-md truncate">
                                            {alert.message}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(alert.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${alert.status === 'Active' ? 'bg-danger/10 text-danger' : 'bg-slate-100 text-slate-500'}`}>
                                                {alert.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}
