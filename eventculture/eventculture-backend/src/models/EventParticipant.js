const mongoose = require('mongoose');

const eventParticipantSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organizerCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    registrationId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    ticketType: {
      type: String,
      default: 'General Participant',
      trim: true,
    },
    csvData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'CHECKED_IN', 'CANCELLED'],
      default: 'REGISTERED',
      index: true,
    },
    role: {
      type: String,
      enum: ['PARTICIPANT', 'GUEST', 'STAFF'],
      default: 'PARTICIPANT',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate participant per event by email or phone
eventParticipantSchema.index({ eventId: 1, email: 1 });
eventParticipantSchema.index({ eventId: 1, mobileNumber: 1 });

module.exports = mongoose.model('EventParticipant', eventParticipantSchema);
