import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const TimelineChart = ({ timelineData }) => {
    if (!timelineData || timelineData.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-80 flex items-center justify-center text-slate-500">
                No timeline data available for this patient.
            </div>
        );
    }

    // Format the date for the X-axis directly inside the data
    const formattedData = timelineData.map(d => ({
        ...d,
        shortDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));

    return (
        <div className="space-y-6">
            {/* Glucose Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Glucose Levels (mg/dL)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="shortDate" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" />
                            <Line
                                type="monotone"
                                dataKey="glucose"
                                name="Plasma Glucose"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk Score Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Risk Score Timeline (%)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="shortDate" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" />
                            <Line
                                type="monotone"
                                dataKey="risk_score"
                                name="Risk Score"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default TimelineChart;
