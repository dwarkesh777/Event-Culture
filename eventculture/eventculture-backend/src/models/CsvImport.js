const mongoose = require('mongoose');

const csvImportSchema = new mongoose.Schema(
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    importedCount: {
      type: Number,
      default: 0,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    invalidCount: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        row: Number,
        reason: String,
        data: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CsvImport', csvImportSchema);
