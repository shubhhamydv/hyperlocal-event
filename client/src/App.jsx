import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetail from './pages/EventDetail';
import MyEvents from './pages/MyEvents';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Discovery & Auth */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/events/:id" element={<EventDetail />} />

              {/* Attendee Protected Routes */}
              <Route
                path="/my-events"
                element={
                  <ProtectedRoute role="attendee">
                    <MyEvents />
                  </ProtectedRoute>
                }
              />

              {/* Organizer Protected Routes */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute role="organizer">
                    <OrganizerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/new"
                element={
                  <ProtectedRoute role="organizer">
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:id/edit"
                element={
                  <ProtectedRoute role="organizer">
                    <EditEvent />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>

          <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
            <p>© 2026 Hyperlocal Event Discovery. Built with React, Vite & Tailwind CSS.</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
