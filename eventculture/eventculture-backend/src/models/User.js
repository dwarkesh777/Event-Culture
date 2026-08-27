const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobileNumber: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ORGANIZER', 'VOLUNTEER', 'ADMIN'],
      default: 'USER',
      index: true,
    },
    profileImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    organizerCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      default: '',
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
    },
    folderName: {
      type: String,
      trim: true,
      default: '',
    },
    assignedOrganizerCode: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
