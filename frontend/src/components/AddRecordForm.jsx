import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { addRecord } from '../api';

const AddRecordForm = ({ onRecordAdded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        patient_id: '',
        date: new Date().toISOString().split('T')[0],
        glucose: '',
        bmi: '',
        age: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Basic validation
            if (formData.glucose <= 0 || formData.bmi <= 0 || formData.age <= 0) {
                throw new Error("Values must be positive numbers.");
            }

            const response = await addRecord({
                patient_id: formData.patient_id,
                date: formData.date,
                glucose: parseFloat(formData.glucose),
                bmi: parseFloat(formData.bmi),
                age: parseFloat(formData.age),
            });

            if (onRecordAdded) {
                onRecordAdded(response.patient_id);
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message || "Failed to add record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto mt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Add New Medical Record</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID</label>
                        <input
                            required
                            type="text"
                            name="patient_id"
                            value={formData.patient_id}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. PAT-1002"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                            required
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Glucose (mg/dL)</label>
                        <input
                            required
                            type="number"
                            step="0.1"
                            name="glucose"
                            value={formData.glucose}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="120"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">BMI</label>
                        <input
                            required
                            type="number"
                            step="0.1"
                            name="bmi"
                            value={formData.bmi}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="25.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                        <input
                            required
                            type="number"
                            step="1"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="45"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                        {loading ? 'Processing & Predicting...' : 'Save Record & Analyze Risk'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddRecordForm;
