import React, { createContext, useContext, useState } from 'react';

const HealthDataContext = createContext();

export function HealthDataProvider({ children }) {
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Calculate the global risk dynamically based on activated diseases
    const getGlobalRisk = () => {
        if (!patientData || !patientData.activated_diseases) return 0;
        const diseases = patientData.activated_diseases;
        if (diseases.length === 0) return 0;

        const totalRisk = diseases.reduce((sum, disease) => sum + disease.risk_score, 0);
        return Math.round(totalRisk / diseases.length);
    };

    return (
        <HealthDataContext.Provider value={{
            patientData,
            setPatientData,
            loading,
            setLoading,
            error,
            setError,
            globalRisk: getGlobalRisk()
        }}>
            {children}
        </HealthDataContext.Provider>
    );
}

export const useHealthData = () => useContext(HealthDataContext);
