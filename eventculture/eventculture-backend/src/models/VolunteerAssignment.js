const mongoose = require('mongoose');

const volunteerAssignmentSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    allowedPassTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PassType',
      },
    ],
    permissions: [
      {
        type: String,
        enum: ['ENTRY', 'FOOD', 'GOODIE_BAG', 'WORKSHOP', 'VIP', 'PARKING', 'ALL'],
        default: 'ENTRY',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so a volunteer can only have one assignment record per event
volunteerAssignmentSchema.index({ volunteerId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerAssignment', volunteerAssignmentSchema);
