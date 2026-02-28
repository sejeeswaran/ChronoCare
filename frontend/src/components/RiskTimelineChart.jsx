import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';

const DISEASE_COLORS = {
    diabetes: '#3b82f6',    // blue
    cardio: '#f59e0b',      // amber
    ckd: '#10b981',         // emerald
    hypertension: '#ef4444',// red
    default: '#8b5cf6'      // purple
};

export default function RiskTimelineChart({ data }) {

    const { formattedData, activeDiseases } = useMemo(() => {
        if (!data || data.length === 0) return { formattedData: [], activeDiseases: [] };

        const diseases = [...new Set(data.map(d => d.disease_name))];
        const mapDate = {};

        data.forEach(item => {
            // Include time so that multiple assessments on the same day are drawn distinctly
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                + ' ' + dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            if (!mapDate[dateStr]) {
                mapDate[dateStr] = {
                    date: dateStr,
                    _timestamp: dateObj.getTime()
                };
            }
            mapDate[dateStr][item.disease_name] = item.risk_score;
        });

        const arr = Object.values(mapDate);
        arr.sort((a, b) => a._timestamp - b._timestamp);

        return { formattedData: arr, activeDiseases: diseases };
    }, [data]);

    if (formattedData.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm font-medium">
                No longitudinal data available to form a timeline.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                    iconType="circle"
                />

                {activeDiseases.map(disease => (
                    <Line
                        key={disease}
                        type="monotone"
                        dataKey={disease}
                        name={disease.charAt(0).toUpperCase() + disease.slice(1)}
                        stroke={DISEASE_COLORS[disease.toLowerCase()] || DISEASE_COLORS.default}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

RiskTimelineChart.propTypes = {
    data: PropTypes.array.isRequired
};
