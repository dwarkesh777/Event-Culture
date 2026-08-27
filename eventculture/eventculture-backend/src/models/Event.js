const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizerCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      default: '',
    },
    folderPath: {
      type: String,
      trim: true,
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
    location: {
      venue: { type: String, default: '' },
      city: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    bannerImage: {
      url: { type: String, default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200' },
      publicId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
