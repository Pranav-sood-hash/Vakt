const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the backend root directory, allowing overrides
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';

// Ensure the URL is in the format expected by the adapter
const formattedUrl = url.startsWith('file:') ? url : `file:${url}`;

const adapter = new PrismaBetterSqlite3({ url: formattedUrl });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
