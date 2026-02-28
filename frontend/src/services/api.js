import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Auth Interceptor: attach JWT to every request ──
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('chronocare_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auth API ──
export const loginUser = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
};

export const signupUser = async (name, email, password, role) => {
    const response = await apiClient.post('/auth/signup', { name, email, password, role });
    return response.data;
};

export const fetchCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};

// ── Disease Config ──
export const fetchDiseaseConfig = async () => {
    try {
        const response = await apiClient.get('/disease-config');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch disease config from backend');
    }
};

// ── Predict ──
export const analyzeHealthData = async (patientId, clinicalData, wearableData, selectedDiseases = null) => {
    try {
        const payload = {
            patient_id: patientId,
            patient_data: [
                {
                    patient_id: patientId,
                    ...clinicalData,
                    ...(wearableData || {})
                }
            ],
            selected_diseases: (selectedDiseases && selectedDiseases.length > 0) ? selectedDiseases : null
        };

        const response = await apiClient.post('/predict', payload);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.error || error.response.data.detail || 'API execution failed');
        }
        throw new Error('Network error. Is the backend running?');
    }
};

// ── Report Extraction ──
export const extractReport = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('chronocare_token');
        const response = await axios.post(`${API_BASE_URL}/extract-report`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.error || 'Report extraction failed');
        }
        throw new Error('Network error. Is the backend running?');
    }
};

// ── PDF Export ──
export const exportPDF = async (patientId, results, inputData = {}) => {
    try {
        const token = localStorage.getItem('chronocare_token');
        const response = await axios.post(`${API_BASE_URL}/export-pdf`, {
            patient_id: patientId,
            results: results,
            input_data: inputData,
        }, {
            responseType: 'blob',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        // Trigger browser download
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `ChronoCare_Report_${patientId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        throw new Error('Failed to generate PDF report');
    }
};

// ── Timeline (patient history) ──
export const fetchPatientTimeline = async (patientId) => {
    try {
        const response = await apiClient.get(`/timeline/${patientId}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 403) {
            throw new Error('Access denied. You can only view your own timeline.');
        }
        throw new Error('Failed to fetch patient timeline');
    }
};

// ── Patient list ──
export const fetchPatientList = async () => {
    try {
        const response = await apiClient.get('/patients');
        return response.data;
    } catch (error) {
        // Silently fail for patients (they don't have access)
        return { patient_ids: [], count: 0 };
    }
};

// ── Storage status ──
export const fetchStorageStatus = async () => {
    try {
        const response = await apiClient.get('/storage-status');
        return response.data;
    } catch (error) {
        return { google_drive_connected: false, fallback: 'local' };
    }
};
