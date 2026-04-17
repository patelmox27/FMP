import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function Layout() {
  useEffect(() => {
    const socket = io("http://localhost:3001");
    
    socket.on("adminAlert", (data) => {
      toast.error(data.message, {
        duration: 8000,
        icon: '⚠️',
        style: {
          borderRadius: '1.5rem',
          background: '#1A1A1E',
          color: '#E2E2E8',
          border: '1px solid rgba(226, 226, 232, 0.1)',
        },
      });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

