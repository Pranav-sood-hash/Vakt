const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the backend root directory, allowing overrides
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';

// Ensure the URL is in the format expected by better-sqlite3 (remove 'file:' prefix if present)
const dbPath = url.startsWith('file:') ? url.replace('file:', '') : url;
// Prisma 7 uses a new config system. For driver adapters like better-sqlite3,
// we pass the config object (with url) to the adapter.
const adapter = new PrismaBetterSqlite3({
  url: url
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
