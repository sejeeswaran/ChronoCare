import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud, Activity, Heart, Droplet, Brain,
    AlertCircle, Zap, Layers, Target, Loader2,
    ShieldCheck, FileText, FileSpreadsheet, X, Check, Eye,
    Download, HardDrive, Cloud
} from 'lucide-react';
import { analyzeHealthData, fetchDiseaseConfig, extractReport, exportPDF } from '../services/api';
import { useHealthData } from '../context/HealthDataContext';
import { useAuth } from '../context/AuthContext';

// Icon map for disease theming
const DISEASE_ICONS = {
    diabetes: { icon: Droplet, bg: 'bg-orange-100', text: 'text-orange-600' },
    hypertension: { icon: Brain, bg: 'bg-purple-100', text: 'text-purple-600' },
    ckd: { icon: Droplet, bg: 'bg-emerald-100', text: 'text-emerald-600' },
    cardio: { icon: Heart, bg: 'bg-red-100', text: 'text-red-600' },
};
const DEFAULT_ICON = { icon: Activity, bg: 'bg-blue-100', text: 'text-blue-600' };

export default function ClinicalUpload() {
    const navigate = useNavigate();
    const { setPatientData, setLoading, setError } = useHealthData();
    const { user, isPatient } = useAuth();
    const resultsRef = useRef(null);
    const fileInputRef = useRef(null);

    // ── Config from backend ──
    const [diseaseConfig, setDiseaseConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [configError, setConfigError] = useState(null);

    // ── Mode: 'specific' | 'auto' | 'upload' ──
    const [mode, setMode] = useState(null);
    const [selectedDisease, setSelectedDisease] = useState(null);

    // ── Form data ──
    const [patientId, setPatientId] = useState(user?.patient_id || 'PAT-0001');
    const [formValues, setFormValues] = useState({});

    // ── File upload state ──
    const [uploadedFile, setUploadedFile] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [extractError, setExtractError] = useState(null);
    const [previewConfirmed, setPreviewConfirmed] = useState(false);

    // ── Submission ──
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [rawResults, setRawResults] = useState(null);  // raw API data for PDF export
    const [storageInfo, setStorageInfo] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // ── Fetch config on mount ──
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await fetchDiseaseConfig();
                setDiseaseConfig(config);
            } catch (err) {
                setConfigError(err.message);
            } finally {
                setConfigLoading(false);
            }
        };
        loadConfig();
    }, []);

    // ── Build form defaults when mode/selection changes ──
    useEffect(() => {
        if (!diseaseConfig) return;
        // Skip if in upload mode and preview not yet confirmed
        if (mode === 'upload' && !previewConfirmed) return;

        let fieldsToRender = [];

        if (mode === 'specific' && selectedDisease) {
            fieldsToRender = diseaseConfig[selectedDisease]?.fields || [];
        } else if (mode === 'auto' || (mode === 'upload' && previewConfirmed)) {
            const seen = new Set();
            Object.values(diseaseConfig).forEach(disease => {
                disease.fields.forEach(f => {
                    if (!seen.has(f.name)) {
                        seen.add(f.name);
                        fieldsToRender.push(f);
                    }
                });
            });
        }

        // Build the extracted data lookup (from uploaded report)
        const uploaded = (mode === 'upload' && extractedData?.extracted_data) || {};

        const defaults = {};
        fieldsToRender.forEach(field => {
            // Priority: extractedData > existing formValues > select default > empty
            if (field.name in uploaded) {
                defaults[field.name] = String(uploaded[field.name]);
            } else if (field.name in formValues) {
                defaults[field.name] = formValues[field.name];
            } else if (field.type === 'select' && field.options?.length > 0) {
                defaults[field.name] = String(field.options[0].value);
            } else {
                defaults[field.name] = '';
            }
        });
        setFormValues(defaults);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diseaseConfig, mode, selectedDisease, previewConfirmed, extractedData]);

    // ── Handlers ──
    const handleFieldChange = (e) => {
        setFormValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const parseFormValues = (obj) => {
        const parsed = {};
        Object.entries(obj).forEach(([key, val]) => {
            if (typeof val === 'string' && val.trim() === '') return;
            if (!isNaN(val) && !isNaN(parseFloat(val))) {
                parsed[key] = parseFloat(val);
            } else {
                parsed[key] = val;
            }
        });
        return parsed;
    };

    // ── File Upload Handler ──
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setExtractedData(null);
        setExtractError(null);
        setPreviewConfirmed(false);
        setResults(null);
        setExtracting(true);

        try {
            const result = await extractReport(file);
            setExtractedData(result);
        } catch (err) {
            setExtractError(err.message);
        } finally {
            setExtracting(false);
        }
    };

    const handleConfirmPreview = () => {
        if (!extractedData) return;

        // Merge extracted data into form values
        const merged = { ...formValues };
        Object.entries(extractedData.extracted_data).forEach(([k, v]) => {
            merged[k] = String(v);
        });
        setFormValues(merged);
        setPreviewConfirmed(true);
    };

    const handleClearUpload = () => {
        setUploadedFile(null);
        setExtractedData(null);
        setExtractError(null);
        setPreviewConfirmed(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Submit ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setLoading(true);
        setError(null);
        setResults(null);

        const parsedData = parseFormValues(formValues);
        const diseasesToSend = mode === 'specific' && selectedDisease ? [selectedDisease] : null;

        try {
            const rawData = await analyzeHealthData(patientId, parsedData, {}, diseasesToSend);

            // Capture storage info and filter it out of disease results
            const { __storage, ...diseaseResults } = rawData;
            setStorageInfo(__storage || null);

            // Store raw results for PDF export
            setRawResults(diseaseResults);

            const transformedDiseases = Object.entries(diseaseResults).map(([key, item]) => {
                if (!item || typeof item !== 'object') return null;
                let severity = 'Info';
                if (item.alert === 'CRITICAL ALERT') severity = 'Critical';
                else if (item.alert === 'WARNING') severity = 'Warning';
                else if (item.risk_level === 'High Risk') severity = 'Critical';
                else if (item.risk_level === 'Moderate Risk') severity = 'Warning';

                return {
                    disease_name: key,
                    probability: item.probability,
                    risk_score: Math.round((item.probability || 0) * 100) || (item.rule_score || 0),
                    risk_level: item.risk_level || 'Unknown',
                    trend_status: item.trend || 'Unknown',
                    alert: item.alert ? { message: item.alert, severity } : null,
                    error: item.error || null,
                };
            }).filter(Boolean);

            setPatientData({ patient_id: patientId, activated_diseases: transformedDiseases });
            setResults(transformedDiseases);
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (err) {
            setError(err.message);
            alert(`Analysis Failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    // ── Build field groups ──
    const getFieldGroups = () => {
        if (!diseaseConfig) return [];
        if (mode === 'specific' && selectedDisease) {
            const cfg = diseaseConfig[selectedDisease];
            return cfg ? [{ key: selectedDisease, label: cfg.label, fields: cfg.fields }] : [];
        }
        if (mode === 'auto' || (mode === 'upload' && previewConfirmed)) {
            const seen = new Set();
            const allFields = [];
            Object.values(diseaseConfig).forEach(disease => {
                disease.fields.forEach(f => { if (!seen.has(f.name)) { seen.add(f.name); allFields.push(f); } });
            });
            return [{ key: '__unified__', label: mode === 'upload' ? 'Extracted & Editable Fields' : 'Unified Clinical Intake', fields: allFields }];
        }
        return [];
    };

    const fieldGroups = getFieldGroups();

    // ── Render field ──
    const renderField = (field) => {
        const isAutoFilled = mode === 'upload' && previewConfirmed && extractedData?.extracted_data?.[field.name] !== undefined;

        if (field.type === 'select' && field.options) {
            return (
                <div key={field.name} className="relative">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field.name.replace(/_/g, ' ')}</label>
                    <select
                        name={field.name}
                        value={formValues[field.name] ?? ''}
                        onChange={handleFieldChange}
                        className={`w-full px-3 py-2.5 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm ${isAutoFilled ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}
                    >
                        {field.options.map(opt => (
                            <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                        ))}
                    </select>
                    {isAutoFilled && <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" title="Auto-filled from report" />}
                </div>
            );
        }

        return (
            <div key={field.name} className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field.name.replace(/_/g, ' ')}</label>
                <input
                    type="number"
                    step="any"
                    name={field.name}
                    value={formValues[field.name] ?? ''}
                    onChange={handleFieldChange}
                    className={`w-full px-3 py-2.5 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm ${isAutoFilled ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300'}`}
                    placeholder={`Enter ${field.name.replace(/_/g, ' ')}...`}
                />
                {isAutoFilled && <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" title="Auto-filled from report" />}
            </div>
        );
    };

    // ── Loading / Error states ──
    if (configLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <p className="text-slate-600 font-semibold">Loading disease configuration from backend...</p>
            </div>
        );
    }

    if (configError) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-red-600 font-semibold mb-2">Failed to load disease config</p>
                <p className="text-slate-500 text-sm">{configError}</p>
                <p className="text-slate-400 text-xs mt-4">Make sure the backend is running on http://127.0.0.1:5000</p>
            </div>
        );
    }

    const diseaseKeys = Object.keys(diseaseConfig);

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 p-4">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Clinical Data Intake</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Intelligent, adaptive intake — powered by the backend disease registry.
                </p>
            </div>

            {/* ═══ MODE SELECTOR ═══ */}
            <div className="card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Select Analysis Mode</h2>
                <p className="text-sm text-slate-500 mb-5">Choose how you want to provide patient data.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Upload Report */}
                    <button
                        type="button"
                        onClick={() => { setMode('upload'); setSelectedDisease(null); setResults(null); setPreviewConfirmed(false); handleClearUpload(); }}
                        className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left
                            ${mode === 'upload'
                                ? 'border-violet-500 bg-violet-50 shadow-md ring-2 ring-violet-200'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                        <div className={`p-3 rounded-lg ${mode === 'upload' ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <UploadCloud size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-base">Upload Report</div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Upload a PDF, Excel, or CSV report. Data is extracted, auto-filled, and previewed before analysis.
                            </p>
                        </div>
                    </button>

                    {/* Specific Disease */}
                    <button
                        type="button"
                        onClick={() => { setMode('specific'); setSelectedDisease(null); setResults(null); handleClearUpload(); }}
                        className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left
                            ${mode === 'specific'
                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                        <div className={`p-3 rounded-lg ${mode === 'specific' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Target size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-base">Specific Disease</div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Target a single disease model. Only the required features for that ML model will be shown.
                            </p>
                        </div>
                    </button>

                    {/* Auto Detect */}
                    <button
                        type="button"
                        onClick={() => { setMode('auto'); setSelectedDisease(null); setResults(null); handleClearUpload(); }}
                        className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left
                            ${mode === 'auto'
                                ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                        <div className={`p-3 rounded-lg ${mode === 'auto' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-base">Auto Detect (All)</div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Unified full medical intake. Backend auto-detects eligible disease models.
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* ═══ UPLOAD REPORT SECTION ═══ */}
            {mode === 'upload' && !previewConfirmed && (
                <div className="card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                        <UploadCloud size={20} className="text-violet-600" />
                        Upload Patient Report
                    </h2>
                    <p className="text-xs text-slate-500 mb-5">
                        Upload a PDF, Excel, or CSV file. The system will extract medical data and auto-fill the input fields.
                    </p>

                    {/* Drop Zone */}
                    <label
                        htmlFor="report-file"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all"
                    >
                        <input
                            ref={fileInputRef}
                            id="report-file"
                            type="file"
                            accept=".pdf,.xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        {extracting ? (
                            <div className="flex flex-col items-center">
                                <Loader2 size={36} className="animate-spin text-violet-500 mb-2" />
                                <p className="text-sm font-semibold text-violet-600">Extracting data from report...</p>
                            </div>
                        ) : uploadedFile ? (
                            <div className="flex flex-col items-center">
                                {uploadedFile.name.endsWith('.pdf')
                                    ? <FileText size={36} className="text-red-500 mb-2" />
                                    : <FileSpreadsheet size={36} className="text-emerald-500 mb-2" />}
                                <p className="text-sm font-semibold text-slate-700">{uploadedFile.name}</p>
                                <p className="text-xs text-slate-400 mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <UploadCloud size={36} className="text-slate-400 mb-2" />
                                <p className="text-sm font-semibold text-slate-600">Click to upload PDF, Excel, or CSV</p>
                                <p className="text-xs text-slate-400 mt-1">Supported: .pdf, .xlsx, .xls, .csv</p>
                            </div>
                        )}
                    </label>

                    {/* Extract Error */}
                    {extractError && (
                        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            <span>{extractError}</span>
                        </div>
                    )}

                    {/* ═══ PREVIEW PANEL ═══ */}
                    {extractedData && (
                        <div className="mt-6 border border-violet-200 rounded-xl overflow-hidden">
                            {/* Preview Header */}
                            <div className="bg-violet-50 px-5 py-3 border-b border-violet-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye size={18} className="text-violet-600" />
                                    <h3 className="font-bold text-violet-800 text-sm">Data Preview</h3>
                                    <span className="ml-2 text-xs bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full font-bold">
                                        {extractedData.fields_found} fields extracted
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500">from: {extractedData.source_file}</span>
                            </div>

                            {/* Preview Table */}
                            <div className="p-4 max-h-72 overflow-y-auto">
                                {extractedData.fields_found === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-sm">
                                        <AlertCircle size={24} className="mx-auto mb-2 text-orange-400" />
                                        <p className="font-semibold text-slate-600">No recognized medical fields found.</p>
                                        <p className="text-xs mt-1">Try a different report format or enter data manually.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b border-slate-200">
                                                <th className="pb-2 text-xs font-bold text-slate-400 uppercase">Field</th>
                                                <th className="pb-2 text-xs font-bold text-slate-400 uppercase">Extracted Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(extractedData.extracted_data).map(([key, val]) => (
                                                <tr key={key} className="border-b border-slate-100 last:border-0">
                                                    <td className="py-2 font-semibold text-slate-700">{key.replace(/_/g, ' ')}</td>
                                                    <td className="py-2">
                                                        <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md font-bold text-xs border border-emerald-200">
                                                            {String(val)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Preview Actions */}
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={handleClearUpload}
                                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors"
                                >
                                    <X size={16} />
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmPreview}
                                    disabled={extractedData.fields_found === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
                                >
                                    <Check size={16} />
                                    Confirm & Fill Form
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ DISEASE SELECTOR (Specific Mode) ═══ */}
            {mode === 'specific' && (
                <div className="card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-1">Select Target Disease</h2>
                    <p className="text-xs text-slate-500 mb-4">The form below will dynamically render only the required input features.</p>

                    <div className="flex flex-wrap gap-3">
                        {diseaseKeys.map(key => {
                            const cfg = diseaseConfig[key];
                            const isActive = selectedDisease === key;
                            const iconCfg = DISEASE_ICONS[key] || DEFAULT_ICON;
                            const IconComp = iconCfg.icon;

                            return (
                                <button
                                    type="button"
                                    key={key}
                                    onClick={() => { setSelectedDisease(key); setResults(null); }}
                                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 transition-all text-sm font-bold
                                        ${isActive
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className={`p-1.5 rounded-md ${isActive ? iconCfg.bg : 'bg-slate-100'}`}>
                                        <IconComp size={16} className={isActive ? iconCfg.text : 'text-slate-400'} />
                                    </div>
                                    {cfg.label}
                                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full ml-1">
                                        {cfg.fields.length} fields
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ DYNAMIC FORM ═══ */}
            {fieldGroups.length > 0 && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Patient ID */}
                    <div className="card p-6 border-blue-100 bg-white rounded-xl shadow-sm border">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Profile ID</label>
                        {isPatient ? (
                            <div className="px-5 py-3 bg-blue-50 border border-blue-200 rounded-lg inline-flex items-center gap-2">
                                <ShieldCheck size={18} className="text-blue-500" />
                                <span className="font-bold text-blue-800 tracking-wider font-mono">{patientId}</span>
                                <span className="text-xs font-semibold text-blue-500 uppercase ml-2 bg-blue-100 px-2 py-0.5 rounded">Auto-Linked</span>
                            </div>
                        ) : (
                            <input
                                type="text"
                                required
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full max-w-sm px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono font-bold text-slate-700"
                                placeholder="e.g. PAT-1001"
                            />
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                            {isPatient
                                ? "Your analysis results will be securely saved to your verified Google Drive profile."
                                : "The analysis results will be saved to this specific patient's Google Drive profile."}
                        </p>
                    </div>

                    {/* Field Groups */}
                    {fieldGroups.map(group => {
                        const iconCfg = DISEASE_ICONS[group.key] || DEFAULT_ICON;
                        const IconComp = iconCfg.icon;
                        const isUnified = group.key === '__unified__';

                        return (
                            <div key={group.key} className="card shadow-sm border-slate-200 bg-white rounded-xl overflow-hidden border">
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isUnified ? (mode === 'upload' ? 'bg-violet-100' : 'bg-emerald-100') : iconCfg.bg}`}>
                                        {isUnified
                                            ? (mode === 'upload'
                                                ? <FileText size={20} className="text-violet-600" />
                                                : <Layers size={20} className="text-emerald-600" />)
                                            : <IconComp size={20} className={iconCfg.text} />
                                        }
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">{group.label}</h2>
                                        <p className="text-xs text-slate-400">
                                            {group.fields.length} feature{group.fields.length !== 1 ? 's' : ''}
                                            {mode === 'upload' && extractedData && ` • ${extractedData.fields_found} auto-filled from report`}
                                        </p>
                                    </div>
                                </div>
                                <div className={`p-5 grid gap-4 ${group.fields.length > 8 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'
                                    }`}>
                                    {group.fields.map(field => renderField(field))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Submit */}
                    <div className="flex justify-end mt-2 mb-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex items-center gap-3 px-10 py-4 rounded-xl text-white font-bold transition-all shadow-md text-lg
                                ${isSubmitting
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-blue-700 hover:bg-blue-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'}`}
                        >
                            {isSubmitting ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
                            <span>{isSubmitting ? 'Running ML Models...' : 'Run Intelligence Pipeline'}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* ═══ RESULTS ═══ */}
            {results && (
                <div ref={resultsRef} id="results-section" className="flex flex-col gap-6 w-full mb-20">
                    <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                        <ShieldCheck size={24} className="text-blue-600" />
                        Analysis Results
                    </h2>

                    {/* Global Summary */}
                    {results.length > 1 && (
                        <div className="card p-6 bg-slate-800 text-white rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold">Global Summary</h3>
                                <p className="text-sm text-slate-300 mt-1">
                                    Evaluated <span className="text-white font-black">{results.length}</span> active disease models.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center bg-red-500/20 px-5 py-3 rounded-xl border border-red-500/30">
                                    <div className="text-3xl font-black text-red-400">{results.filter(r => r.risk_level === 'High Risk').length}</div>
                                    <div className="text-[10px] text-red-300 uppercase font-bold tracking-wider mt-1">High Risk</div>
                                </div>
                                <div className="text-center bg-orange-500/20 px-5 py-3 rounded-xl border border-orange-500/30">
                                    <div className="text-3xl font-black text-orange-400">{results.filter(r => r.risk_level === 'Moderate Risk').length}</div>
                                    <div className="text-[10px] text-orange-300 uppercase font-bold tracking-wider mt-1">Moderate</div>
                                </div>
                                <div className="text-center bg-emerald-500/20 px-5 py-3 rounded-xl border border-emerald-500/30">
                                    <div className="text-3xl font-black text-emerald-400">{results.filter(r => r.risk_level === 'Low Risk').length}</div>
                                    <div className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider mt-1">Low Risk</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Disease Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.map(res => {
                            let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                            let barColor = 'bg-emerald-500';
                            if (res.risk_level === 'High Risk') { badgeColor = 'bg-red-100 text-red-800 border-red-200'; barColor = 'bg-red-500'; }
                            else if (res.risk_level === 'Moderate Risk') { badgeColor = 'bg-orange-100 text-orange-800 border-orange-200'; barColor = 'bg-orange-500'; }

                            const iconCfg = DISEASE_ICONS[res.disease_name] || DEFAULT_ICON;
                            const IconComp = iconCfg.icon;
                            const probPercent = typeof res.probability === 'number' ? (res.probability * 100).toFixed(1) : null;

                            return (
                                <div key={res.disease_name} className="card p-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-lg">
                                    <div className={`h-1.5 w-full ${barColor}`} />
                                    <div className="p-6 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${iconCfg.bg}`}>
                                                    <IconComp size={20} className={iconCfg.text} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 capitalize">{res.disease_name.replace('_', ' ')}</h3>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wide ${badgeColor}`}>
                                                {res.risk_level}
                                            </div>
                                        </div>

                                        {res.error ? (
                                            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                                                <span className="font-bold">Error:</span> {res.error}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Probability</p>
                                                        <p className="text-2xl font-black text-slate-800 mt-1">{probPercent ? `${probPercent}%` : 'N/A'}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend</p>
                                                        <p className="text-base font-bold text-slate-700 mt-2">{res.trend_status}</p>
                                                    </div>
                                                </div>
                                                {probPercent && (
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(parseFloat(probPercent), 100)}%` }} />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {res.alert && res.alert.message !== 'STABLE' && (
                                            <div className={`p-3 rounded-lg flex items-center gap-3 text-sm font-semibold
                                                ${res.alert.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                <AlertCircle size={18} />
                                                <span>{res.alert.message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ═══ EXPORT & STORAGE BAR ═══ */}
                    <div className="card p-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {storageInfo?.stored && (
                                <div className="flex items-center gap-2 text-sm">
                                    {storageInfo.backend === 'gdrive' ? (
                                        <><Cloud size={16} className="text-blue-500" /><span className="text-blue-600 font-semibold">Saved to Google Drive Profile ({storageInfo.drive_folder ? storageInfo.drive_folder.replace('_', '-') : patientId})</span></>
                                    ) : (
                                        <><HardDrive size={16} className="text-slate-500" /><span className="text-slate-600 font-semibold">Saved locally ({patientId})</span></>
                                    )}
                                    <span className="text-xs text-slate-400 ml-1 cursor-help" title={storageInfo.file}>({storageInfo.file})</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={isExporting}
                                onClick={async () => {
                                    setIsExporting(true);
                                    try {
                                        await exportPDF(patientId, rawResults || {}, parseFormValues(formValues));
                                    } catch (err) {
                                        alert('PDF export failed: ' + err.message);
                                    } finally {
                                        setIsExporting(false);
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
                            >
                                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {isExporting ? 'Generating...' : 'Download PDF Report'}
                            </button>
                            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-all text-sm">
                                View Dashboard →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ EMPTY STATES ═══ */}
            {!mode && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Activity size={32} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600 text-lg">Choose an analysis mode above to begin.</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-md">
                        Upload a medical report, select a specific disease, or run auto-detection across all models.
                    </p>
                </div>
            )}

            {mode === 'specific' && !selectedDisease && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Target size={28} className="text-blue-400" />
                    </div>
                    <p className="font-bold text-slate-600">Select a disease above to load its required inputs.</p>
                    <p className="text-xs text-slate-400 mt-1">Each disease model has its own unique feature requirements.</p>
                </div>
            )}
        </div>
    );
}
