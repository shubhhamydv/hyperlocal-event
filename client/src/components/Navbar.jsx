import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition">
              <span className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                H
              </span>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                Hyper<span className="text-indigo-600">local</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                to="/"
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  isActive('/')
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Discover
              </Link>

              {isAuthenticated && user?.role === 'organizer' && (
                <Link
                  to="/organizer"
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    isActive('/organizer')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Organizer Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* User Auth Buttons / Profile */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 flex items-center space-x-1.5">
                    <span>{user?.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                        user?.role === 'organizer'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  {user?.city && (
                    <div className="text-xs text-gray-500">📍 {user.city}</div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-gray-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Discover Events
          </Link>

          {isAuthenticated && user?.role === 'organizer' && (
            <Link
              to="/organizer"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/organizer') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Organizer Dashboard
            </Link>
          )}

          {isAuthenticated ? (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-base font-semibold text-gray-900">{user?.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{user?.role} {user?.city ? `• ${user.city}` : ''}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
