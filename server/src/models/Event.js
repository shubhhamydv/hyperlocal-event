const mongoose = require('mongoose');
const { Schema } = mongoose;

function ensureStartBeforeEnd(value) {
  if (this.endDate && value > this.endDate) {
    throw new Error('startDate must be before or equal to endDate');
  }
}

function ensureRegDeadlineBeforeStart(value) {
  if (this.startDate && value > this.startDate) {
    throw new Error('registrationDeadline must be before or equal to startDate');
  }
}

const eventSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["Hackathon","Workshop","Meetup","Conference","Networking","Webinar","Other"],
    required: true,
  },
  startDate: { type: Date, required: true, validate: ensureStartBeforeEnd },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true, validate: ensureRegDeadlineBeforeStart },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  mode: { type: String, enum: ['offline','online','hybrid'], required: true },
  price: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  seatsAvailable: { type: Number, min: 0 },
  tags: {
    type: [String],
    validate: {
      validator: function (arr) {
        const { INTERESTS } = require('../constants/interests');
        return arr.length <= 4 && arr.every(tag => INTERESTS.includes(tag));
      },
      message: props => `Tags must be <=4 and from predefined interests`
    },
  },
  coverImage: { type: String },
  status: { type: String, enum: ['draft','published','cancelled'], default: 'draft' },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

eventSchema.index({ location: '2dsphere' });

// Virtual: registrationOpen
eventSchema.virtual('registrationOpen').get(function () {
  const now = new Date();
  return this.status === 'published' && this.seatsAvailable > 0 && this.registrationDeadline >= now;
});

// Virtual: registeredCount
eventSchema.virtual('registeredCount').get(function () {
  return this.capacity - (this.seatsAvailable != null ? this.seatsAvailable : this.capacity);
});

eventSchema.pre('save', function (next) {
  if (this.isNew && this.seatsAvailable == null) {
    this.seatsAvailable = this.capacity;
  }
  if (this.location && this.location.type !== 'Point') {
    return next(new Error('Location type must be Point'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
