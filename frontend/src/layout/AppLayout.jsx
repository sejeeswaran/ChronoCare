import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex relative top-16">
                <Sidebar />
                <main className="flex-1 ml-64 p-8 min-h-[calc(100vh-64px)] overflow-x-hidden">
                    {/* Render active route content */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
