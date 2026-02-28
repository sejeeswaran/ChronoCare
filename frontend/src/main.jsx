import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HealthDataProvider } from './context/HealthDataContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <HealthDataProvider>
        <App />
      </HealthDataProvider>
    </BrowserRouter>
  </StrictMode>,
);
