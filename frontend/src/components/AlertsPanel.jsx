import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const AlertsPanel = ({ alerts }) => {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Patient Alerts</h3>
                <p className="text-slate-500 italic text-sm">No active alerts for this patient.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Alerts</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {alerts.map((alert, index) => {
                    let style = "bg-slate-50 border-slate-200 text-slate-800";
                    let Icon = Info;

                    if (alert.severity === 'Critical') {
                        style = "bg-red-50 border-red-200 text-red-900";
                        Icon = AlertCircle;
                    } else if (alert.severity === 'High') {
                        style = "bg-orange-50 border-orange-200 text-orange-900";
                        Icon = AlertTriangle;
                    } else if (alert.severity === 'Warning') {
                        style = "bg-yellow-50 border-yellow-200 text-yellow-900";
                        Icon = AlertTriangle;
                    }

                    const formattedDate = new Date(alert.date).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });

                    return (
                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${style}`}>
                            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <div className="flex justify-between items-center gap-4 mb-1">
                                    <span className="font-semibold text-sm uppercase tracking-wide">{alert.severity}</span>
                                    <span className="text-xs opacity-70 font-medium">{formattedDate}</span>
                                </div>
                                <p className="text-sm">{alert.alert_type}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AlertsPanel;
