import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import eventsApi from '../api/events';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await eventsApi.getEventById(id);
        setEvent(data.event);
      } catch (err) {
        console.error("Failed to fetch event detail:", err);
        setError(err.response?.data?.message || err.message || 'Event not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading event details..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-200 text-center shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Available</h2>
        <p className="text-gray-600 mb-6">{error || "The event could not be found."}</p>
        <Link
          to="/"
          className="inline-flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm"
        >
          ← Back to Discovery
        </Link>
      </div>
    );
  }

  const isOwner = user && (event.organizer?._id === user.id || event.organizer?.id === user.id);

  const formattedStart = event.startDate
    ? new Date(event.startDate).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short'
      })
    : 'Date TBA';

  const formattedEnd = event.endDate
    ? new Date(event.endDate).toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short'
      })
    : null;

  const formattedDeadline = event.registrationDeadline
    ? new Date(event.registrationDeadline).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            ← Back to all events
          </Link>
        </div>

        {/* Status banner if not published */}
        {event.status !== 'published' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold">⚠️ Notice:</span>
              <span>This event is currently in <strong>{event.status}</strong> mode.</span>
            </div>
            {isOwner && (
              <span className="text-xs bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                You are the Organizer
              </span>
            )}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Hero Cover Image */}
          <div className="relative h-72 sm:h-96 w-full bg-gray-900">
            <img
              src={event.coverImage || DEFAULT_COVER}
              alt={event.title}
              className="w-full h-full object-cover opacity-90"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_COVER;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            {/* Badges on hero */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-sm">
                {event.category}
              </span>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-gray-900 font-semibold text-xs rounded-full capitalize">
                {event.mode} Mode
              </span>
            </div>

            <div className="absolute top-4 right-4">
              {event.price === 0 || event.price === '0' ? (
                <span className="px-4 py-1.5 bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider rounded-full shadow-md">
                  Free Event
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-white text-indigo-900 font-extrabold text-sm rounded-full shadow-md">
                  ₹{event.price}
                </span>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-snug">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 cols: Description & Host info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">About this Event</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                  {event.description || "No description provided."}
                </p>
              </div>

              {/* Organizer Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {event.organizer?.name ? event.organizer.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-indigo-600 tracking-wider">
                    Event Organizer
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    {event.organizer?.name || "Community Host"}
                  </div>
                  {event.organizer?.email && (
                    <div className="text-xs text-gray-500">{event.organizer.email}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right col: Logistics Sidebar */}
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                {/* Date and Time */}
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Date & Time
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formattedStart}
                  </div>
                  {formattedEnd && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Until: {formattedEnd}
                    </div>
                  )}
                </div>

                {/* Venue / City */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Location & Venue
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {event.venue?.name || (event.mode === 'online' ? 'Online Gathering' : 'Venue TBA')}
                  </div>
                  {event.venue?.address && (
                    <div className="text-xs text-gray-600 mt-0.5">{event.venue.address}</div>
                  )}
                  {event.venue?.city && (
                    <div className="text-xs font-medium text-indigo-600 mt-0.5">
                      📍 {event.venue.city}
                    </div>
                  )}
                </div>

                {/* Deadline */}
                {formattedDeadline && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Registration Deadline
                    </div>
                    <div className="text-xs font-semibold text-red-600">
                      Closes on {formattedDeadline}
                    </div>
                  </div>
                )}

                {/* Capacity & Seats */}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-600">Total Capacity:</span>
                  <span className="font-bold text-gray-900">{event.capacity || 100}</span>
                </div>
                {event.seatsAvailable !== undefined && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-600">Available Spots:</span>
                    <span className="font-bold text-emerald-600">{event.seatsAvailable} remaining</span>
                  </div>
                )}

                {/* RSVP / Action Button */}
                <div className="pt-4">
                  {rsvpSuccess ? (
                    <div className="w-full py-3 px-4 bg-emerald-100 text-emerald-800 text-center font-bold text-sm rounded-xl border border-emerald-300">
                      ✓ RSVP Confirmed! See you there.
                    </div>
                  ) : (
                    <button
                      onClick={() => setRsvpSuccess(true)}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
                    >
                      {event.price === 0 ? 'RSVP for Free' : `Register Now • ₹${event.price}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
