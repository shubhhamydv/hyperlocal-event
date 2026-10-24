import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import eventsApi from '../../api/events';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleCreate = async (payload, targetStatus) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      if (targetStatus) {
        payload.status = targetStatus;
      }
      await eventsApi.createEvent(payload);
      navigate('/organizer', {
        state: { message: `Event successfully created as ${payload.status || 'draft'}!` }
      });
    } catch (err) {
      console.error("Failed to create event:", err);
      const msg = err.response?.data?.message || err.message || "Failed to create event. Please check inputs.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create a New Event
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Host a hackathon, workshop, or meetup. You can publish directly or save as a draft.
          </p>
        </div>

        {/* Form */}
        <EventForm
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          serverError={serverError}
          isEdit={false}
        />
      </div>
    </div>
  );
}
