const mongoose = require('mongoose');

const userPassSchema = new mongoose.Schema(
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
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventParticipant',
      required: true,
      index: true,
    },
    passTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PassType',
      required: true,
      index: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'USED', 'EXPIRED', 'DISABLED'],
      default: 'ACTIVE',
      index: true,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    scanLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find all passes for a participant in an event
userPassSchema.index({ participantId: 1, eventId: 1 });

module.exports = mongoose.model('UserPass', userPassSchema);
