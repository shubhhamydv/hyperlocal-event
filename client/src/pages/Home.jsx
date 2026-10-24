import React, { useState, useEffect, useCallback } from 'react';
import eventsApi from '../api/events';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import { CATEGORIES } from '../constants';
import { useAuth } from '../context/AuthContext';

// Default fallback coordinates: Mumbai (lat: 19.0760, lng: 72.8777)
const FALLBACK_LOCATION = {
  lat: 19.0760,
  lng: 72.8777,
  city: 'Mumbai',
  radiusKm: 25
};

export default function Home() {
  const { user } = useAuth();

  // Coordinates state
  // TODO: Dedicated interactive map & GPS location picker coming in Phase 3.
  // For now, defaults to Mumbai (19.0760, 72.8777) with a 25km radius as per contract.
  const [location] = useState(FALLBACK_LOCATION);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFreeOnly, setIsFreeOnly] = useState(false);
  const [modeFilter, setModeFilter] = useState('');

  // Events state
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        lat: location.lat,
        lng: location.lng,
        radiusKm: location.radiusKm,
        page: 1,
        limit: 20
      };

      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (isFreeOnly) params.free = 'true';
      if (modeFilter) params.mode = modeFilter;

      const data = await eventsApi.getEvents(params);
      setEvents(data.events || []);
      setTotal(data.total || (data.events ? data.events.length : 0));
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err.response?.data?.message || err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [location, selectedCategory, searchQuery, isFreeOnly, modeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-4 text-indigo-200">
              <span>📍 Hyperlocal Discovery</span>
              <span>•</span>
              <span>Within {location.radiusKm} km of {location.city}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Discover Tech Gatherings, Hackathons & Communities
            </h1>

            <p className="mt-4 text-lg text-indigo-100 max-w-2xl leading-relaxed">
              Find workshops, meetups, and conferences happening right around you in {location.city}.
              Network with fellow engineers and build the future together.
            </p>

            {user?.interests && user.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-indigo-200 font-medium">Your interests:</span>
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs bg-indigo-700/60 border border-indigo-500/40 px-2.5 py-0.5 rounded-full text-indigo-100"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by title, keyword, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Select */}
            <div className="md:col-span-2">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="">Any Mode</option>
                <option value="offline">In-Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Free Checkbox */}
            <div className="md:col-span-2 flex items-center justify-start md:justify-end">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFreeOnly}
                  onChange={(e) => setIsFreeOnly(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span>Free Events Only</span>
              </label>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap mr-1">
              Filter:
            </span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === ''
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Phase 3 Notice & Location Details */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 bg-indigo-50/60 border border-indigo-100 px-4 py-2.5 rounded-xl gap-2">
          <div className="flex items-center space-x-2">
            <span>📍</span>
            <span>
              Showing events within <strong>{location.radiusKm} km</strong> of <strong>{location.city}</strong> (19.0760° N, 72.8777° E).
            </span>
          </div>
          {/* Clear TODO as required by prompt */}
          <div className="text-indigo-700 font-medium italic">
            {/* TODO: Phase 3 will introduce an interactive GPS / Leaflet location picker with custom radius slider */}
            [Phase 3: Interactive Location Picker Coming Soon]
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={fetchEvents}
              className="text-xs font-bold underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Event List / Grid */}
        {loading ? (
          <div className="py-20">
            <Loader message="Discovering nearby events..." />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              📅
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">No Events Found</h3>
            <p className="text-sm text-gray-500 mb-6">
              We couldn't find any published upcoming events matching your criteria within {location.radiusKm} km of {location.city}.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                setIsFreeOnly(false);
                setModeFilter('');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Upcoming Events ({total})
              </h2>
              <span className="text-xs text-gray-500">
                Sorted by nearest location first
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event._id || event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
