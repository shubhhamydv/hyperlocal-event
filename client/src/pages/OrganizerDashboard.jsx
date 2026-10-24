import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import eventsApi from '../api/events';
import { organizerRegistrationsApi } from '../api/organizerRegistrations';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'published' | 'draft' | 'cancelled'
  const [toastMessage, setToastMessage] = useState(location.state?.message || '');
  const [actionLoading, setActionLoading] = useState(null);

  // Registrations modal / drawer state
  const [selectedEventForRegs, setSelectedEventForRegs] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [regsError, setRegsError] = useState('');

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

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handlePublish = async (id, title) => {
    if (!window.confirm(`Are you sure you want to publish "${title}"? It will become visible on the discovery feed immediately.`)) {
      return;
    }
    setActionLoading(id);
    try {
      await eventsApi.publishEvent(id);
      setToastMessage(`"${title}" published successfully!`);
      await fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to publish event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel "${title}"? This cannot be undone and will notify registered attendees.`)) {
      return;
    }
    setActionLoading(id);
    try {
      await eventsApi.cancelEvent(id);
      setToastMessage(`"${title}" has been cancelled.`);
      await fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to cancel event");
    } finally {
      setActionLoading(null);
    }
  };

  const openRegistrationsModal = async (event) => {
    setSelectedEventForRegs(event);
    setRegistrations([]);
    setRegsLoading(true);
    setRegsError('');

    try {
      const eventId = event._id || event.id;
      const data = await organizerRegistrationsApi.getEventRegistrations(eventId);
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error("Failed to fetch event registrations:", err);
      setRegsError(err.response?.data?.message || err.message || "Failed to fetch registrations");
    } finally {
      setRegsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!selectedEventForRegs || registrations.length === 0) return;

    const headers = ["Name", "Email", "Registered At", "Checked In", "Status"];
    const rows = registrations.map((r) => [
      `"${(r.user?.name || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(r.user?.email || '').replace(/"/g, '""')}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : ''}"`,
      r.checkedIn ? "Yes" : "No",
      r.status || "registered"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const sanitizedTitle = (selectedEventForRegs.title || 'event')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    link.setAttribute("download", `${sanitizedTitle}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === 'published').length;
  const draftEvents = events.filter((e) => e.status === 'draft').length;
  const cancelledEvents = events.filter((e) => e.status === 'cancelled').length;

  const totalRegistrations = events.reduce((sum, e) => {
    const cap = e.capacity || 0;
    const seats = e.seatsAvailable !== undefined ? e.seatsAvailable : cap;
    return sum + Math.max(0, cap - seats);
  }, 0);

  const upcomingCount = events.filter((e) => {
    if (e.status !== 'published') return false;
    const now = new Date();
    const start = e.startDate ? new Date(e.startDate) : null;
    return start && start >= now;
  }).length;

  // Filtered list
  const filteredEvents = events.filter((e) => {
    if (activeTab === 'all') return true;
    return e.status === activeTab;
  });

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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold">✓</span>
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage('')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Organizer Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span>. Create and manage your hyperlocal events.
            </p>
          </div>

          <Link
            to="/organizer/events/new"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <span className="mr-1.5 text-base font-bold">+</span> Create Event
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Events</div>
              <div className="mt-1 text-3xl font-black text-gray-900">{totalEvents}</div>
              <div className="mt-1 text-xs text-gray-500">
                {publishedEvents} published • {draftEvents} drafts
              </div>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              📅
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Registrations</div>
              <div className="mt-1 text-3xl font-black text-emerald-600">{totalRegistrations}</div>
              <div className="mt-1 text-xs text-gray-500">Across all hosted sessions</div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              👥
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Upcoming Events</div>
              <div className="mt-1 text-3xl font-black text-indigo-600">{upcomingCount}</div>
              <div className="mt-1 text-xs text-gray-500">Active and open for registration</div>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              🚀
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
          {[
            { id: 'all', label: 'All', count: totalEvents },
            { id: 'published', label: 'Published', count: publishedEvents },
            { id: 'draft', label: 'Drafts', count: draftEvents },
            { id: 'cancelled', label: 'Cancelled', count: cancelledEvents }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-800 text-indigo-100' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchMyEvents} className="text-xs font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Event List Table */}
        {loading ? (
          <div className="py-20">
            <Loader message="Loading your events..." />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              📝
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              No {activeTab !== 'all' ? activeTab : ''} events found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {activeTab === 'draft'
                ? 'You have no draft events saved right now.'
                : activeTab === 'published'
                ? 'No published events yet. Publish a draft or create a new event!'
                : 'Get started by creating your first tech gathering.'}
            </p>
            <Link
              to="/organizer/events/new"
              className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              + Create Event
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-4 px-6">Event Details</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date & Schedule</th>
                    <th className="py-4 px-6 min-w-[180px]">Attendance / Capacity</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredEvents.map((ev) => {
                    const evId = ev._id || ev.id;
                    const cap = ev.capacity || 100;
                    const seats = ev.seatsAvailable !== undefined ? ev.seatsAvailable : cap;
                    const registered = Math.max(0, cap - seats);
                    const pct = Math.min(100, Math.round((registered / cap) * 100));

                    const dateStr = ev.startDate
                      ? new Date(ev.startDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Date TBA';

                    return (
                      <tr key={evId} className="hover:bg-gray-50/80 transition">
                        {/* Event title & meta */}
                        <td className="py-4 px-6 max-w-xs">
                          <Link
                            to={`/events/${evId}`}
                            className="font-bold text-gray-900 hover:text-indigo-600 transition block truncate"
                          >
                            {ev.title}
                          </Link>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center space-x-2">
                            <span className="font-medium text-indigo-600">{ev.category}</span>
                            <span>•</span>
                            <span className="capitalize">{ev.mode}</span>
                            {ev.venue?.city && (
                              <>
                                <span>•</span>
                                <span>📍 {ev.venue.city}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {statusBadge(ev.status)}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-xs text-gray-600 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{dateStr}</div>
                          {ev.price === 0 ? (
                            <span className="text-emerald-600 font-bold">Free</span>
                          ) : (
                            <span className="text-gray-500">₹{ev.price}</span>
                          )}
                        </td>

                        {/* Capacity Progress Bar */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-800">
                              {registered} / {cap}
                            </span>
                            <span className="text-gray-400 font-medium">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                pct >= 90
                                  ? 'bg-red-500'
                                  : pct >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                              }`}
                            ></div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {seats} seats left
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                          {/* View Registrations */}
                          <button
                            type="button"
                            onClick={() => openRegistrationsModal(ev)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                          >
                            Registrations
                          </button>

                          {/* Edit button */}
                          {ev.status !== 'cancelled' && (
                            <Link
                              to={`/organizer/events/${evId}/edit`}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition inline-block"
                            >
                              Edit
                            </Link>
                          )}

                          {/* Publish button (Draft only) */}
                          {ev.status === 'draft' && (
                            <button
                              type="button"
                              disabled={actionLoading === evId}
                              onClick={() => handlePublish(evId, ev.title)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                            >
                              {actionLoading === evId ? 'Publishing...' : 'Publish'}
                            </button>
                          )}

                          {/* Cancel button (Published only) */}
                          {ev.status === 'published' && (
                            <button
                              type="button"
                              disabled={actionLoading === evId}
                              onClick={() => handleCancel(evId, ev.title)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
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

        {/* View Registrations Modal / Drawer */}
        {selectedEventForRegs && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <div className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                    Attendee Roster
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-1 line-clamp-1">
                    {selectedEventForRegs.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total Registered: <strong>{registrations.length}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedEventForRegs(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto py-4">
                {regsLoading ? (
                  <div className="py-12">
                    <Loader message="Loading attendee registrations..." />
                  </div>
                ) : regsError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                    {regsError}
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                      👥
                    </div>
                    <h4 className="text-base font-bold text-gray-800">No Registrations Yet</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      As attendees register for this event, their details will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Attendee Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Registered On</th>
                          <th className="py-2.5 px-3 text-center">Checked In</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700">
                        {registrations.map((reg) => (
                          <tr key={reg.id || reg._id} className="hover:bg-gray-50">
                            <td className="py-3 px-3 font-semibold text-gray-900">
                              {reg.user?.name || "Attendee"}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {reg.user?.email || "—"}
                            </td>
                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                              {reg.createdAt
                                ? new Date(reg.createdAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {reg.checkedIn ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ Yes
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                                  No
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer with CSV Export */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {registrations.length} attendee records
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={downloadCSV}
                    disabled={registrations.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-40 flex items-center space-x-1.5"
                  >
                    <span>📥</span>
                    <span>Download CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEventForRegs(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
