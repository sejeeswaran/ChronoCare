import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHealthData } from '../context/HealthDataContext';
import { ArrowLeft, Stethoscope, FileText, Bell, Activity } from 'lucide-react';
import TrendIndicator from '../components/TrendIndicator';

import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function DiseaseDetail() {
    const { name } = useParams();
    const navigate = useNavigate();
    const { patientData } = useHealthData();

    const disease = useMemo(() => {
        return patientData?.activated_diseases?.find(
            (d) => d.disease_name.toLowerCase() === name.toLowerCase()
        );
    }, [patientData, name]);

    if (!disease) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                <Activity size={48} className="text-slate-300" />
                <h2 className="text-xl font-bold">Module Inactive or Data Missing</h2>
                <button onClick={() => navigate('/')} className="text-primary hover:underline font-bold mt-4">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const { risk_score, risk_level, trend_status, alert } = disease;

    const isCritical = risk_level?.toLowerCase() === 'critical' || risk_level?.toLowerCase() === 'high';
    const isModerate = risk_level?.toLowerCase() === 'moderate';
    const headerColor = isCritical ? 'text-danger' : isModerate ? 'text-warning' : 'text-success';
    const bgSoftColor = isCritical ? 'bg-red-50' : isModerate ? 'bg-amber-50' : 'bg-emerald-50';

    // Mock historical data for the isolated detail charts
    const mockRiskTimeline = Array.from({ length: 30 }, (_, i) => ({
        day: `Day ${i + 1}`,
        risk: Math.max(0, Math.min(100, risk_score + (Math.random() * 20 - 10)))
    }));

    const mockBiomarkers = Array.from({ length: 10 }, (_, i) => ({
        date: `Test ${i + 1}`,
        value1: 100 + Math.random() * 40,
        value2: 80 + Math.random() * 20
    }));

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="text-slate-500" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${bgSoftColor} ${headerColor}`}>
                            <Stethoscope size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 capitalize">{name} Intelligence</h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mt-2">Deep dive risk analysis and historical biomarkers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">

                {/* Current State Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="card p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Assessment</h3>

                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-6xl font-black text-slate-800 tracking-tighter">{Math.round(risk_score)}</span>
                            <span className="text-slate-400 font-bold text-xl">%</span>
                        </div>

                        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 font-semibold">Risk Level</span>
                                <span className={`text-xs font-bold px-2.5 py-1 uppercase rounded-md border ${bgSoftColor} ${headerColor} border-current/20`}>
                                    {risk_level}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 font-semibold">Trend</span>
                                <TrendIndicator status={trend_status} />
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border-emerald-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Wearable Impact</h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            Based on the 7-day trailing average from synchronized telemetry devices, the base clinical risk score was elevated by <span className="font-bold text-danger">+3%</span> due to abnormal resting heart rates and poor sleep continuity.
                        </p>
                    </div>
                </div>

                {/* Charts Column */}
                <div className="lg:col-span-3 flex flex-col gap-6">

                    {/* Active Alert Banner */}
                    {alert && (
                        <div className={`card p-4 flex items-start gap-4 ${alert.severity === 'Critical' ? 'bg-red-50 border border-red-200' : alert.severity === 'Warning' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className={`p-2 rounded-full mt-1 ${alert.severity === 'Critical' ? 'bg-danger text-white' : alert.severity === 'Warning' ? 'bg-warning text-white' : 'bg-primary text-white'}`}>
                                <Bell size={18} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${alert.severity === 'Critical' ? 'text-red-900' : alert.severity === 'Warning' ? 'text-amber-900' : 'text-blue-900'}`}>
                                    System {alert.severity} Alert
                                </h3>
                                <p className={`text-sm mt-1 leading-snug ${alert.severity === 'Critical' ? 'text-red-800' : alert.severity === 'Warning' ? 'text-amber-800' : 'text-blue-800'}`}>
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="card p-6 h-80 flex flex-col">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-primary" />
                            Isolated 30-Day Risk Trajectory
                        </h3>
                        <div className="flex-1 w-full -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockRiskTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={headerColor === 'text-danger' ? '#ef4444' : '#3b82f6'} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={headerColor === 'text-danger' ? '#ef4444' : '#3b82f6'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} minTickGap={30} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="risk" stroke={headerColor === 'text-danger' ? '#ef4444' : '#3b82f6'} strokeWidth={3} fill="url(#detailGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card p-6 h-64 flex flex-col">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-success" />
                            Underlying Biomarker Drivers
                        </h3>
                        <div className="flex-1 w-full -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mockBiomarkers} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="value1" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Primary Lab Metric" />
                                    <Line type="monotone" dataKey="value2" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Secondary Lab Metric" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
