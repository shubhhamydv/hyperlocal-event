import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import eventsApi from '../../api/events';
import Loader from '../../components/Loader';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const data = await eventsApi.getEvent(id);
        setEvent(data.event);
      } catch (err) {
        console.error("Failed to load event for editing:", err);
        setFetchError(err.response?.data?.message || err.message || "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleUpdate = async (payload, targetStatus) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      if (targetStatus) {
        payload.status = targetStatus;
      }
      await eventsApi.updateEvent(id, payload);
      navigate('/organizer', {
        state: { message: `Event updated successfully!` }
      });
    } catch (err) {
      console.error("Failed to update event:", err);
      const msg = err.response?.data?.message || err.message || "Failed to update event";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20">
        <Loader message="Loading event details..." />
      </div>
    );
  }

  if (fetchError || !event) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-200 text-center shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-gray-600 mb-6">{fetchError || "The event could not be found."}</p>
        <Link
          to="/organizer"
          className="inline-flex px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isCancelled = event.status === 'cancelled';
  const registeredCount = (event.capacity || 100) - (event.seatsAvailable !== undefined ? event.seatsAvailable : (event.capacity || 100));

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/organizer"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            ← Back to Organizer Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-2">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Edit Event: <span className="text-indigo-600">{event.title}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Update details, adjust capacity, or publish your draft event.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                event.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : event.status === 'draft'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {event.status}
            </span>
          </div>
        </div>

        {/* Cancelled Warning */}
        {isCancelled ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
            <div className="text-2xl font-bold text-red-600">⚠️ Event is Cancelled</div>
            <p className="text-sm text-red-800 max-w-lg mx-auto">
              This event was cancelled. Cancelled events cannot be edited, republished, or modified as per contract rules.
            </p>
            <div className="pt-2">
              <Link
                to="/organizer"
                className="inline-flex px-5 py-2.5 bg-gray-800 text-white font-medium rounded-xl text-sm"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {registeredCount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-xs flex items-center justify-between">
                <span>
                  ℹ️ <strong>{registeredCount} attendees</strong> have already registered for this event. Note that capacity cannot be reduced below {registeredCount}.
                </span>
              </div>
            )}

            <EventForm
              initialData={event}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              serverError={serverError}
              isEdit={true}
              registeredCount={registeredCount}
            />
          </>
        )}
      </div>
    </div>
  );
}
