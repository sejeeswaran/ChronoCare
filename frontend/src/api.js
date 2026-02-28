import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPatients = async () => {
    const response = await api.get('/patients');
    return response.data.patients || [];
};

export const getPatientTimeline = async (patientId) => {
    const response = await api.get(`/patient/${patientId}`);
    return response.data;
};

export const getPatientAlerts = async (patientId) => {
    const response = await api.get(`/alerts/${patientId}`);
    return response.data;
};

export const addRecord = async (recordData) => {
    const response = await api.post('/add_record', recordData);
    return response.data;
};

export default api;
