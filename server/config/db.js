const mongoose = require('mongoose');
const dns = require('dns');

// Node.js uses its own DNS resolver which can fail SRV lookups on some routers.
// Force it to use Google's DNS (supports SRV records required by mongodb+srv://).
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
