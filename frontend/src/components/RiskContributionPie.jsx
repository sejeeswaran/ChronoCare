import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RiskContributionPie({ data }) {
    // Format name nicely
    const formattedData = React.useMemo(() => {
        if (!data) return [];
        return data.map(d => ({
            ...d,
            formattedName: d.disease_name.charAt(0).toUpperCase() + d.disease_name.slice(1)
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm font-medium">
                No active diseases to visualize.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={formattedData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="risk_score"
                    nameKey="formattedName"
                    animationDuration={1500}
                >
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`${Math.round(value)}%`, 'Risk Score']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
        </ResponsiveContainer>
    );
}
