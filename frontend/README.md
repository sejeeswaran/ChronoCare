# ChronoCare AI Frontend

This directory contains the user interface for the ChronoCare AI risk intelligence platform.

## Architecture

Built using modern web technologies:
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS
- **Charting**: Recharts for patient history trend graphs
- **Icons**: Lucide React
- **Authentication**: JWT-based session management communicating with the Flask Backend

## Getting Started

To run the frontend individually (without the `start.py` root script):

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will start at `http://localhost:5173`. It expects the Python backend to be running simultaneously on `http://127.0.0.1:5000`.

## Linting

```bash
npm run lint
```
