import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import registrationsApi from '../api/registrations';

export default function RegisterButton({ event, onSeatsChange, onStatusChange }) {
  const { user, isAuthenticated } = useAuth();
  const eventId = event?._id || event?.id;

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Check initial registration status for attendees
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!isAuthenticated || !user || user.role === 'organizer' || !eventId) {
        return;
      }
      setCheckingStatus(true);
      setErrorMsg('');
      try {
        const res = await registrationsApi.status(eventId);
        if (isMounted) {
          setIsRegistered(Boolean(res.registered));
          setRegistration(res.registration || null);
          if (onStatusChange) {
            onStatusChange(Boolean(res.registered), res.registration);
          }
        }
      } catch (err) {
        // Not fatal, just assume not registered
        console.warn('Failed to check registration status:', err);
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [eventId, isAuthenticated, user]);

  // 1. Organizer state: Hidden
  if (user?.role === 'organizer') {
    return null;
  }

  // 2. Not logged in state: "Login to register"
  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        <Link
          to="/login"
          state={{ from: `/events/${eventId}` }}
          className="w-full flex items-center justify-center py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-sm text-center"
        >
          Login to register
        </Link>
        <p className="text-xs text-gray-500 text-center">
          Attendees can register for free or paid events.
        </p>
      </div>
    );
  }

  // Handle Register
  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await registrationsApi.register(eventId);
      setIsRegistered(true);
      setRegistration(res.registration);
      setSuccessMsg("You're Registered ✓");
      if (onSeatsChange) {
        onSeatsChange(-1);
      }
      if (onStatusChange) {
        onStatusChange(true, res.registration);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    if (!registration?.id) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    setShowConfirmCancel(false);

    try {
      await registrationsApi.cancel(registration.id);
      setIsRegistered(false);
      setRegistration(null);
      setSuccessMsg('Registration cancelled successfully.');
      if (onSeatsChange) {
        onSeatsChange(1);
      }
      if (onStatusChange) {
        onStatusChange(false, null);
      }
    } catch (err) {
      console.error('Cancel registration failed:', err);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to cancel registration.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Loading check status
  if (checkingStatus) {
    return (
      <div className="w-full py-3 px-4 bg-gray-100 text-gray-500 text-center font-medium text-sm rounded-xl animate-pulse">
        Checking status...
      </div>
    );
  }

  // 4. Registered state: "You're Registered ✓" plus a Cancel button with confirm
  if (isRegistered) {
    return (
      <div className="space-y-3">
        <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-sm rounded-xl flex items-center justify-center space-x-2">
          <span>✓</span>
          <span>You're Registered</span>
        </div>

        {registration?.qrToken && (
          <div className="text-center">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
              Ticket ID: {registration.qrToken.slice(0, 8)}...
            </span>
          </div>
        )}

        {showConfirmCancel ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-center">
            <p className="text-xs text-red-700 font-semibold">
              Cancel your registration for this event?
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
              >
                {loading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setShowConfirmCancel(false)}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium rounded-lg transition"
              >
                Keep Seat
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmCancel(true)}
            disabled={loading}
            className="w-full py-2 px-4 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl border border-red-200 transition text-center"
          >
            Cancel Registration
          </button>
        )}

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center font-medium">
            {successMsg}
          </div>
        )}
      </div>
    );
  }

  // 5. Registration Closed or Full evaluation
  const now = new Date();
  const deadlinePassed = event?.registrationDeadline && new Date(event.registrationDeadline) < now;
  const isFull = event?.seatsAvailable !== undefined && event.seatsAvailable <= 0;
  const isCancelled = event?.status === 'cancelled';
  const isDraft = event?.status === 'draft';
  const registrationClosed =
    event?.registrationOpen === false || deadlinePassed || isFull || isCancelled || isDraft;

  if (registrationClosed) {
    const disabledLabel = isFull
      ? 'Event full'
      : isCancelled
      ? 'Event cancelled'
      : deadlinePassed
      ? 'Registration deadline passed'
      : 'Registration closed';

    return (
      <div className="space-y-2">
        <button
          disabled
          className="w-full py-3 px-4 bg-gray-200 text-gray-500 font-bold text-sm rounded-xl cursor-not-allowed text-center"
        >
          {disabledLabel}
        </button>
        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  // 6. Active state: "Register Now"
  return (
    <div className="space-y-2">
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span>Registering...</span>
          </>
        ) : (
          <span>
            {event?.price === 0 || event?.price === '0'
              ? 'Register Now (Free)'
              : `Register Now • ₹${event?.price}`}
          </span>
        )}
      </button>

      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg text-center font-medium">
          {successMsg}
        </div>
      )}
    </div>
  );
}
