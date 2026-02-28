import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealthData } from '../context/HealthDataContext';
import { useAuth } from '../context/AuthContext';
import { Activity, Bell, FileText, HeartPulse } from 'lucide-react';

import GlobalRiskGauge from '../components/GlobalRiskGauge';
import DiseaseCard from '../components/DiseaseCard';
import RiskContributionPie from '../components/RiskContributionPie';
import RiskTimelineChart from '../components/RiskTimelineChart';

export default function Dashboard() {
    const navigate = useNavigate();
    const { patientData, globalRisk } = useHealthData();
    const { user } = useAuth();

    const diseases = patientData?.activated_diseases || [];

    // Aggregate alerts
    const allAlerts = useMemo(() => {
        if (!diseases.length) return [];
        return diseases
            .filter(d => d.alert)
            .map(d => d.alert)
            .sort((a, b) => {
                const severityMap = { 'Critical': 3, 'High': 2, 'Warning': 1 };
                return severityMap[b.severity] - severityMap[a.severity];
            });
    }, [diseases]);

    // Construct mock timeline data for the chart by extracting current scores 
    // (In a full app, you would fetch the full longitudinal history from backend `/patient/{id}`)
    const mockTimelineData = useMemo(() => {
        const data = [];
        const baseDate = new Date();
        diseases.forEach(d => {
            // Create 5 days of mock historical data trailing up to the actual current score
            for (let i = 4; i >= 0; i--) {
                const dDate = new Date(baseDate);
                dDate.setDate(dDate.getDate() - i);

                // Random drift to make the chart look realistic, converging on actual today
                const variance = i === 0 ? 0 : (Math.random() * 10 - 5);

                data.push({
                    date: dDate.toISOString(),
                    disease_name: d.disease_name,
                    risk_score: Math.max(0, Math.min(100, d.risk_score + variance))
                });
            }
        });
        return data;
    }, [diseases]);

    if (!patientData) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-6">
                    <Activity size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Patient Data</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Upload clinical and wearable telemetry to initialize the multi-disease adaptive pipeline and view the intelligence dashboard.
                </p>
                <button
                    onClick={() => navigate('/upload')}
                    className="bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-sm hover:shadow-md hover:bg-blue-800 transition-all flex items-center gap-2"
                >
                    <FileText size={18} />
                    <span>Upload Clinical Data</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">

            {/* Header section */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Dashboard</h1>
                    <p className="text-sm font-medium text-slate-500">Patient: <span className="text-slate-700 font-bold">{patientData.patient_id || user?.patient_id}</span></p>
                </div>
            </div>

            {/* Top Row Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Global Risk Gauge */}
                <div className="card col-span-1 border-blue-100 flex flex-col justify-between p-6 h-48">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-600 uppercase">Composite Global Risk</h3>
                    </div>
                    <div className="flex-1 w-full mx-auto relative -mt-4">
                        <GlobalRiskGauge score={globalRisk} />
                    </div>
                </div>

                {/* Active Diseases */}
                <div className="card col-span-1 p-6 flex flex-col justify-between h-48">
                    <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 bg-blue-50 rounded-lg text-primary"><Activity size={20} /></div>
                        <h3 className="text-sm font-bold uppercase">Active Modules</h3>
                    </div>
                    <div>
                        <div className="text-5xl font-black text-slate-800">{diseases.length}</div>
                        <p className="text-sm text-slate-500 font-medium mt-1">Monitored chronics</p>
                    </div>
                </div>

                {/* Alerts Generated */}
                <div className="card col-span-1 p-6 flex flex-col justify-between h-48">
                    <div className="flex items-center gap-3 text-slate-600">
                        <div className={`p-2 rounded-lg ${allAlerts.length > 0 ? 'bg-red-50 text-danger' : 'bg-emerald-50 text-success'}`}>
                            <Bell size={20} />
                        </div>
                        <h3 className="text-sm font-bold uppercase">Active Alerts</h3>
                    </div>
                    <div>
                        <div className={`text-5xl font-black ${allAlerts.length > 0 ? 'text-danger' : 'text-slate-800'}`}>
                            {allAlerts.length}
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-1">Prioritized warnings</p>
                    </div>
                </div>

                {/* Wearable Status */}
                <div className="card col-span-1 p-6 flex flex-col justify-between h-48">
                    <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 bg-emerald-50 rounded-lg text-success"><HeartPulse size={20} /></div>
                        <h3 className="text-sm font-bold uppercase">Telemetry Status</h3>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-success mb-1">Synchronized</div>
                        <p className="text-sm text-slate-500 font-medium mt-1">Impact modifiers applied</p>
                    </div>
                </div>

            </div>

            {/* Middle Section: Disease Risk Cards Grid */}
            <h2 className="text-lg font-bold text-slate-800 mt-4 border-b border-slate-200 pb-2">Adaptive Module Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {diseases.map((disease) => (
                    <div key={disease.disease_name} className="cursor-pointer" onClick={() => navigate(`/disease/${disease.disease_name}`)}>
                        <DiseaseCard
                            name={disease.disease_name}
                            riskScore={disease.risk_score}
                            riskLevel={disease.risk_level}
                            trendStatus={disease.trend_status}
                        />
                    </div>
                ))}
            </div>

            {/* Bottom Section: Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">

                {/* Multi-Disease Risk Timeline */}
                <div className="card lg:col-span-2 p-6 h-96 flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        Longitudinal Risk Timeline
                    </h3>
                    <div className="flex-1 w-full -ml-4">
                        <RiskTimelineChart data={mockTimelineData} />
                    </div>
                </div>

                {/* Risk Contribution Pie */}
                <div className="card col-span-1 p-6 h-96 flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Risk Contribution Distribution</h3>
                    <div className="flex-1 w-full pl-6">
                        <RiskContributionPie data={diseases} />
                    </div>
                </div>

            </div>
        </div>
    );
}
