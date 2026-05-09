const prisma = require('../prisma');

const connectDB = async () => {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('SQLite Database Connected via Prisma');
  } catch (error) {
    console.error('Database Connection Error Stack:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
