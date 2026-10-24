import React, { useState, useEffect } from 'react';
import { CATEGORIES, INTERESTS } from '../constants';

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({
  initialData = {},
  onSubmit,
  isSubmitting = false,
  serverError = '',
  isEdit = false,
  registeredCount = 0
}) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [category, setCategory] = useState(initialData.category || CATEGORIES[0]);
  const [selectedTags, setSelectedTags] = useState(initialData.tags || []);
  const [mode, setMode] = useState(initialData.mode || 'offline');
  const [startDate, setStartDate] = useState(toDatetimeLocal(initialData.startDate));
  const [endDate, setEndDate] = useState(toDatetimeLocal(initialData.endDate));
  const [registrationDeadline, setRegistrationDeadline] = useState(toDatetimeLocal(initialData.registrationDeadline));
  const [capacity, setCapacity] = useState(initialData.capacity || 50);
  const [isFree, setIsFree] = useState(initialData.price === 0 || initialData.price === '0' || !initialData.price);
  const [price, setPrice] = useState(initialData.price || 0);
  const [coverImage, setCoverImage] = useState(initialData.coverImage || '');

  // Venue
  const [venueName, setVenueName] = useState(initialData.venue?.name || '');
  const [venueAddress, setVenueAddress] = useState(initialData.venue?.address || '');
  const [venueCity, setVenueCity] = useState(initialData.venue?.city || 'Mumbai');

  // Coordinates
  const initialLat = initialData.location?.coordinates ? initialData.location.coordinates[1] : (initialData.lat || 19.0760);
  const initialLng = initialData.location?.coordinates ? initialData.location.coordinates[0] : (initialData.lng || 72.8777);
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  // UI status
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState({ text: '', type: '' });
  const [clientErrors, setClientErrors] = useState({});

  useEffect(() => {
    if (initialData.title) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setCategory(initialData.category || CATEGORIES[0]);
      setSelectedTags(initialData.tags || []);
      setMode(initialData.mode || 'offline');
      setStartDate(toDatetimeLocal(initialData.startDate));
      setEndDate(toDatetimeLocal(initialData.endDate));
      setRegistrationDeadline(toDatetimeLocal(initialData.registrationDeadline));
      setCapacity(initialData.capacity || 50);
      setIsFree(initialData.price === 0 || initialData.price === '0' || !initialData.price);
      setPrice(initialData.price || 0);
      setCoverImage(initialData.coverImage || '');
      setVenueName(initialData.venue?.name || '');
      setVenueAddress(initialData.venue?.address || '');
      setVenueCity(initialData.venue?.city || 'Mumbai');
      if (initialData.location?.coordinates) {
        setLng(initialData.location.coordinates[0]);
        setLat(initialData.location.coordinates[1]);
      } else if (initialData.lat && initialData.lng) {
        setLat(initialData.lat);
        setLng(initialData.lng);
      }
    }
  }, [initialData]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 4) {
        alert("Maximum 4 interest tags can be selected");
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleGeocode = async () => {
    const queryParts = [venueAddress, venueCity, venueName].filter(Boolean);
    if (queryParts.length === 0) {
      setGeocodeMsg({ text: 'Please fill in address or city first to find on map', type: 'error' });
      return;
    }
    const query = queryParts.join(', ');
    setGeocoding(true);
    setGeocodeMsg({ text: 'Looking up coordinates...', type: 'info' });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);
        setLat(foundLat);
        setLng(foundLng);
        setGeocodeMsg({
          text: `Found: ${data[0].display_name.slice(0, 75)}... (${foundLat.toFixed(4)}, ${foundLng.toFixed(4)})`,
          type: 'success'
        });
      } else {
        setGeocodeMsg({
          text: 'Address not found on map. You can adjust the address or manually enter lat/lng below.',
          type: 'error'
        });
      }
    } catch (err) {
      console.warn("Geocode error:", err);
      setGeocodeMsg({
        text: 'Geocoding service unavailable. You can enter lat/lng manually.',
        type: 'error'
      });
    } finally {
      setGeocoding(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!category) errs.category = 'Category is required';
    if (!startDate) errs.startDate = 'Start date and time is required';
    if (!endDate) errs.endDate = 'End date and time is required';
    if (!registrationDeadline) errs.registrationDeadline = 'Registration deadline is required';

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const deadline = new Date(registrationDeadline).getTime();

    if (start && end && end < start) {
      errs.endDate = 'End date must be after start date';
    }
    if (start && deadline && deadline > start) {
      errs.registrationDeadline = 'Registration deadline must be before or equal to start date';
    }

    const capNum = Number(capacity);
    if (isNaN(capNum) || capNum < 1) {
      errs.capacity = 'Capacity must be at least 1';
    } else if (isEdit && registeredCount > 0 && capNum < registeredCount) {
      errs.capacity = `Capacity cannot be lower than current registered count (${registeredCount})`;
    }

    if (!isFree) {
      const p = Number(price);
      if (isNaN(p) || p < 0) {
        errs.price = 'Price must be 0 or a positive number';
      }
    }

    if (mode !== 'online') {
      if (!venueName.trim()) errs.venueName = 'Venue name is required for in-person / hybrid events';
      if (!venueAddress.trim()) errs.venueAddress = 'Venue address is required';
      if (!venueCity.trim()) errs.venueCity = 'Venue city is required';
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errs.lat = 'Latitude must be between -90 and 90';
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errs.lng = 'Longitude must be between -180 and 180';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (targetStatus) => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      tags: selectedTags,
      mode,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      registrationDeadline: new Date(registrationDeadline).toISOString(),
      capacity: Number(capacity),
      price: isFree ? 0 : Number(price),
      coverImage: coverImage.trim(),
      venue: {
        name: venueName.trim() || (mode === 'online' ? 'Online' : 'Venue TBA'),
        address: venueAddress.trim() || (mode === 'online' ? 'Online' : 'TBA'),
        city: venueCity.trim() || 'Mumbai'
      },
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    if (targetStatus) {
      payload.status = targetStatus;
    }

    onSubmit(payload, targetStatus);
  };

  return (
    <div className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-sm">
      {/* Server or Form Errors */}
      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start space-x-2">
          <span className="font-bold">⚠️ Error:</span>
          <span>{serverError}</span>
        </div>
      )}

      {Object.keys(clientErrors).length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
          <p className="font-semibold mb-1">Please fix the following validation issues:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            {Object.values(clientErrors).map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Basic Information */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
          1. Basic Information
        </h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="event-title">
            Event Title *
          </label>
          <input
            id="event-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mumbai AI & Web3 Developer Summit"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="event-desc">
            Description *
          </label>
          <textarea
            id="event-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what attendees will learn, key speakers, schedule, and highlights..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="event-category">
              Category *
            </label>
            <select
              id="event-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="event-mode">
              Event Mode *
            </label>
            <select
              id="event-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="offline">In-Person (Offline)</option>
              <option value="online">Online (Webinar / Virtual)</option>
              <option value="hybrid">Hybrid (Both)</option>
            </select>
          </div>
        </div>

        {/* Tag chips (from INTERESTS, max 4) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Event Tags (Max 4 interests)
            </label>
            <span className="text-xs font-semibold text-indigo-600">
              {selectedTags.length} / 4 selected
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Tags power the recommendation algorithm and attendee match scores.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Date & Timing */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
          2. Schedule & Deadlines
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="start-date">
              Start Date & Time *
            </label>
            <input
              id="start-date"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="end-date">
              End Date & Time *
            </label>
            <input
              id="end-date"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="reg-deadline">
              Registration Closes On *
            </label>
            <input
              id="reg-deadline"
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
      </section>

      {/* 3. Pricing, Capacity & Cover */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
          3. Tickets, Capacity & Artwork
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="capacity">
                Total Seat Capacity *
              </label>
              {isEdit && registeredCount > 0 && (
                <span className="text-xs text-amber-700 font-medium">
                  {registeredCount} already registered (min {registeredCount})
                </span>
              )}
            </div>
            <input
              id="capacity"
              type="number"
              min={isEdit ? registeredCount : 1}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="price">
                Ticket Price (₹)
              </label>
              <label className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setPrice(0);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Free Event</span>
              </label>
            </div>
            <input
              id="price"
              type="number"
              min={0}
              disabled={isFree}
              value={isFree ? 0 : price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="cover-image">
            Cover Image URL (Direct image link)
          </label>
          <input
            id="cover-image"
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />

          {coverImage && (
            <div className="mt-3 relative w-full h-40 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
              <img
                src={coverImage}
                alt="Cover Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <span className="absolute bottom-2 right-2 px-2.5 py-0.5 bg-black/60 text-white rounded text-xs">
                Preview
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Venue & Map Geocoding */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="text-lg font-bold text-gray-900">
            4. Venue Location & Coordinates
          </h3>
          <button
            type="button"
            onClick={handleGeocode}
            disabled={geocoding}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition border border-indigo-200 flex items-center space-x-1"
          >
            <span>📍</span>
            <span>{geocoding ? 'Finding on map...' : 'Find on map (Geocode)'}</span>
          </button>
        </div>

        {geocodeMsg.text && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              geocodeMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : geocodeMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            <span>{geocodeMsg.type === 'success' ? '✓' : 'ℹ️'}</span>
            <span>{geocodeMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="venue-name">
              Venue Name *
            </label>
            <input
              id="venue-name"
              type="text"
              required={mode !== 'online'}
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. BKC Innovation Center"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="venue-addr">
              Address *
            </label>
            <input
              id="venue-addr"
              type="text"
              required={mode !== 'online'}
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="e.g. Bandra Kurla Complex"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="venue-city">
              City *
            </label>
            <input
              id="venue-city"
              type="text"
              required={mode !== 'online'}
              value={venueCity}
              onChange={(e) => setVenueCity(e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="lat">
              Latitude (Auto-filled or manual) *
            </label>
            <input
              id="lat"
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="19.0760"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="lng">
              Longitude (Auto-filled or manual) *
            </label>
            <input
              id="lng"
              type="number"
              step="any"
              required
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="72.8777"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
            />
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit('draft')}
          className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm transition disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Save as Draft'}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSubmit('published')}
          className="w-full sm:w-auto px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Event'}
        </button>
      </div>
    </div>
  );
}
