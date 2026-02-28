import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function GlobalRiskGauge({ score }) {
    const isCritical = score >= 70;
    const isModerate = score >= 40 && score < 70;

    const color = isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

    const data = [{ name: 'Risk', value: score, fill: color }];

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="70%"
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={20}
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                    />
                    <RadialBar
                        minAngle={15}
                        clockWise={true}
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: '#f1f5f9' }}
                    />
                </RadialBarChart>
            </ResponsiveContainer>

            {/* Centered Text inside the semi-circle */}
            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-[60%] flex flex-col items-center">
                <span className="text-5xl font-black text-slate-800 tracking-tighter" style={{ color }}>
                    {Math.round(score)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Composite Score</span>
            </div>
        </div>
    );
}
