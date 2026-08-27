const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/database');
const User = require('../models/User');
const Event = require('../models/Event');
const EventParticipant = require('../models/EventParticipant');
const PassType = require('../models/PassType');
const UserPass = require('../models/UserPass');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const ScanLog = require('../models/ScanLog');
const { generatePassQRToken } = require('../utils/token');

const seedData = async () => {
  try {
    console.log('🌱 Connecting to database for seeding...');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await EventParticipant.deleteMany({});
    await PassType.deleteMany({});
    await UserPass.deleteMany({});
    await VolunteerAssignment.deleteMany({});
    await ScanLog.deleteMany({});

    console.log('👤 Creating Users (Organizer, Volunteers, Participants)...');

    // 1. Create Organizer
    const organizer = await User.create({
      name: 'Alex Rivera (Event Lead)',
      email: 'organizer@eventculture.io',
      mobileNumber: '9876543210',
      role: 'ORGANIZER',
      isVerified: true,
      profileImage: {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        publicId: 'demo_organizer',
      },
    });

    // 2. Create Volunteers
    const volunteerAll = await User.create({
      name: 'Maya Patel (Lead Volunteer)',
      email: 'volunteer@eventculture.io',
      mobileNumber: '9988776655',
      role: 'VOLUNTEER',
      isVerified: true,
      profileImage: {
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
        publicId: 'demo_vol_1',
      },
    });

    const volunteerEntry = await User.create({
      name: 'Sarah Jenkins',
      email: 'volunteer.entry@eventculture.io',
      mobileNumber: '9812345678',
      role: 'VOLUNTEER',
      isVerified: true,
    });

    const volunteerFood = await User.create({
      name: 'David Chen',
      email: 'volunteer.food@eventculture.io',
      mobileNumber: '9876501234',
      role: 'VOLUNTEER',
      isVerified: true,
    });

    // 3. Create Sample Participant User
    const participantUser = await User.create({
      name: 'Jordan Smith',
      email: 'participant@eventculture.io',
      mobileNumber: '1234567890',
      role: 'USER',
      isVerified: true,
      profileImage: {
        url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
        publicId: 'demo_participant',
      },
    });

    console.log('🎪 Creating Featured Event...');
    const startDate = new Date();
    const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const event = await Event.create({
      organizerId: organizer._id,
      name: 'TechNexus Global Hackathon 2026',
      description:
        'The premier 48-hour global developer and AI innovation summit bringing together 2,500+ builders, creators, mentors, and industry pioneers.',
      location: {
        venue: 'Metro Innovation Center - Grand Pavilion',
        city: 'San Francisco, CA',
        address: '500 Tech Innovation Way, San Francisco, CA 94107',
      },
      startDate,
      endDate,
      bannerImage: {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        publicId: 'demo_event_banner',
      },
      status: 'ONGOING',
    });

    console.log('🎫 Creating Pass Types...');
    const passTypeEntry = await PassType.create({
      eventId: event._id,
      name: 'Event Entry Pass',
      description: 'Official access badge to all conference halls and hacking stages.',
      category: 'ENTRY',
      scanLimit: 1,
      validFrom: startDate,
      validUntil: endDate,
      icon: 'ticket-outline',
      color: '#1565F9',
      requiredPermission: 'ENTRY',
    });

    const passTypeLunch = await PassType.create({
      eventId: event._id,
      name: 'Buffet Lunch & Beverage Pass',
      description: 'Full access to organic catering and artisan refreshment counters.',
      category: 'FOOD',
      scanLimit: 1,
      validFrom: startDate,
      validUntil: endDate,
      icon: 'restaurant-outline',
      color: '#22C55E',
      requiredPermission: 'FOOD',
    });

    const passTypeGoodie = await PassType.create({
      eventId: event._id,
      name: 'Hacker Swag & Goodie Bag',
      description: 'Limited edition TechNexus backpack, smart hoodie, NFC badge, and sponsor perks.',
      category: 'GOODIE_BAG',
      scanLimit: 1,
      validFrom: startDate,
      validUntil: endDate,
      icon: 'gift-outline',
      color: '#8B5CF6',
      requiredPermission: 'GOODIE_BAG',
    });

    const passTypeWorkshop = await PassType.create({
      eventId: event._id,
      name: 'VIP AI Masterclass Workshop',
      description: 'Interactive deep-dive workshop with frontier AI research leads.',
      category: 'WORKSHOP',
      scanLimit: 2,
      validFrom: startDate,
      validUntil: endDate,
      icon: 'school-outline',
      color: '#F59E0B',
      requiredPermission: 'WORKSHOP',
    });

    console.log('📋 Assigning Volunteers to Event...');
    // All-access volunteer
    await VolunteerAssignment.create({
      volunteerId: volunteerAll._id,
      eventId: event._id,
      permissions: ['ENTRY', 'FOOD', 'GOODIE_BAG', 'WORKSHOP', 'VIP', 'PARKING', 'ALL'],
      allowedPassTypes: [passTypeEntry._id, passTypeLunch._id, passTypeGoodie._id, passTypeWorkshop._id],
      isActive: true,
    });

    // Entry-only volunteer
    await VolunteerAssignment.create({
      volunteerId: volunteerEntry._id,
      eventId: event._id,
      permissions: ['ENTRY'],
      allowedPassTypes: [passTypeEntry._id],
      isActive: true,
    });

    // Food-only volunteer
    await VolunteerAssignment.create({
      volunteerId: volunteerFood._id,
      eventId: event._id,
      permissions: ['FOOD', 'GOODIE_BAG'],
      allowedPassTypes: [passTypeLunch._id, passTypeGoodie._id],
      isActive: true,
    });

    console.log('👥 Creating Participants & Assigning Digital QR Passes...');

    const sampleParticipantsData = [
      {
        name: 'Jordan Smith',
        email: 'participant@eventculture.io',
        mobileNumber: '1234567890',
        registrationId: 'REG-TN-1001',
        ticketType: 'VIP Hacker',
        userId: participantUser._id,
        csvData: {
          college: 'Stanford University',
          branch: 'Computer Science',
          teamName: 'Neural Ninjas',
          city: 'Palo Alto',
          github: 'jordansmith',
        },
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@techmail.com',
        mobileNumber: '9123456780',
        registrationId: 'REG-TN-1002',
        ticketType: 'General Participant',
        csvData: {
          college: 'UC Berkeley',
          branch: 'Electrical Engineering',
          teamName: 'Quantum Coders',
          city: 'Berkeley',
        },
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.v@devgroup.org',
        mobileNumber: '9123456781',
        registrationId: 'REG-TN-1003',
        ticketType: 'VIP Hacker',
        csvData: {
          college: 'MIT',
          branch: 'Robotics',
          teamName: 'CyberFlow',
          city: 'Cambridge',
        },
      },
      {
        name: 'Aisha Al-Mansoor',
        email: 'aisha.m@innovate.io',
        mobileNumber: '9123456782',
        registrationId: 'REG-TN-1004',
        ticketType: 'General Participant',
        csvData: {
          college: 'Georgia Tech',
          branch: 'Data Science',
          teamName: 'DataDynamos',
          city: 'Atlanta',
        },
      },
      {
        name: 'Liam O\'Connor',
        email: 'liam.oc@startupclub.com',
        mobileNumber: '9123456783',
        registrationId: 'REG-TN-1005',
        ticketType: 'General Participant',
        csvData: {
          college: 'UT Austin',
          branch: 'Software Engineering',
          teamName: 'Longhorn Devs',
          city: 'Austin',
        },
      },
    ];

    for (const pData of sampleParticipantsData) {
      const participant = await EventParticipant.create({
        eventId: event._id,
        ...pData,
        status: pData.name === 'Elena Rostova' ? 'CHECKED_IN' : 'REGISTERED',
      });

      // Ensure User account exists
      await User.findOneAndUpdate(
        { email: participant.email },
        {
          $setOnInsert: {
            name: participant.name,
            email: participant.email,
            mobileNumber: participant.mobileNumber,
            role: 'USER',
            isVerified: true,
          },
        },
        { upsert: true }
      );

      // Create passes for participant
      const pPassTypes = [passTypeEntry, passTypeLunch, passTypeGoodie];
      if (participant.ticketType.includes('VIP')) {
        pPassTypes.push(passTypeWorkshop);
      }

      for (const pt of pPassTypes) {
        const qrToken = generatePassQRToken();
        const isElenaEntry = participant.name === 'Elena Rostova' && pt.category === 'ENTRY';

        const userPass = await UserPass.create({
          eventId: event._id,
          participantId: participant._id,
          passTypeId: pt._id,
          qrToken,
          status: isElenaEntry ? 'USED' : 'ACTIVE',
          usedCount: isElenaEntry ? 1 : 0,
          scanLimit: pt.scanLimit,
          validFrom: pt.validFrom,
          validUntil: pt.validUntil,
        });

        // Add a scan log for Elena's used pass
        if (isElenaEntry) {
          await ScanLog.create({
            eventId: event._id,
            passId: userPass._id,
            participantId: participant._id,
            volunteerId: volunteerAll._id,
            passTypeId: pt._id,
            scanTime: new Date(Date.now() - 3600 * 1000),
            result: 'SUCCESS',
            message: 'Pass checked in successfully.',
            location: 'Main Gate Entrance 1',
          });
        }
      }
    }

    console.log(`
=========================================================
🎉 EVENTCULTURE DATABASE SEEDED SUCCESSFULLY!
=========================================================

DEMO LOGIN CREDENTIALS:

1. ORGANIZER APP:
   Email: organizer@eventculture.io
   (OTP will be output to console / terminal)

2. VOLUNTEER APP:
   Email: volunteer@eventculture.io (All Permissions)
   Email: volunteer.entry@eventculture.io (Entry Only)
   Email: volunteer.food@eventculture.io (Food/Goodies)

3. USER / PARTICIPANT APP:
   Mobile Number: 1234567890 (or +1234567890)
   (Registered Email: participant@eventculture.io)

=========================================================
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
