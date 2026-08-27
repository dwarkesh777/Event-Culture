const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    passId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPass',
      index: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventParticipant',
      index: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    passTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PassType',
      index: true,
    },
    scanTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'ALREADY_USED', 'INVALID', 'EXPIRED', 'UNAUTHORIZED'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    deviceId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast analytics queries
scanLogSchema.index({ eventId: 1, result: 1, createdAt: -1 });
scanLogSchema.index({ volunteerId: 1, createdAt: -1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
