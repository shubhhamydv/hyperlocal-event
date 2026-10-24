import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen message="Authenticating session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✕
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600 mb-6">
          This page is only accessible to users with the <span className="font-semibold text-gray-800 uppercase tracking-wide text-xs bg-gray-100 px-2 py-1 rounded">{role}</span> role.
          You are currently signed in as an <span className="font-semibold text-gray-800 capitalize">{user.role}</span>.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-150 shadow-sm"
          >
            Go to Discover Events
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
