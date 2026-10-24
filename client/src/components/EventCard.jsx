import React from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = {
  Hackathon: 'bg-amber-100 text-amber-800 border-amber-200',
  Workshop: 'bg-blue-100 text-blue-800 border-blue-200',
  Meetup: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Conference: 'bg-purple-100 text-purple-800 border-purple-200',
  Networking: 'bg-rose-100 text-rose-800 border-rose-200',
  Webinar: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Other: 'bg-gray-100 text-gray-800 border-gray-200'
};

const DEFAULT_COVER = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";

export default function EventCard({ event }) {
  const eventId = event._id || event.id;
  const categoryClass = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other;

  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Date TBA';

  const venueCity = event.venue?.city || (event.mode === 'online' ? 'Online' : 'Location TBA');
  const venueName = event.venue?.name;

  return (
    <Link
      to={`/events/${eventId}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
    >
      {/* Cover Image & Badges */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        <img
          src={event.coverImage || DEFAULT_COVER}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_COVER;
          }}
        />

        {/* Free / Price Badge */}
        <div className="absolute top-3 right-3">
          {event.price === 0 || event.price === '0' ? (
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-sm">
              Free
            </span>
          ) : (
            <span className="px-3 py-1 bg-indigo-700 text-white font-bold text-xs rounded-full shadow-sm">
              ₹{event.price}
            </span>
          )}
        </div>

        {/* Mode badge (e.g. offline, online, hybrid) */}
        {event.mode && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white font-medium text-xs rounded-full capitalize">
              {event.mode}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip & Distance */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryClass}`}
            >
              {event.category || 'Event'}
            </span>

            {event.distanceKm !== null && event.distanceKm !== undefined && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center">
                📍 {event.distanceKm} km away
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
            {event.title}
          </h3>

          {/* Date & Time */}
          <div className="text-sm font-medium text-indigo-950 flex items-center space-x-1.5 mb-2">
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Footer: Venue & Seats */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1 truncate max-w-[70%]">
            <span>🏢</span>
            <span className="truncate">
              {venueName ? `${venueName}, ${venueCity}` : venueCity}
            </span>
          </div>

          {event.seatsAvailable !== undefined && (
            <span className="text-gray-600 font-medium whitespace-nowrap">
              {event.seatsAvailable} spots left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
