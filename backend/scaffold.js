const fs = require('fs');
const path = require('path');

const files = {
  '.env': `PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/vakt
JWT_ACCESS_SECRET=supersecretaccess
JWT_REFRESH_SECRET=supersecretrefresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=http://localhost:3000
NODE_ENV=development
`,
  '.env.example': `PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/vakt
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=http://localhost:3000
NODE_ENV=development
`,
  'server.js': `const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
const cronJobs = require('./src/cron');
require('dotenv').config();

const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Connected to Database successfully.');
    
    // Start cron jobs
    cronJobs.init();
    
    app.listen(port, () => {
      console.log(\`Server is running on port \${port}\`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
`,
  'src/app.js': `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorMiddleware = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const timetableRoutes = require('./routes/timetable.routes');
const pointsRoutes = require('./routes/points.routes');
const focusRoutes = require('./routes/focus.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorMiddleware);

module.exports = app;
`,
  'src/utils/response.utils.js': `exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

exports.errorResponse = (res, error, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message, error });
};

exports.paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: { page, limit, total, totalPages }
  });
};
`,
  'src/middleware/error.middleware.js': `const { errorResponse } = require('../utils/response.utils');

module.exports = (err, req, res, next) => {
  console.error(err);
  
  if (err.name === 'ZodError') {
    return errorResponse(res, err.errors, 'Validation Error', 400);
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  errorResponse(res, err.name || 'SERVER_ERROR', message, statusCode);
};
`,
  'src/middleware/auth.middleware.js': `const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response.utils');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'INVALID_TOKEN', 'Token is invalid or expired', 401);
  }
};
`,
  'src/middleware/validate.middleware.js': `const { errorResponse } = require('../utils/response.utils');

module.exports = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return errorResponse(res, error.errors, 'Validation Error', 400);
  }
};
`,
  'src/utils/constants.js': `module.exports = {
  RANK_THRESHOLDS: {
    BRONZE_I: 0,
    BRONZE_II: 100,
    BRONZE_III: 250,
    SILVER_I: 500,
    SILVER_II: 800,
    SILVER_III: 1200,
    GOLD: 1800,
    PLATINUM: 2600,
    DIAMOND: 3600,
    EMERALD: 5000,
    ULTRA_DISCIPLINED: 7000
  },
  XP_VALUES: {
    TASK_LOW: 5,
    TASK_MEDIUM: 10,
    TASK_HIGH: 20,
    SLOT_ADDED: 2,
    FOCUS_PER_HOUR: 15,
    MISSED_TASK_PENALTY: 5,
    RANK_UP_BONUS: 50
  }
};
`,
  'src/cron/index.js': `const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Import other cron jobs

exports.init = () => {
  // expiredTasks: runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running expired tasks cron...');
    // implementation
  });

  // dailyReset: runs at 00:00 daily
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily reset cron...');
    // implementation
  });

  // streakCheck: runs at 00:01 daily
  cron.schedule('1 0 * * *', async () => {
    console.log('Running streak check cron...');
    // implementation
  });
};
`,
  'src/utils/jwt.utils.js': `const jwt = require('jsonwebtoken');

exports.generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES });
  return { accessToken, refreshToken };
};
`
};

for (const [filepath, content] of Object.entries(files)) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, content);
}

console.log('Basic scaffold generated.');
