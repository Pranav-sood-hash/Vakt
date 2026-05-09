const fs = require('fs');
const path = require('path');

const files = {
  'src/validators/auth.validator.js': `const { z } = require('zod');

exports.signupSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});
`,
  'src/routes/auth.routes.js': `const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validators/auth.validator');

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;
`,
  'src/controllers/auth.controller.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { generateTokens } = require('../utils/jwt.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');

exports.signup = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return errorResponse(res, 'USER_EXISTS', 'Email or username already in use', 409);
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        email,
        passwordHash,
        points: { create: {} },
        settings: { create: {} }
      }
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'ACHIEVEMENT', // fallback type
        title: 'Account Created',
        detail: 'Welcome to Vakt'
      }
    });

    const { passwordHash: _, refreshToken: __, ...userWithoutSensitive } = user;

    return successResponse(res, {
      user: userWithoutSensitive,
      accessToken,
      refreshToken
    }, 'Signup successful', 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { points: true, settings: true }
    });

    if (!user) return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveDate: new Date(), refreshToken }
    });

    const { passwordHash, refreshToken: _, ...userWithoutSensitive } = user;

    return successResponse(res, {
      user: userWithoutSensitive,
      accessToken,
      refreshToken
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real app we might decode the token and clear the refresh token in DB
      // But for simple logout, we just return success
    }
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  // Add refresh logic here
  return successResponse(res, null, 'Tokens refreshed');
};
`,
  'src/routes/user.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { successResponse } = require('../utils/response.utils');

router.use(authMiddleware);

router.get('/me', (req, res) => {
  successResponse(res, { user: req.user }, 'Current user');
});

module.exports = router;
`,
  'src/routes/task.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const taskController = require('../controllers/task.controller');

router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.patch('/:id/complete', taskController.completeTask);

module.exports = router;
`,
  'src/controllers/task.controller.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');
const { XP_VALUES } = require('../utils/constants');

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.userId, status: 'PENDING' }
    });
    return successResponse(res, tasks);
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDateTime } = req.body;
    const task = await prisma.task.create({
      data: {
        userId: req.user.userId,
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDateTime: new Date(dueDateTime)
      }
    });
    return successResponse(res, task, 'Task created', 201);
  } catch (error) {
    next(error);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== req.user.userId) {
      return errorResponse(res, 'NOT_FOUND', 'Task not found', 404);
    }
    
    let xp = XP_VALUES.TASK_MEDIUM;
    if (task.priority === 'HIGH') xp = XP_VALUES.TASK_HIGH;
    if (task.priority === 'LOW') xp = XP_VALUES.TASK_LOW;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date(), xpAwarded: xp }
    });

    await prisma.userPoints.update({
      where: { userId: req.user.userId },
      data: {
        totalXP: { increment: xp },
        tasksCompleted: { increment: 1 }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        type: 'TASK_COMPLETE',
        title: \`Completed Task: \${task.title}\`,
        xpDelta: xp
      }
    });

    return successResponse(res, updatedTask, 'Task completed');
  } catch (error) {
    next(error);
  }
};
`,
  'src/routes/timetable.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.use(authMiddleware);
router.get('/', (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'src/routes/points.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.use(authMiddleware);
router.get('/', (req, res) => res.json({ success: true, data: {} }));
module.exports = router;
`,
  'src/routes/focus.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.use(authMiddleware);
router.post('/start', (req, res) => res.json({ success: true, data: {} }));
module.exports = router;
`,
  'src/routes/notification.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.use(authMiddleware);
router.get('/', (req, res) => res.json({ success: true, data: [] }));
module.exports = router;
`,
  'src/routes/settings.routes.js': `const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
router.use(authMiddleware);
router.get('/', (req, res) => res.json({ success: true, data: {} }));
module.exports = router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, content);
}

console.log('Controllers, Routes, Validators scaffold generated.');
