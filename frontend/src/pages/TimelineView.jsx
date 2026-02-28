import React, { useState, useEffect } from 'react';
import { LineChart as LineChartIcon, Search, Users, Calendar, TrendingUp, Loader2, Database, Cloud, AlertCircle } from 'lucide-react';
import RiskTimelineChart from '../components/RiskTimelineChart';
import { fetchPatientTimeline, fetchPatientList, fetchStorageStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Color map for per-disease stat cards
const DISEASE_COLOR = {
    diabetes: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
    hypertension: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
    ckd: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    cardio: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
};
const DEFAULT_COLOR = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100' };

export default function TimelineView() {
    const { user, isDoctor, isPatient } = useAuth();

    // ── State ──
    const [patientId, setPatientId] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [patientList, setPatientList] = useState([]);
    const [timeline, setTimeline] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [storageStatus, setStorageStatus] = useState(null);

    // ── Fetch patient list (doctors only) & storage status on mount ──
    useEffect(() => {
        if (isDoctor) {
            fetchPatientList()
                .then(data => setPatientList(data.patient_ids || []))
                .catch(() => setPatientList([]));
        }

        fetchStorageStatus()
            .then(data => setStorageStatus(data))
            .catch(() => { });

        // Auto-load for patients
        if (isPatient && user?.patient_id) {
            setPatientId(user.patient_id);
            setSearchInput(user.patient_id);
            loadTimeline(user.patient_id);
        }
    }, [isDoctor, isPatient, user?.patient_id]);

    // ── Fetch timeline when patient is selected ──
    const loadTimeline = async (pid) => {
        if (!pid) return;
        setPatientId(pid);
        setLoading(true);
        setError(null);
        setTimeline(null);

        try {
            const data = await fetchPatientTimeline(pid);
            setTimeline(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Build chart data from history ──
    const chartData = [];
    if (timeline?.history) {
        timeline.history.forEach(entry => {
            const diseases = Object.keys(entry).filter(k => k !== 'date');
            diseases.forEach(disease => {
                chartData.push({
                    date: entry.date,
                    disease_name: disease,
                    risk_score: Math.round((entry[disease] || 0) * 100),
                });
            });
        });
    }

    // ── Get latest record stats ──
    const latestRecord = timeline?.records?.length > 0
        ? timeline.records[timeline.records.length - 1]
        : null;
    const latestResults = latestRecord?.results || {};
    const diseaseNames = Object.keys(latestResults).filter(
        k => typeof latestResults[k] === 'object' && latestResults[k]?.probability !== undefined
    );

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Timeline Intelligence</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Longitudinal multi-disease risk progression — powered by stored analysis history.
                    </p>
                </div>
                {storageStatus && (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        {storageStatus.google_drive_connected ? (
                            <><Cloud size={14} className="text-blue-500" /><span className="text-blue-600">Google Drive Connected</span></>
                        ) : (
                            <><Database size={14} className="text-slate-400" /><span className="text-slate-500">Local Storage</span></>
                        )}
                    </div>
                )}
            </div>

            {/* ── Patient Search Bar (Doctors Only) ── */}
            {isDoctor && (
                <div className="card p-5 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label htmlFor="patientSearchInput" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Patient ID
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1 max-w-sm">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        id="patientSearchInput"
                                        type="text"
                                        value={searchInput}
                                        onChange={e => setSearchInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && loadTimeline(searchInput.trim())}
                                        placeholder="e.g. PAT-0001"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => loadTimeline(searchInput.trim())}
                                    disabled={!searchInput.trim() || loading}
                                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                                    Load History
                                </button>
                            </div>
                        </div>

                        {/* Quick-select existing patients */}
                        {patientList.length > 0 && (
                            <div className="border-l border-slate-200 pl-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Users size={12} className="inline mr-1" /> Stored Patients
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {patientList.map(pid => (
                                        <button
                                            key={pid}
                                            onClick={() => { setSearchInput(pid); loadTimeline(pid); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${patientId === pid
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                                                }`}
                                        >
                                            {pid}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 font-semibold text-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <span className="ml-3 text-slate-500 font-medium">Fetching timeline from storage...</span>
                </div>
            )}

            {/* ── Results ── */}
            {timeline && !loading && (
                <>
                    {timeline.count === 0 ? (
                        <div className="card p-10 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar size={28} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No History Found</h3>
                            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                                Patient <strong>{patientId}</strong> has no stored analysis records.
                                Run a prediction from the Clinical Upload page first.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── Summary Cards ── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="card p-4 bg-slate-800 text-white rounded-xl shadow-sm">
                                    <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">Records</div>
                                    <div className="text-3xl font-black mt-1">{timeline.count}</div>
                                </div>
                                <div className="card p-4 bg-slate-800 text-white rounded-xl shadow-sm">
                                    <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">Patient</div>
                                    <div className="text-lg font-bold mt-2">{patientId}</div>
                                </div>
                                <div className="card p-4 bg-slate-800 text-white rounded-xl shadow-sm">
                                    <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">First Record</div>
                                    <div className="text-sm font-bold mt-2 text-slate-200">
                                        {timeline.history?.[0]?.date || '—'}
                                    </div>
                                </div>
                                <div className="card p-4 bg-slate-800 text-white rounded-xl shadow-sm">
                                    <div className="text-xs text-slate-300 uppercase font-bold tracking-wider">Latest Record</div>
                                    <div className="text-sm font-bold mt-2 text-slate-200">
                                        {timeline.history?.[timeline.history.length - 1]?.date || '—'}
                                    </div>
                                </div>
                            </div>

                            {/* ── Disease Stat Cards (latest) ── */}
                            {diseaseNames.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {diseaseNames.map(disease => {
                                        const d = latestResults[disease];
                                        const colors = DISEASE_COLOR[disease.toLowerCase()] || DEFAULT_COLOR;
                                        const prob = (d.probability * 100).toFixed(1);
                                        const riskLevel = d.risk_level || 'Unknown';

                                        return (
                                            <div key={disease} className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
                                                <div className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                                    {disease.replaceAll('_', ' ')}
                                                </div>
                                                <div className={`text-2xl font-black mt-1 ${colors.text}`}>{prob}%</div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.badge} ${colors.text}`}>
                                                        {riskLevel}
                                                    </span>
                                                    {d.trend && (
                                                        <span className="text-[10px] text-slate-500 font-medium">
                                                            {d.trend}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Main Chart ── */}
                            <div className="card p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <LineChartIcon size={18} className="text-blue-600" />
                                        Risk Probability Trajectory
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {timeline.count} data point{timeline.count === 1 ? '' : 's'}
                                    </span>
                                </div>

                                <div className="w-full h-96 -ml-4 mt-2">
                                    {chartData.length > 0 ? (
                                        <RiskTimelineChart data={chartData} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                                            Not enough data points to render chart.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Records Table ── */}
                            <div className="card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100">
                                    <h3 className="text-base font-bold text-slate-800">Analysis History</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">All stored records for {patientId}</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                                <th className="px-5 py-3 text-left">#</th>
                                                <th className="px-5 py-3 text-left">Timestamp</th>
                                                {diseaseNames.map(d => (
                                                    <th key={d} className="px-5 py-3 text-center">{d.replaceAll('_', ' ')}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timeline.records.map((record, idx) => {
                                                const ts = record.timestamp || '';
                                                const dateDisplay = ts.length >= 19
                                                    ? new Date(ts).toLocaleString()
                                                    : ts;
                                                return (
                                                    <tr key={`record-${idx}-${ts}`} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                        <td className="px-5 py-3 text-slate-700 font-medium">{dateDisplay}</td>
                                                        {diseaseNames.map(d => {
                                                            const prob = record.results?.[d]?.probability;
                                                            const pct = prob === undefined ? '—' : (prob * 100).toFixed(1) + '%';
                                                            const risk = record.results?.[d]?.risk_level || '';
                                                            let color = 'text-emerald-600';
                                                            if (risk === 'High Risk') color = 'text-red-600';
                                                            else if (risk === 'Moderate Risk') color = 'text-amber-600';

                                                            return (
                                                                <td key={d} className={`px-5 py-3 text-center font-bold ${color}`}>
                                                                    {pct}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── Empty State (no search yet) ── */}
            {!timeline && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                        <TrendingUp size={36} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Select a Patient</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-md">
                        Enter a Patient ID above or click a stored patient to view their historical risk trajectory.
                    </p>
                </div>
            )}

        </div>
    );
}
