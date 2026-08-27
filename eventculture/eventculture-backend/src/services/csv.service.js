const csv = require('csv-parser');
const { Readable } = require('stream');
const EventParticipant = require('../models/EventParticipant');
const CsvImport = require('../models/CsvImport');
const User = require('../models/User');

/**
 * Helper to normalize phone numbers (strip spaces, dashes, parentheses)
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.toString().replace(/[\s\-()]/g, '').trim();
};

/**
 * Helper to normalize email
 */
const normalizeEmail = (email) => {
  if (!email) return '';
  return email.toString().trim().toLowerCase();
};

/**
 * Preview CSV file: Extracts headers and first 10 sample rows
 */
const previewCsv = async (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];

    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('headers', (h) => {
        headers = h.map((header) => header.trim());
      })
      .on('data', (data) => {
        if (results.length < 10) {
          results.push(data);
        }
      })
      .on('end', () => {
        resolve({
          headers,
          sampleRows: results,
          totalPreviewCount: results.length,
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

/**
 * Process and Import CSV data with column mapping
 * @param {Buffer} buffer - CSV file buffer
 * @param {string} eventId - MongoDB Event ID
 * @param {string} userId - Organizer User ID
 * @param {string} fileName - Uploaded file name
 * @param {Object} columnMapping - Mapping e.g. { name: "Full Name", email: "Email Address", mobileNumber: "Contact Number", registrationId: "Reg ID", ticketType: "Pass Type" }
 * @param {string} role - Participant role (PARTICIPANT, GUEST, STAFF)
 */
const importCsv = async (buffer, eventId, userId, fileName, columnMapping = {}, role = 'PARTICIPANT') => {
  return new Promise((resolve, reject) => {
    const rawRows = [];

    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (data) => rawRows.push(data))
      .on('end', async () => {
        try {
          const totalRows = rawRows.length;
          const successfulParticipants = [];
          const duplicates = [];
          const invalidRows = [];

          // Preload existing participants for this event to detect duplicate emails or phone numbers
          const existingParticipants = await EventParticipant.find({ eventId }).select('email mobileNumber registrationId role');
          const existingEmailsMap = new Map(existingParticipants.filter(p => p.email).map((p) => [p.email.toLowerCase(), p.role]));
          const existingPhonesMap = new Map(existingParticipants.filter(p => p.mobileNumber).map((p) => [normalizePhone(p.mobileNumber), p.role]));
          const existingRegIds = new Set(existingParticipants.map((p) => (p.registrationId ? p.registrationId.toLowerCase() : '')));

          const batchEmails = new Set();
          const batchPhones = new Set();

          // Field map defaults
          const nameCol = columnMapping.name || 'Name';
          const emailCol = columnMapping.email || 'Email';
          const mobileCol = columnMapping.mobileNumber || 'Mobile Number';
          const regIdCol = columnMapping.registrationId || 'Registration ID';
          const ticketTypeCol = columnMapping.ticketType || 'Ticket Type';

          for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const rowNum = i + 1;

            // Resolve values based on mapping or key fuzzy matching
            const findVal = (primaryKey, fallbacks) => {
              if (row[primaryKey] !== undefined) return row[primaryKey];
              for (const fb of fallbacks) {
                const foundKey = Object.keys(row).find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === fb.toLowerCase().replace(/[^a-z0-9]/g, ''));
                if (foundKey && row[foundKey] !== undefined) return row[foundKey];
              }
              return '';
            };

            const rawName = (findVal(nameCol, ['Name', 'Full Name', 'Participant Name', 'First Name']) || '').toString().trim();
            const rawEmail = normalizeEmail(findVal(emailCol, ['Email', 'Email Address', 'Mail']));
            const rawMobile = normalizePhone(findVal(mobileCol, ['Mobile Number', 'Phone', 'Contact', 'Mobile', 'Phone Number', 'WhatsApp Number']));
            const rawRegId = (findVal(regIdCol, ['Registration ID', 'Reg ID', 'Ticket ID', 'Booking ID', 'ID']) || '').toString().trim();
            const rawTicketType = (findVal(ticketTypeCol, ['Ticket Type', 'Pass Type', 'Category', 'Role']) || 'General Participant').toString().trim();

            // Validate Required Fields
            if (!rawName || !rawEmail || !rawMobile) {
              invalidRows.push({
                row: rowNum,
                reason: 'Missing required field (Name, Email, or Mobile Number)',
                data: row,
              });
              continue;
            }

            // Email validation format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(rawEmail)) {
              invalidRows.push({
                row: rowNum,
                reason: `Invalid email address format: ${rawEmail}`,
                data: row,
              });
              continue;
            }

            // Check duplicates within batch or database
            if (existingEmailsMap.has(rawEmail)) {
              duplicates.push({
                row: rowNum,
                reason: `${rawName || rawEmail} is already a ${existingEmailsMap.get(rawEmail)} for this event`,
                data: row,
              });
              continue;
            }
            if (batchEmails.has(rawEmail)) {
              duplicates.push({
                row: rowNum,
                reason: `Duplicate email address in current CSV: ${rawEmail}`,
                data: row,
              });
              continue;
            }

            if (existingPhonesMap.has(rawMobile)) {
              duplicates.push({
                row: rowNum,
                reason: `${rawName || rawMobile} is already a ${existingPhonesMap.get(rawMobile)} for this event`,
                data: row,
              });
              continue;
            }
            if (batchPhones.has(rawMobile)) {
              duplicates.push({
                row: rowNum,
                reason: `Duplicate mobile number in current CSV: ${rawMobile}`,
                data: row,
              });
              continue;
            }

            // Capture custom attributes into csvData
            const knownColumns = new Set([nameCol, emailCol, mobileCol, regIdCol, ticketTypeCol]);
            const csvData = {};
            for (const [k, v] of Object.entries(row)) {
              if (!knownColumns.has(k) && v !== undefined && v !== '') {
                csvData[k] = v;
              }
            }

            // Fetch event details to obtain organizer folder metadata
            const Event = require('../models/Event');
            const event = await Event.findById(eventId);
            const organizerId = event ? event.organizerId : userId;
            const organizerCode = event ? event.organizerCode : '';

            // Track to prevent in-file duplicates
            batchEmails.add(rawEmail);
            batchPhones.add(rawMobile);

            successfulParticipants.push({
              eventId,
              organizerId,
              organizerCode,
              name: rawName,
              email: rawEmail,
              mobileNumber: rawMobile,
              registrationId: rawRegId || `REG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
              ticketType: rawTicketType,
              role,
              csvData,
              status: 'REGISTERED',
            });
          }

          // Bulk insert valid participants into MongoDB
          let insertedParticipants = [];
          if (successfulParticipants.length > 0) {
            insertedParticipants = await EventParticipant.insertMany(successfulParticipants, { ordered: false });

            // Also ensure User records exist for user app authentication matching
            for (const p of insertedParticipants) {
              await User.findOneAndUpdate(
                { email: p.email },
                {
                  $setOnInsert: {
                    name: p.name,
                    email: p.email,
                    mobileNumber: p.mobileNumber,
                    role: 'USER',
                    isVerified: true,
                  },
                  $set: {
                    assignedOrganizerCode: p.organizerCode || '',
                  },
                },
                { upsert: true, new: true }
              );
            }
          }

          // Record CSV Import Audit Log
          const importRecord = await CsvImport.create({
            eventId,
            organizerId: successfulParticipants.length > 0 ? successfulParticipants[0].organizerId : null,
            organizerCode: successfulParticipants.length > 0 ? successfulParticipants[0].organizerCode : null,
            uploadedBy: userId,
            fileName: fileName || 'participants.csv',
            totalRows,
            importedCount: insertedParticipants.length,
            duplicateCount: duplicates.length,
            invalidCount: invalidRows.length,
            errors: [...invalidRows, ...duplicates],
          });

          resolve({
            importId: importRecord._id,
            totalRows,
            importedCount: insertedParticipants.length,
            duplicateCount: duplicates.length,
            invalidCount: invalidRows.length,
            errors: importRecord.errors,
          });
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

module.exports = {
  previewCsv,
  importCsv,
  normalizePhone,
  normalizeEmail,
};
