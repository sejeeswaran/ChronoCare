import React from 'react';
import { HeartPulse, TrendingUp } from 'lucide-react';

const RiskScoreCard = ({ latestRecord }) => {
    if (!latestRecord) return null;

    const { risk_score, risk_level, trend_status } = latestRecord;

    // Determine medical colors based on risk severity
    let badgeColor = "bg-green-100 text-green-700 border-green-200";
    let scoreColor = "text-green-600";

    if (risk_level === 'Moderate') {
        badgeColor = "bg-yellow-100 text-yellow-700 border-yellow-200";
        scoreColor = "text-yellow-600";
    } else if (risk_level === 'High') {
        badgeColor = "bg-red-100 text-red-700 border-red-200";
        scoreColor = "text-red-600";
    }

    // Trend indicators
    let trendColor = "bg-slate-100 text-slate-700";
    if (trend_status === 'Increasing Risk' || trend_status === 'Deteriorating' || trend_status === 'Sudden Spike') {
        trendColor = "bg-orange-100 text-orange-700 border border-orange-200";
    } else if (trend_status === 'Stable') {
        trendColor = "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

            <div className="flex items-center gap-2 mb-2 text-slate-500 font-medium">
                <HeartPulse className="h-5 w-5" />
                <h2>Diabetes Risk Assessment</h2>
            </div>

            <div className={`text-6xl font-black tracking-tight my-4 ${scoreColor}`}>
                {risk_score}<span className="text-3xl font-bold opacity-50">%</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${badgeColor}`}>
                    {risk_level} Risk
                </span>

                {trend_status && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${trendColor}`}>
                        <TrendingUp className="h-3 w-3" />
                        {trend_status}
                    </span>
                )}
            </div>
        </div>
    );
};

export default RiskScoreCard;
