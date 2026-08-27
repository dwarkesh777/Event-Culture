const mongoose = require('mongoose');

const passTypeSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['ENTRY', 'FOOD', 'GOODIE_BAG', 'WORKSHOP', 'VIP', 'PARKING', 'CUSTOM'],
      default: 'ENTRY',
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
    icon: {
      type: String,
      default: 'ticket-outline',
    },
    color: {
      type: String,
      default: '#1565F9',
    },
    requiredPermission: {
      type: String,
      enum: ['ENTRY', 'FOOD', 'GOODIE_BAG', 'WORKSHOP', 'VIP', 'PARKING', 'ALL'],
      default: 'ENTRY',
    },
    targetRole: {
      type: String,
      enum: ['PARTICIPANT', 'GUEST', 'STAFF', 'ALL'],
      default: 'ALL',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PassType', passTypeSchema);
