import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import registrationsApi from '../api/registrations';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

export default function MyEvents() {
  const { user, isAuthenticated } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await registrationsApi.mine();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Failed to load my events:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load your event registrations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle Cancel Registration
  const handleCancelRegistration = async (registrationId) => {
    setCancelError('');
    setCancellingId(registrationId);
    try {
      const res = await registrationsApi.cancel(registrationId);
      // Update local state without full reload
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === registrationId || reg._id === registrationId
            ? { ...reg, status: 'cancelled' }
            : reg
        )
      );
      setConfirmCancelId(null);
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      setCancelError(
        err.response?.data?.message || err.message || 'Failed to cancel registration.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  // If user is not an attendee (e.g. Organizer)
  if (isAuthenticated && user?.role === 'organizer') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-4">
          🏢
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Organizer Account</h2>
        <p className="text-gray-600 max-w-md mb-6">
          You are logged in as an Event Organizer. Head to your dashboard to manage events and check attendee registrations.
        </p>
        <Link
          to="/organizer/dashboard"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm"
        >
          Go to Organizer Dashboard
        </Link>
      </div>
    );
  }

  // If not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center text-3xl mb-4">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
        <p className="text-gray-600 max-w-md mb-6">
          Please log in to view your registered events and tickets.
        </p>
        <Link
          to="/login"
          state={{ from: '/my-events' }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading your events & tickets..." />
      </div>
    );
  }

  const now = new Date();

  // Categorize registrations into tabs
  const upcomingList = registrations.filter((reg) => {
    if (reg.status === 'cancelled') return false;
    if (!reg.event) return false;
    if (reg.event.status === 'cancelled') return false;
    const eventTime = reg.event.endDate
      ? new Date(reg.event.endDate)
      : new Date(reg.event.startDate);
    return eventTime >= now;
  });

  const pastList = registrations.filter((reg) => {
    if (reg.status === 'cancelled') return false;
    if (!reg.event) return false;
    if (reg.event.status === 'cancelled') return false;
    const eventTime = reg.event.endDate
      ? new Date(reg.event.endDate)
      : new Date(reg.event.startDate);
    return eventTime < now;
  });

  const cancelledList = registrations.filter((reg) => {
    return reg.status === 'cancelled' || reg.event?.status === 'cancelled';
  });

  const currentList =
    activeTab === 'upcoming'
      ? upcomingList
      : activeTab === 'past'
      ? pastList
      : cancelledList;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Registered Events
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Track your tickets, view upcoming schedules, and manage your registrations.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between text-sm">
            <span>{error}</span>
            <button
              onClick={fetchRegistrations}
              className="text-xs font-bold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Cancel Error Notification */}
        {cancelError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center justify-between">
            <span>{cancelError}</span>
            <button
              onClick={() => setCancelError('')}
              className="text-xs text-red-500 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-4 font-bold text-sm transition relative ${
              activeTab === 'upcoming'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming ({upcomingList.length})
            {activeTab === 'upcoming' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 px-4 font-bold text-sm transition relative ${
              activeTab === 'past'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Events ({pastList.length})
            {activeTab === 'past' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`pb-3 px-4 font-bold text-sm transition relative ${
              activeTab === 'cancelled'
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cancelled ({cancelledList.length})
            {activeTab === 'cancelled' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Events Grid or Empty State */}
        {currentList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              {activeTab === 'upcoming' ? '🎟️' : activeTab === 'past' ? '🕰️' : '🚫'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'upcoming'
                ? 'No Upcoming Events'
                : activeTab === 'past'
                ? 'No Past Events'
                : 'No Cancelled Events'}
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {activeTab === 'upcoming'
                ? "You haven't registered for any upcoming events yet. Discover meetups, hackathons, and conferences near you!"
                : activeTab === 'past'
                ? "You haven't attended any past events yet."
                : 'You have no cancelled registrations.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/"
                className="inline-flex px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm text-sm"
              >
                Discover Local Events
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map((reg) => {
              const regId = reg.id || reg._id;
              const eventItem = reg.event;
              if (!eventItem) return null;

              return (
                <div
                  key={regId}
                  className="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  {/* EventCard Preview */}
                  <div className="flex-1">
                    <EventCard event={eventItem} />
                  </div>

                  {/* Ticket Card Footer with Actions */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Ticket Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          reg.status === 'cancelled' || eventItem.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : reg.checkedIn
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {eventItem.status === 'cancelled'
                          ? 'Event Cancelled'
                          : reg.status === 'cancelled'
                          ? 'Cancelled'
                          : reg.checkedIn
                          ? 'Checked In'
                          : 'Confirmed'}
                      </span>
                    </div>

                    {/* Phase 3 TODO: Display interactive QR Code for check-in using qrToken */}
                    {reg.qrToken && (
                      <div className="text-[11px] text-gray-500 flex items-center justify-between font-mono bg-white p-2 rounded-lg border border-gray-200">
                        <span className="truncate">TICKET #{reg.qrToken.slice(0, 10)}</span>
                        {/* Phase 3 QR Display TODO */}
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-sans font-semibold">
                          QR Check-in (Phase 3)
                        </span>
                      </div>
                    )}

                    {/* Cancel action on Upcoming registrations */}
                    {activeTab === 'upcoming' && reg.status === 'registered' && (
                      <div className="pt-1">
                        {confirmCancelId === regId ? (
                          <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 space-y-2">
                            <p className="text-xs text-red-700 font-semibold text-center">
                              Cancel this registration?
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCancelRegistration(regId)}
                                disabled={cancellingId === regId}
                                className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                              >
                                {cancellingId === regId ? 'Cancelling...' : 'Yes, Cancel'}
                              </button>
                              <button
                                onClick={() => setConfirmCancelId(null)}
                                disabled={cancellingId === regId}
                                className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition"
                              >
                                Keep
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(regId)}
                            className="w-full py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition text-center"
                          >
                            Cancel Registration
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
