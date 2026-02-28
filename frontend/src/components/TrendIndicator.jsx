import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TrendIndicator({ status }) {
    if (!status) return null;

    const isDeteriorating = status.toLowerCase() === 'deteriorating';
    const isStable = status.toLowerCase() === 'stable';

    const iconStyles = isDeteriorating
        ? 'text-danger bg-red-50 border-red-100'
        : isStable
            ? 'text-slate-500 bg-slate-50 border-slate-200'
            : 'text-success bg-emerald-50 border-emerald-100';

    const Icon = isDeteriorating ? TrendingUp : isStable ? Minus : TrendingDown;

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold w-max ${iconStyles}`}>
            <Icon size={14} strokeWidth={2.5} />
            <span>{status}</span>
        </div>
    );
}
