const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Exits process on failure — we can't serve without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/hyperlocal-events'
    );
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[db] Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
