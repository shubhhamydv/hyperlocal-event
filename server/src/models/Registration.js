const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Registration model
 * Tracks an attendee's registration for an event.
 * Unique compound index on { user, event } prevents double-booking.
 * qrToken is a random 24-char hex string (12 random bytes).
 */
const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'cancelled'],
      default: 'registered',
    },
    qrToken: {
      type: String,
      default: () => crypto.randomBytes(12).toString('hex'),
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent same user from having multiple active registrations for the same event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

// toJSON: expose id, hide __v
registrationSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Registration', registrationSchema);
