import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-3xl border border-gray-200 shadow-sm">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-extrabold mx-auto shadow-inner">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          The page or event route you are looking for doesn't exist or has been moved.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
          >
            ← Return to Discover Events
          </Link>
        </div>
      </div>
    </div>
  );
}
