import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import eventsApi from '../api/events';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMyEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventsApi.getMyEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch organizer events:", err);
      setError(err.response?.data?.message || err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const handleCancelEvent = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this event? This action will set its status to cancelled.")) {
      return;
    }
    setActionLoading(id);
    try {
      await eventsApi.cancelEvent(id);
      await fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel event");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Draft
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const totalCount = events.length;
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const draftCount = events.filter((e) => e.status === 'draft').length;
  const cancelledCount = events.filter((e) => e.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Organizer Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome, <span className="font-semibold text-gray-800">{user?.name}</span>. Manage your hosted events, check status, and oversee attendees.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <span className="mr-1.5 text-base">+</span> Create Event
          </button>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Hosted</div>
            <div className="mt-2 text-3xl font-black text-gray-900">{totalCount}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Published</div>
            <div className="mt-2 text-3xl font-black text-emerald-600">{publishedCount}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Drafts</div>
            <div className="mt-2 text-3xl font-black text-amber-600">{draftCount}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Cancelled</div>
            <div className="mt-2 text-3xl font-black text-red-600">{cancelledCount}</div>
          </div>
        </div>

        {/* Phase 2 Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold mb-4">
                🚀
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Event Form</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                The comprehensive event creation form (with GeoJSON map coordinate picker, ticket tiers, and cover uploads) is slated for <strong>Phase 2</strong>.
                <br /><br />
                In Phase 1, you can monitor your events from <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">GET /events/mine</code>, test cancellation, and verify role-based permissions.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchMyEvents} className="text-xs font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Events Table / List */}
        {loading ? (
          <div className="py-20">
            <Loader message="Loading your events from /events/mine..." />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              📝
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Events Found</h3>
            <p className="text-sm text-gray-500 mb-6">
              You haven't created any events yet. Click "Create Event" to schedule your first gathering.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              + Create Event
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base">Your Hosted Events</h2>
              <span className="text-xs text-gray-500">{events.length} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3.5 px-6">Event Title</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Capacity</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {events.map((ev) => {
                    const evId = ev._id || ev.id;
                    const dateStr = ev.startDate
                      ? new Date(ev.startDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'TBA';

                    return (
                      <tr key={evId} className="hover:bg-gray-50/80 transition">
                        <td className="py-4 px-6 font-semibold text-gray-900 max-w-xs">
                          <Link
                            to={`/events/${evId}`}
                            className="hover:text-indigo-600 transition"
                          >
                            {ev.title}
                          </Link>
                          {ev.venue?.city && (
                            <div className="text-xs text-gray-400 font-normal">
                              📍 {ev.venue.city} ({ev.mode || 'offline'})
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-600">
                          {ev.category}
                        </td>
                        <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {statusBadge(ev.status)}
                        </td>
                        <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                          {ev.seatsAvailable !== undefined
                            ? `${ev.seatsAvailable} / ${ev.capacity}`
                            : ev.capacity || 100}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                          <Link
                            to={`/events/${evId}`}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition"
                          >
                            View
                          </Link>
                          {ev.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelEvent(evId)}
                              disabled={actionLoading === evId}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {actionLoading === evId ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
