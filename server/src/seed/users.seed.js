/**
 * seed/users.seed.js
 *
 * Creates demo users if they don't already exist.
 * Safe to run multiple times — skips existing accounts.
 *
 * Usage:  npm run seed:users
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const SEED_USERS = [
  {
    name: 'Demo Organizer',
    email: 'organizer@demo.com',
    password: 'Demo@123',
    role: 'organizer',
    interests: ['Hackathons', 'Entrepreneurship', 'Networking'],
    city: 'Mumbai',
  },
  {
    name: 'Demo Attendee',
    email: 'attendee@demo.com',
    password: 'Demo@123',
    role: 'attendee',
    interests: ['Web Development', 'Artificial Intelligence', 'UI/UX Design'],
    city: 'Bangalore',
  },
];

async function seedUsers() {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const userData of SEED_USERS) {
    const exists = await User.findOne({ email: userData.email });
    if (exists) {
      console.log(`[seed] SKIP  ${userData.email}  (already exists)`);
      skipped++;
      continue;
    }

    await User.create(userData);
    console.log(`[seed] CREATE ${userData.role}: ${userData.email}`);
    created++;
  }

  console.log(`\n[seed] Done ── created: ${created}  skipped: ${skipped}`);
  await mongoose.disconnect();
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
